import { ContractDeployTransaction, Overrides, Signer, TransactionResponse } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Linker } from "./Linker";

import { catchError, getChainId, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import {
  Args,
  ContractDeployParams,
  ContractDeployTransactionWithContractName,
  OverridesAndLibs,
} from "../types/deployer";
import { MigrateConfig } from "../types/migrations";

import { Verifier } from "../verifier/Verifier";

import { Reporter } from "../tools/reporter/Reporter";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";

@catchError
export class DeployerCore {
  private _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
  }

  public async deploy(deployParams: ContractDeployParams, args: Args, parameters: OverridesAndLibs): Promise<string> {
    const contractName = ArtifactProcessor.getContractName(deployParams.bytecode);

    deployParams.bytecode = await Linker.linkBytecode(this._hre, deployParams.bytecode, parameters.libraries || {});

    const tx: ContractDeployTransactionWithContractName = {
      ...(await this._createDeployTransaction(deployParams, args, parameters)),
      contractName: contractName,
    };

    if (this._config.continuePreviousDeployment) {
      return this._tryRecoverContractAddress(tx, args);
    } else {
      return this._processContractDeploymentTransaction(tx, args);
    }
  }

  private async _createDeployTransaction(
    contractParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides,
  ): Promise<ContractDeployTransaction> {
    const factory = new this._hre.ethers.ContractFactory(contractParams.abi, contractParams.bytecode);

    return {
      chainId: await getChainId(this._hre),
      from: (await getSignerHelper(this._hre, txOverrides.from)).address,
      ...(await factory.getDeployTransaction(...args, txOverrides)),
    };
  }

  private async _tryRecoverContractAddress(tx: ContractDeployTransactionWithContractName, args: Args): Promise<string> {
    try {
      const contractAddress = TransactionProcessor.tryRestoreContractAddressByKeyFields(tx);

      Reporter.notifyContractRecovery(tx.contractName, contractAddress);

      return contractAddress;
    } catch {
      Reporter.notifyDeploymentInsteadOfRecovery(tx.contractName);

      return this._processContractDeploymentTransaction(tx, args);
    }
  }

  private async _processContractDeploymentTransaction(
    tx: ContractDeployTransactionWithContractName,
    args: Args,
  ): Promise<string> {
    const signer: Signer = await getSignerHelper(this._hre, tx.from);

    const txResponse = await signer.sendTransaction(tx);

    const [contractAddress] = await Promise.all([
      this._waitForDeployment(txResponse),
      Reporter.reportTransaction(txResponse, tx.contractName),
    ]);

    if (typeof contractAddress !== "string") {
      throw new MigrateError("Contract deployment failed. Invalid contract address conversion.");
    }

    TransactionProcessor.saveDeploymentTransaction(tx, tx.contractName, contractAddress);

    await Verifier.processVerification({
      contractAddress,
      contractName: tx.contractName,
      constructorArguments: args,
    });

    return contractAddress;
  }

  private async _waitForDeployment(tx: TransactionResponse): Promise<string> {
    const receipt = await tx.wait(this._config.txConfirmations);

    if (receipt) {
      return receipt.contractAddress!;
    }

    throw new MigrateError("Contract deployment failed.");
  }
}
