import { defineProperties, Signer, Interface, FunctionFragment, ContractTransaction } from "ethers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError, getChainId } from "../../utils";

import { KeyTxFields } from "../../types/tools";
import { TruffleFactory } from "../../types/adapter";
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

    this._insertHandlers(instance, contract, await signer.getAddress());

    return contract.at(address);
  }

  protected _getInterface(instance: TruffleContract): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode(instance: TruffleContract): string {
    return bytecodeToString(instance.bytecode);
  }

  protected _insertHandlers<I>(instance: TruffleFactory<I>, contract: I, from: string): I {
    const contractName = ArtifactProcessor.getContractName(this._getRawBytecode(instance)).split(":")[1];

    for (const methodFragment of this._getContractMethods(instance)) {
      const methodName = methodFragment.format();

      const oldMethod: BaseTruffleMethod = (contract as any)[methodName];

      const newMethod = this._wrapOldMethod(contractName, methodName, methodFragment, oldMethod, from);

      defineProperties<any>(newMethod, {
        oldMethod,
        call: oldMethod.call,
        sendTransaction: oldMethod.sendTransaction,
        estimateGas: oldMethod.estimateGas,
      });
      Object.defineProperty(newMethod, "fragment", methodFragment);

      (contract as any)[methodName] = newMethod;
    }

    return contract;
  }

  protected _wrapOldMethod(
    contractName: string,
    methodName: string,
    methodFragments: FunctionFragment,
    oldMethod: BaseTruffleMethod,
    from: string,
  ): (...args: any[]) => Promise<TruffleTransactionResponse> {
    return async (...args: any[]): Promise<TruffleTransactionResponse> => {
      const onlyToSaveTx = await this._buildContractDeployTransaction(args, from);

      const methodString = this._getMethodString(contractName, methodName, methodFragments, ...args);

      let txResult: TruffleTransactionResponse;
      if (this._config.continuePreviousDeployment) {
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
      return this._tryRecoverTransaction(methodString, tx);
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
  private async _buildContractDeployTransaction(args: any[], from: string): Promise<ContractTransaction> {
    const tx: KeyTxFields = {
      data: JSON.stringify(args),
      from: from,
      chainId: await getChainId(this._hre),
    };

    return tx as ContractTransaction;
  }
}
