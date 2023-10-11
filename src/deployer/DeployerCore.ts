import { ContractDeployTransaction, Overrides, Signer, TransactionResponse } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Linker } from "./Linker";

import { catchError, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import {
  Args,
  ContractDeployParams,
  ContractDeployTransactionWithContractName,
  OverridesAndLibs,
} from "../types/deployer";
import { MigrateConfig } from "../types/migrations";

import { Reporter } from "../tools/reporter/Reporter";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";
import { Verifier } from "../verifier/Verifier";

@catchError
export class DeployerCore {
  private _config: MigrateConfig;
  private _verifier: Verifier;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
    this._verifier = new Verifier(_hre);
  }

  public async deploy(deployParams: ContractDeployParams, args: Args, parameters: OverridesAndLibs): Promise<string> {
    const contractName = ArtifactProcessor.getContractName(deployParams.bytecode);

    deployParams.bytecode = await Linker.linkBytecode(deployParams.bytecode, parameters.libraries || {});

    const tx: ContractDeployTransactionWithContractName = {
      ...(await this._createDeployTransaction(deployParams, args, parameters)),
      contractName: contractName,
    };

    let contractAddress: string;
    if (this._config.continuePreviousDeployment) {
      contractAddress = await this._tryRecoverContractAddress(tx);
    } else {
      contractAddress = await this._processContractDeploymentTransaction(tx);
    }

    this._verifier.verify(contractAddress, contractName, args);

    return contractAddress;
  }

  private async _createDeployTransaction(
    contractParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides,
  ): Promise<ContractDeployTransaction> {
    const factory = new this._hre.ethers.ContractFactory(contractParams.abi, contractParams.bytecode);

    return factory.getDeployTransaction(...args, txOverrides);
  }

  private async _tryRecoverContractAddress(tx: ContractDeployTransactionWithContractName): Promise<string> {
    try {
      return TransactionProcessor.getDeploymentTransaction(tx);
    } catch (e) {
      // TODO: Add reporter call here. Notify user that contract will be deployed instead of recovering.
      return this._processContractDeploymentTransaction(tx);
    }
  }

  private async _processContractDeploymentTransaction(tx: ContractDeployTransactionWithContractName): Promise<string> {
    const signer: Signer = await getSignerHelper(this._hre, tx.from);

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);

    const [contractAddress] = await Promise.all([
      this._waitForDeployment(txResponse),
      this._reportContractDeployTransactionSent(txResponse),
    ]);

    TransactionProcessor.saveDeploymentTransaction(tx, tx.contractName, contractAddress);

    return contractAddress;
  }

  private async _waitForDeployment(tx: TransactionResponse): Promise<string> {
    // this._config.confirmations -- is used only for verification process.
    // TODO: Create other parameter to pass to tx.wait(). Default must be 1
    const receipt = await tx.wait();

    if (receipt) {
      return receipt.contractAddress!;
    }

    throw new MigrateError("Contract deployment failed.");
  }

  // eslint-disable-next-line
  private async _reportContractDeployTransactionSent(tx: TransactionResponse): Promise<void> {
    await Reporter.reportDeploy(tx);
    // TODO: implement when reporter is ready. Must be inlined with call to the Reporter contract.
    // this function (_reportContractDeployTransactionSent) is not needed in this class. Must be handled by the Reporter.
  }
}
