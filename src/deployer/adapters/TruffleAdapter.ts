import { ContractTransaction, Interface, Signer } from "ethers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError, getChainId } from "../../utils";

import { TruffleFactory } from "../../types/adapter";
import { KeyTransactionFields } from "../../types/tools";
import { BaseTruffleMethod, TruffleTransactionResponse } from "../../types/deployer";

import { Reporter } from "../../tools/reporter/Reporter";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class TruffleAdapter extends Adapter {
  public async link(library: TruffleContract, ...instances: TruffleContract): Promise<void> {
    library = library.contractName ? await library.deployed() : library;

    for (const instance of instances) {
      instance.link(library);
    }
  }

  public async toInstance<I>(instance: TruffleFactory<I>, address: string, signer: Signer): Promise<I> {
    const contract = this._hre.artifacts.require(instance.contractName!);

    const contractInstance = await contract.at(address);

    return this._insertHandlers(instance, contractInstance, await signer.getAddress(), address);
  }

  protected _getInterface(instance: TruffleContract): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode(instance: TruffleContract): string {
    return bytecodeToString(instance.bytecode);
  }

  protected _insertHandlers<I>(instance: TruffleFactory<I>, contract: I, from: string, to: string): I {
    const contractName = ArtifactProcessor.tryGetContractName(this._getRawBytecode(instance)).split(":")[1];

    for (const methodName of Object.keys((contract as any).contract.methods)) {
      const oldMethod: BaseTruffleMethod = (contract as any)[methodName];

      if (this._getInterface(instance).getFunction(methodName)?.stateMutability === "view") {
        continue;
      }

      if (oldMethod === undefined) {
        continue;
      }

      (contract as any)[methodName] = this._wrapOldMethod(contractName, methodName, oldMethod, from, to);
    }

    return contract;
  }

  protected _wrapOldMethod(
    contractName: string,
    methodName: string,
    oldMethod: BaseTruffleMethod,
    from: string,
    to: string,
  ): (...args: any[]) => Promise<TruffleTransactionResponse> {
    return async (...args: any[]): Promise<TruffleTransactionResponse> => {
      const onlyToSaveTx = await this._buildContractDeployTransaction(args, from, to);

      const methodString = this._getMethodString(contractName, methodName);

      let txResult: TruffleTransactionResponse;
      if (this._config.continue) {
        return this._recoverTransaction(methodString, onlyToSaveTx, oldMethod, args);
      } else {
        txResult = await oldMethod(...args);

        TransactionProcessor.saveTransaction(onlyToSaveTx);

        await Reporter.reportTruffleTransaction(txResult, methodString);
      }

      return txResult;
    };
  }

  protected async _recoverTransaction(
    methodString: string,
    tx: ContractTransaction,
    oldMethod: BaseTruffleMethod,
    args: any[],
  ) {
    try {
      return await this._tryRecoverTransaction(methodString, tx);
    } catch {
      Reporter.notifyTransactionSendingInsteadOfRecovery(methodString);

      return this._sendTransaction(methodString, tx, oldMethod, args);
    }
  }

  protected async _sendTransaction(
    methodString: string,
    tx: ContractTransaction,
    oldMethod: BaseTruffleMethod,
    args: any[],
  ) {
    const txResult = await oldMethod(...args);

    TransactionProcessor.saveTransaction(tx);

    await Reporter.reportTruffleTransaction(txResult, methodString);

    return txResult;
  }

  private async _tryRecoverTransaction(methodString: string, tx: ContractTransaction) {
    const txResponse = TransactionProcessor.tryRecoverTruffleTransaction(tx);

    Reporter.notifyTransactionRecovery(methodString);

    return txResponse;
  }

  /**
   * @dev Build a transaction ONLY to save it in the storage.
   */
  private async _buildContractDeployTransaction(args: any[], from: string, to: string): Promise<ContractTransaction> {
    const tx: KeyTransactionFields = {
      to: to,
      from: from,
      data: JSON.stringify(args),
      chainId: await getChainId(this._hre),
    };

    return tx as ContractTransaction;
  }

  private _getMethodString(contractName: string, methodName: string): string {
    return `${contractName}.${methodName}`;
  }
}
