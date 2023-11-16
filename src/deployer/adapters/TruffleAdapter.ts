import {
  BaseContract,
  ContractMethodArgs,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  ethers,
  Interface,
} from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { MinimalContract } from "../MinimalContract";

import { bytecodeToString, catchError, fillParameters, getMethodString, getSignerHelper } from "../../utils";

import { EthersContract, Instance, TruffleFactory } from "../../types/adapter";
import { OverridesAndName, TruffleTransactionResponse } from "../../types/deployer";
import { KeyTransactionFields, MigrationMetadata, UNKNOWN_CONTRACT_NAME } from "../../types/tools";

import { Stats } from "../../tools/Stats";
import { Reporter } from "../../tools/reporters/Reporter";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class TruffleAdapter extends Adapter {
  constructor(private _hre: HardhatRuntimeEnvironment) {
    super(_hre.config.migrate);
  }

  public async fromInstance<A, I>(
    instance: EthersContract<A, I>,
    parameters: OverridesAndName,
  ): Promise<MinimalContract> {
    return new MinimalContract(
      this._config,
      this.getRawBytecode(instance),
      this.getRawAbi(instance),
      this.getContractName(instance, parameters),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async toInstance<I>(instance: TruffleFactory<I>, address: string, _: OverridesAndName): Promise<I> {
    const contract = this._hre.artifacts.require(instance.contractName!);

    await this._overrideConnectMethod(contract);

    const contractInstance = await contract.at(address);
    (instance as any).setAsDeployed(contractInstance);

    return contractInstance;
  }

  public getInterface(instance: TruffleContract): Interface {
    return Interface.from(instance.abi);
  }

  public getRawAbi(instance: TruffleContract): string {
    return instance.abi;
  }

  public getRawBytecode(instance: TruffleContract): string {
    return bytecodeToString(instance.bytecode);
  }

  public getContractName<A, I>(instance: Instance<A, I>, parameters: OverridesAndName): string {
    if (parameters.name) {
      return parameters.name;
    }

    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      if ((instance as any).contractName) {
        return (instance as any).contractName;
      }

      return UNKNOWN_CONTRACT_NAME;
    }
  }

  protected async _overrideConnectMethod<I>(instance: TruffleFactory<I>) {
    const atMethod = instance.at;

    instance.at = async (address: string): Promise<I> => {
      const contract = await atMethod(address);

      return this._insertHandlers(instance, contract, address);
    };
  }

  protected _insertHandlers<I>(instance: TruffleFactory<I>, contract: I, address: string): I {
    const contractName = this.getContractName(instance, {});
    const ethersBaseContract: BaseContract = new BaseContract(address, this.getInterface(instance));

    for (const methodName of Object.keys((contract as any).contract.methods)) {
      if ((contract as any)[methodName] === undefined) {
        continue;
      }

      let functionStateMutability: string | undefined;
      try {
        functionStateMutability = ethersBaseContract.getFunction(methodName)?.fragment.stateMutability;
      } catch {
        // Ambiguous function description in ABI
        continue;
      }

      if (functionStateMutability === "view" || functionStateMutability === "pure") {
        continue;
      }

      (contract as any)[methodName] = this._wrapOldMethod(ethersBaseContract, contractName, methodName);
    }

    return contract;
  }

  protected _wrapOldMethod(
    ethersBaseContract: BaseContract,
    contractName: string,
    methodName: string,
  ): (...args: any[]) => Promise<TruffleTransactionResponse> {
    return async (...args: any[]): Promise<TruffleTransactionResponse> => {
      let contractMethod = ethersBaseContract.getFunction(methodName);

      // Build transaction. Under the hood, ethers handle overrides.
      const tx = (await contractMethod.populateTransaction(...args)) as KeyTransactionFields;
      await fillParameters(tx);

      // Connect to signer and get method again with signer
      contractMethod = ethersBaseContract.connect(await getSignerHelper(tx.from)).getFunction(methodName);

      const methodString = getMethodString(contractName, methodName, contractMethod.fragment, args);

      if (this._config.continue) {
        return this._recoverTransaction(methodString, tx, contractMethod.send, args);
      }

      return this._sendTransaction(methodString, tx, contractMethod.send, args);
    };
  }

  protected async _recoverTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: (...args: ContractMethodArgs<any[]>) => Promise<ContractTransactionResponse>,
    args: any[],
  ): Promise<TruffleTransactionResponse> {
    try {
      const txResponse = TransactionProcessor.tryRestoreSavedTransaction(tx);

      Reporter.notifyTransactionRecovery(methodString);

      return txResponse as unknown as TruffleTransactionResponse;
    } catch {
      Reporter.notifyTransactionSendingInsteadOfRecovery(methodString);

      return this._sendTransaction(methodString, tx, oldMethod, args);
    }
  }

  protected async _sendTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: (...args: ContractMethodArgs<any[]>) => Promise<ContractTransactionResponse>,
    args: any[],
  ): Promise<TruffleTransactionResponse> {
    const txResponse = await oldMethod(...args);

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
      methodName: methodString,
    };

    await Reporter.reportTransactionResponse(txResponse, methodString);

    const receipt = (await txResponse.wait())!;
    TransactionProcessor.saveTransaction(tx, receipt, saveMetadata);

    return this._toTruffleTransactionResponse(receipt);
  }

  private _toTruffleTransactionResponse(receipt: ContractTransactionReceipt): TruffleTransactionResponse {
    return {
      tx: receipt.hash,
      receipt: {
        transactionHash: receipt.hash,
        transactionIndex: receipt.index.toString(),
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber.toString(),
        from: receipt.from,
        to: receipt.to ? receipt.to : ethers.ZeroAddress,
        gasUsed: receipt.gasUsed.toString(),
        logs: receipt.logs,
        logsBloom: receipt.logsBloom,
        type: receipt.type.toString(),
        status: receipt.status ? receipt.status.toString() : "",
        gasPrice: receipt.gasPrice.toString(),
        effectiveGasPrice: receipt.cumulativeGasUsed.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        contractAddress: receipt.contractAddress ? receipt.contractAddress : ethers.ZeroAddress,
      },
      logs: receipt.logs,
    };
  }
}
