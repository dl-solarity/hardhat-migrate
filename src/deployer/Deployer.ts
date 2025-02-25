import debug from "debug";

import { isAddress, Signer } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError, getChainId, isDeployedContractAddress } from "../utils";

import { MigrateError } from "../errors";

import { SEND_NATIVE_TX_NAME } from "../constants";

import { Adapter } from "./adapters/Adapter";
import { BytecodeAdapter } from "./adapters/BytecodeAdapter";

import { OverridesAndLibs } from "../types/deployer";
import { Instance, TypedArgs } from "../types/adapter";
import { KeyTransactionFields, MigrationMetadata, TransactionFieldsToSave } from "../types/tools";
import { isEthersContractFactory, isBytecodeFactory, isTypechainFactoryClass } from "../types/type-checks";

import { Stats } from "../tools/Stats";
import { Reporter } from "../tools/reporters/Reporter";
import { networkManager } from "../tools/network/NetworkManager";
import { TransactionRunner } from "../tools/runners/TransactionRunner";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";
import { EthersContractFactoryAdapter } from "./adapters/EthersContractFactoryAdapter";
import { TypechainContractFactoryAdapter } from "./adapters/TypechainContractFactoryAdapter";

const log = debug("hardhat-migrate:deployer");

@catchError
export class Deployer {
  private _initialNetwork: string | undefined = undefined;

  constructor(private _hre: HardhatRuntimeEnvironment) {}

  public async deploy<A, I = any>(
    contract: Instance<A, I>,
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ): Promise<I> {
    if (!Array.isArray(argsOrParameters)) {
      parameters = argsOrParameters;
      argsOrParameters = [] as TypedArgs<A>;
    }

    const adapter = Deployer.resolveAdapter(this._hre, contract);

    const minimalContract = await adapter.fromInstance(contract, parameters);
    const contractAddress = await minimalContract.deploy(argsOrParameters as TypedArgs<A>, parameters);

    return adapter.toInstance(contract, contractAddress, parameters);
  }

  public async deployed<A, I = any>(contract: Instance<A, I>, contractIdentifier?: string): Promise<I> {
    const adapter = Deployer.resolveAdapter(this._hre, contract);
    const defaultContractName = adapter.getContractName(contract, {});

    let contractAddress;

    if (contractIdentifier === undefined) {
      contractAddress = await TransactionProcessor?.tryRestoreContractAddressByName(defaultContractName);

      return adapter.toInstance(contract, contractAddress!, {});
    }

    if (isAddress(contractIdentifier)) {
      if (!(await isDeployedContractAddress(contractIdentifier))) {
        throw new MigrateError(`Contract with address '${contractIdentifier}' is not deployed`);
      }

      return adapter.toInstance(contract, contractIdentifier, {});
    }

    contractAddress = await TransactionProcessor?.tryRestoreContractAddressByName(contractIdentifier);

    return adapter.toInstance(contract, contractAddress!, {});
  }

  public async save<A, I = any>(contract: Instance<A, I> | string, contractAddress: string) {
    if (!(await isDeployedContractAddress(contractAddress))) {
      throw new MigrateError(`Contract with address '${contractAddress}' is not deployed`);
    }

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
    };

    if (typeof contract === "string") {
      TransactionProcessor?.saveContractAddress(contract, contractAddress, saveMetadata);

      return;
    }

    const adapter = Deployer.resolveAdapter(this._hre, contract);
    const defaultContractName = adapter.getContractName(contract, {});

    TransactionProcessor?.saveContractAddress(defaultContractName, contractAddress, saveMetadata);
  }

  public async sendNative(
    to: string,
    value: bigint,
    name: string = SEND_NATIVE_TX_NAME,
  ): Promise<TransactionFieldsToSave> {
    const signer = await networkManager!.getSigner();

    const tx = await this._buildSendTransaction(to, value, name);

    const methodString = "sendNative";

    if (this._hre.config.migrate.continue) {
      try {
        const savedTx = TransactionProcessor?.tryRestoreSavedTransaction(tx);

        Reporter!.notifyTransactionRecovery(methodString, savedTx!);

        return savedTx!;
      } catch {
        Reporter!.notifyTransactionSendingInsteadOfRecovery(methodString);
      }
    }

    const txResponse = await signer.sendTransaction(tx);

    const [receipt] = await Promise.all([
      txResponse.wait(this._hre.config.migrate.wait),
      TransactionRunner!.reportTransactionResponse(txResponse, methodString),
    ]);

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
      methodName: methodString,
    };

    const savedTx = TransactionProcessor?.saveTransaction(tx, receipt!, saveMetadata);

    return savedTx!;
  }

  //   public deployProxy<T, I = BaseContract>(
  //   deployer: Deployer,
  //   factory: EthersContract<T, I>,
  //   name: string,
  // ) {
  //   const implementation = (await deployer.deploy(factory, { name: name })) as BaseContract;
  //
  //   await deployer.deploy(ERC1967Proxy__factory, [await implementation.getAddress(), "0x"], {
  //     name: `${name} Proxy`,
  //   });
  //
  //   return await deployer.deployed(factory, `${name} Proxy`);
  // }

  public async setSigner(from?: string) {
    await networkManager!.setSigner(from);
  }

  public async getSigner(from?: string): Promise<Signer> {
    return networkManager!.getSigner(from);
  }

  public async getChainId(): Promise<bigint> {
    return getChainId();
  }

  private async _buildSendTransaction(to: string, value: bigint, name: string): Promise<KeyTransactionFields> {
    return {
      to,
      value,
      chainId: await getChainId(),
      data: "0x",
      from: (await networkManager!.getSigner()).address,
      name,
    };
  }

  public static resolveAdapter<A, I = any>(hre: HardhatRuntimeEnvironment, contract: Instance<A, I>): Adapter {
    if (isTypechainFactoryClass(contract)) {
      return new TypechainContractFactoryAdapter(hre);
    }

    if (isEthersContractFactory(contract)) {
      return new EthersContractFactoryAdapter(hre);
    }

    if (isBytecodeFactory(contract)) {
      return new BytecodeAdapter(hre);
    }

    throw new MigrateError("Unknown Contract Factory Type");
  }
}
