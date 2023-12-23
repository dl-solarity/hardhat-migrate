import { isAddress, Signer } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError, getChainId, getSignerHelper, isDeployedContractAddress } from "../utils";

import { MigrateError } from "../errors";

import { SEND_NATIVE_TX_NAME } from "../constants";

import { Adapter } from "./adapters/Adapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";
import { BytecodeAdapter } from "./adapters/BytecodeAdapter";
import { EthersContractAdapter } from "./adapters/EthersContractAdapter";
import { EthersFactoryAdapter } from "./adapters/EthersFactoryAdapter";

import { OverridesAndLibs } from "../types/deployer";
import { Instance, TypedArgs } from "../types/adapter";
import { KeyTransactionFields, MigrationMetadata, TransactionFieldsToSave } from "../types/tools";
import { isContractFactory, isEthersContract, isBytecodeFactory, isTruffleFactory } from "../types/type-checks";

import { Stats } from "../tools/Stats";
import { Reporter } from "../tools/reporters/Reporter";
import { TransactionRunner } from "../tools/runners/TransactionRunner";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";

@catchError
export class Deployer {
  constructor(private _hre: HardhatRuntimeEnvironment) {}

  public async deploy<T, A = T, I = any>(
    contract: Instance<A, I> | (T extends Truffle.Contract<I> ? T : never),
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

  public async deployed<T, A = T, I = any>(
    contract: Instance<A, I> | (T extends Truffle.Contract<I> ? T : never),
    contractIdentifier?: string,
  ): Promise<I> {
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

  public async sendNative(
    to: string,
    value: bigint,
    name: string = SEND_NATIVE_TX_NAME,
  ): Promise<TransactionFieldsToSave> {
    const signer = await getSignerHelper();

    const tx = await this._buildSendTransaction(to, value, name);

    const methodString = "sendNative";

    if (this._hre.config.migrate.continue) {
      try {
        const savedTx = TransactionProcessor?.tryRestoreSavedTransaction(tx);

        Reporter!.notifyTransactionRecovery(methodString);

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

  public async getSigner(from?: string): Promise<Signer> {
    return getSignerHelper(from);
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
      from: (await getSignerHelper()).address,
      name,
    };
  }

  public static resolveAdapter<A, I>(hre: HardhatRuntimeEnvironment, contract: Instance<A, I>): Adapter {
    if (isEthersContract(contract)) {
      return new EthersContractAdapter(hre);
    }

    if (isTruffleFactory(contract)) {
      return new TruffleAdapter(hre);
    }

    if (isBytecodeFactory(contract)) {
      return new BytecodeAdapter(hre);
    }

    if (isContractFactory(contract)) {
      return new EthersFactoryAdapter(hre);
    }

    throw new MigrateError("Unknown Contract Factory Type");
  }
}
