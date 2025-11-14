import { Interface, isAddress, ZeroAddress } from "ethers";

import { CatchClassError, getChainId, isDeployedContractAddress, MigrateError } from "../utils/index.js";

import { SEND_NATIVE_TX_NAME } from "../../constants.js";

import { Adapter } from "./adapters/Adapter.js";
import { BytecodeAdapter } from "./adapters/BytecodeAdapter.js";

import { OverridesAndLibs } from "../../types/deployer.js";
import { BaseInstance, Instance, TypedArgs } from "../../types/adapter.js";
import { KeyTransactionFields, MigrationMetadata, TransactionFieldsToSave } from "../../types/tools.js";
import { isBytecodeFactory, isEthersContractFactory, isTypechainFactoryClass } from "../../types/index.js";

import { Stats } from "../tools/Stats.js";
import { Reporter } from "../tools/reporters/Reporter.js";
import { networkManager } from "../tools/network/NetworkManager.js";
import { TransactionRunner } from "../tools/runners/TransactionRunner.js";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor.js";
import { VerificationProcessor } from "../tools/storage/VerificationProcessor.js";
import { EthersContractFactoryAdapter } from "./adapters/EthersContractFactoryAdapter.js";
import { TypechainContractFactoryAdapter } from "./adapters/TypechainContractFactoryAdapter.js";
import { ExtendedHardhatEthersSigner } from "../tools/network/ExtendedHardhatEthersSigner.js";
import { connection } from "../tools/network/EthersProvider.js";
import { NetworkConnection } from "hardhat/types/network";

@CatchClassError
export class Deployer {
  constructor() {}

  public static resolveAdapter<A, I = any>(contract: BaseInstance<A, I>): Adapter {
    if (isTypechainFactoryClass(contract)) {
      return new TypechainContractFactoryAdapter();
    }

    if (isEthersContractFactory(contract)) {
      return new EthersContractFactoryAdapter();
    }

    if (isBytecodeFactory(contract)) {
      return new BytecodeAdapter();
    }

    throw new MigrateError("Unknown Contract Factory Type");
  }

  public connection(): NetworkConnection<"generic"> {
    return connection!;
  }

  public async deploy<A, I = any>(
    contract: Instance<A, I>,
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ): Promise<I> {
    if (!Array.isArray(argsOrParameters)) {
      parameters = argsOrParameters;
      argsOrParameters = [] as TypedArgs<A>;
    }

    const adapter = Deployer.resolveAdapter(contract);

    const minimalContract = await adapter.fromInstance(contract, parameters);
    const contractAddress = await minimalContract.deploy(argsOrParameters as TypedArgs<A>, parameters);

    return adapter.toInstance(contract, contractAddress, parameters);
  }

  public async deployERC1967Proxy<A, I = any>(
    implementationFactory: Instance<A, I>,
    constructorCalldata: string,
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ) {
    await this.validateConstructorCalldata(implementationFactory, parameters, constructorCalldata);

    return this.deployProxy(
      implementationFactory,
      "ERC1967Proxy",
      (implementationAddress) => [implementationAddress, constructorCalldata],
      argsOrParameters,
      parameters,
    );
  }

  public async deployAdminableProxy<A, I = any>(
    implementationFactory: Instance<A, I>,
    constructorCalldata: string,
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ) {
    await this.validateConstructorCalldata(implementationFactory, parameters, constructorCalldata);

    return this.deployProxy(
      implementationFactory,
      "AdminableProxy",
      (implementationAddress) => [implementationAddress, constructorCalldata],
      argsOrParameters,
      parameters,
    );
  }

  public async deployTransparentUpgradeableProxy<A, I = any>(
    implementationFactory: Instance<A, I>,
    proxyAdmin: string,
    constructorCalldata: string,
    argsOrParameters: OverridesAndLibs | TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ) {
    await this.validateConstructorCalldata(implementationFactory, parameters, constructorCalldata);

    if (proxyAdmin === ZeroAddress) {
      throw new MigrateError("Proxy admin cannot be the zero address");
    }

    return this.deployProxy(
      implementationFactory,
      "TransparentUpgradeableProxy",
      (implementationAddress) => [implementationAddress, proxyAdmin, constructorCalldata],
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
    let proxyFactory;

    try {
      proxyFactory = await connection!.ethers.getContractFactory(proxyFactoryName);
    } catch {
      throw new MigrateError(
        `Contract factory for ${proxyFactoryName} not found. Please add import of the proxy to one of the contracts in the project.`,
      );
    }

    const adapter = Deployer.resolveAdapter(implementationFactory);

    let implementationArgs: TypedArgs<A> = [] as any;
    let implementationParameters: OverridesAndLibs = {};

    if (argsOrParameters && Array.isArray(argsOrParameters)) {
      implementationArgs = argsOrParameters;
    } else if (argsOrParameters && typeof argsOrParameters === "object") {
      implementationParameters = argsOrParameters;
    } else {
      implementationParameters = parameters;
    }

    let instanceName = adapter.getContractName(implementationFactory, implementationParameters);

    const implementation = (await this.deploy(implementationFactory, implementationArgs, {
      ...implementationParameters,
      name: `${instanceName} implementation`,
    })) as any;

    let implementationArtifact = adapter.getContractName(implementationFactory, {});

    VerificationProcessor.saveVerificationFunction({
      contractAddress: await implementation.getAddress(),
      contractName: implementationArtifact,
      constructorArguments: implementationArgs,
      chainId: Number(await getChainId()),
    });

    const hre = await import("hardhat");

    let artifact = await hre.artifacts.readArtifact(proxyFactoryName);

    const proxy = await this.deploy(proxyFactory, proxyArgs(await implementation.getAddress()), {
      name: `${instanceName} proxy`,
    });
    VerificationProcessor.saveVerificationFunction({
      contractAddress: await proxy.getAddress(),
      contractName: `${artifact.sourceName}:${artifact.contractName}`,
      constructorArguments: proxyArgs(await implementation.getAddress()),
      chainId: Number(await getChainId()),
    });

    return this.deployed(implementationFactory, `${instanceName} proxy`);
  }

  public async validateConstructorCalldata<A, I = any>(
    implementationFactory: Instance<A, I>,
    parameters: OverridesAndLibs,
    constructorCalldata: string,
  ) {
    if (!isTypechainFactoryClass(implementationFactory) || constructorCalldata == "0x" || constructorCalldata == "") {
      return;
    }

    const adapter = Deployer.resolveAdapter(implementationFactory);
    const contractInterface: Interface = adapter.getInterface(implementationFactory);
    const functionFragment = contractInterface.parseTransaction({ data: constructorCalldata });

    if (!functionFragment) {
      throw new MigrateError("Invalid constructor calldata. Correct it and use --continue flag to continue migration.");
    }

    Reporter!.notifyOfProxyConstructorUsage(
      adapter.getContractName(implementationFactory, parameters),
      functionFragment.name,
    );
  }

  public async deployed<A, I = any>(contract: BaseInstance<A, I>, contractIdentifier?: string): Promise<I> {
    const adapter = Deployer.resolveAdapter(contract);
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

  public async save<A, I = any>(contract: Instance<A, I> | string, contractAddress: string, force: boolean = false) {
    if (!(await isDeployedContractAddress(contractAddress)) && !force) {
      throw new MigrateError(`Contract with address '${contractAddress}' is not deployed`);
    }

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
    };

    if (typeof contract === "string") {
      TransactionProcessor?.saveContractAddress(contract, contractAddress, saveMetadata);

      return;
    }

    const adapter = Deployer.resolveAdapter(contract);
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

    const hre = await import("hardhat")

    if (hre.config.migrate.execution.continue) {
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
      txResponse.wait(hre.config.migrate.execution.wait),
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

  public async getSigner(from?: string): Promise<ExtendedHardhatEthersSigner> {
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
}
