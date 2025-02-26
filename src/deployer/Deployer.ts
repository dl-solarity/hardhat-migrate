import { isAddress, ZeroAddress } from "ethers";

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
import { VerificationProcessor } from "../tools/storage/VerificationProcessor";
import { EthersContractFactoryAdapter } from "./adapters/EthersContractFactoryAdapter";
import { TypechainContractFactoryAdapter } from "./adapters/TypechainContractFactoryAdapter";
import { ExtendedHardhatEthersSigner } from "../tools/network/ExtendedHardhatEthersSigner";

@catchError
export class Deployer {
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

  public async deployERC1967Proxy<A, I = any>(
    implementationFactory: Instance<A, I>,
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ) {
    return this.deployProxy(
      implementationFactory,
      "ERC1967Proxy",
      (implementationAddress) => [implementationAddress, "0x"],
      argsOrParameters,
      parameters,
    );
  }

  public async deployTransparentUpgradeableProxy<A, I = any>(
    implementationFactory: Instance<A, I>,
    proxyAdmin: string,
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ) {
    if (proxyAdmin === ZeroAddress) {
      throw new MigrateError("Proxy admin cannot be the zero address");
    }

    return this.deployProxy(
      implementationFactory,
      "TransparentUpgradeableProxy",
      (implementationAddress) => [implementationAddress, proxyAdmin, "0x"],
      argsOrParameters,
      parameters,
    );
  }

  public async deployProxy<A, I = any>(
    implementationFactory: Instance<A, I>,
    proxyFactoryName: string,
    proxyArgs: (implementationAddress: string) => any[],
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ) {
    const adapter = Deployer.resolveAdapter(this._hre, implementationFactory);

    let implementationArgs: TypedArgs<A> = [] as any;
    let implementationParameters: OverridesAndLibs = {};

    if (argsOrParameters && Array.isArray(argsOrParameters)) {
      implementationArgs = argsOrParameters;
    } else if (argsOrParameters && typeof argsOrParameters === "object") {
      implementationParameters = argsOrParameters;
    } else {
      implementationParameters = parameters;
    }

    let instanceName = adapter.getContractName(implementationFactory, parameters);

    const implementation = (await this.deploy(implementationFactory, implementationArgs, {
      ...implementationParameters,
      name: `${instanceName} implementation`,
    })) as any;
    VerificationProcessor.saveVerificationFunction({
      contractAddress: await implementation.getAddress(),
      contractName: instanceName,
      constructorArguments: implementationArgs,
      chainId: Number(await getChainId()),
    });

    const { ethers, artifacts } = await import("hardhat");
    const proxyFactory = await ethers.getContractFactory(proxyFactoryName);

    let artifact = await artifacts.readArtifact(proxyFactoryName);

    const proxy = await this.deploy(proxyFactory, proxyArgs(await implementation.getAddress()), {
      name: instanceName,
    });
    VerificationProcessor.saveVerificationFunction({
      contractAddress: await proxy.getAddress(),
      contractName: `${artifact.sourceName}:${artifact.contractName}`,
      constructorArguments: proxyArgs(await implementation.getAddress()),
      chainId: Number(await getChainId()),
    });

    return this.deployed(implementationFactory, instanceName);
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

    if (this._hre.config.migrate.execution.continue) {
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
      txResponse.wait(this._hre.config.migrate.execution.wait),
      TransactionRunner!.reportTransactionResponse(txResponse, methodString),
    ]);

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
      methodName: methodString,
    };

    const savedTx = TransactionProcessor?.saveTransaction(tx, receipt!, saveMetadata);

    return savedTx!;
  }

  public async setSigner(from?: string) {
    await networkManager!.setSigner(from);
  }

  public async getSigner(from?: string): Promise<any> {
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
      from: await (await networkManager!.getSigner()).getAddress(),
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
