import { Interface, toBigInt } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { MinimalContract } from "../MinimalContract";

import { bytecodeToString, catchError, fillParameters, getMethodString } from "../../utils";

import { KeyTransactionFields } from "../../types/tools";
import { EthersFactory, Instance, TruffleFactory } from "../../types/adapter";
import { BaseTruffleMethod, OverridesAndLibs, TruffleTransactionResponse } from "../../types/deployer";

import { Reporter } from "../../tools/reporters/Reporter";
import { TruffleReporter } from "../../tools/reporters/TruffleReporter";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class TruffleAdapter extends Adapter {
  constructor(_hre: HardhatRuntimeEnvironment) {
    super(_hre);
  }

  public async fromInstance<A, I>(instance: EthersFactory<A, I>): Promise<MinimalContract> {
    return new MinimalContract(
      this._hre,
      this.getRawBytecode(instance),
      this.getInterface(instance),
      this.getContractName(instance),
    );
  }

  public async toInstance<I>(instance: TruffleFactory<I>, address: string, parameters: OverridesAndLibs): Promise<I> {
    const contract = this._hre.artifacts.require(instance.contractName!);

    const contractInstance = await contract.at(address);

    return this._insertHandlers(instance, contractInstance, address, parameters);
  }

  public getInterface(instance: TruffleContract): Interface {
    return Interface.from(instance.abi);
  }

  public getRawBytecode(instance: TruffleContract): string {
    return bytecodeToString(instance.bytecode);
  }

  public getContractName<A, I>(instance: Instance<A, I>): string {
    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      return "Unknown Contract";
    }
  }

  protected _insertHandlers<I>(instance: TruffleFactory<I>, contract: I, to: string, parameters: OverridesAndLibs): I {
    const contractInterface = this.getInterface(instance);
    const contractName = this.getContractName(instance);

    for (const methodName of Object.keys((contract as any).contract.methods)) {
      const oldMethod: BaseTruffleMethod = (contract as any)[methodName];

      const functionStateMutability = contractInterface.getFunction(methodName)?.stateMutability;
      if (functionStateMutability === "view" || functionStateMutability === "pure") {
        continue;
      }

      if (oldMethod === undefined) {
        continue;
      }

      (contract as any)[methodName] = this._wrapOldMethod(contractName, methodName, oldMethod, to, parameters);
    }

    return contract;
  }

  protected _wrapOldMethod(
    contractName: string,
    methodName: string,
    oldMethod: BaseTruffleMethod,
    to: string,
    parameters: OverridesAndLibs,
  ): (...args: any[]) => Promise<TruffleTransactionResponse> {
    return async (...args: any[]): Promise<TruffleTransactionResponse> => {
      const onlyToSaveTx = await this._buildContractDeployTransaction(args, to, parameters);

      const methodString = getMethodString(contractName, methodName);

      if (this._config.continue) {
        return this._recoverTransaction(methodString, onlyToSaveTx, oldMethod, args);
      }

      const txResult = await oldMethod(...args);

      TransactionProcessor.saveTransaction(onlyToSaveTx);

      await TruffleReporter.reportTransaction(txResult, methodString);

      return txResult;
    };
  }

  protected async _recoverTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: BaseTruffleMethod,
    args: any[],
  ) {
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
    oldMethod: BaseTruffleMethod,
    args: any[],
  ) {
    const txResult = await oldMethod(...args);

    TransactionProcessor.saveTransaction(tx);

    await TruffleReporter.reportTransaction(txResult, methodString);

    return txResult;
  }

  /**
   * @dev Build a transaction ONLY to save it in the storage.
   */
  private async _buildContractDeployTransaction(
    args: any[],
    to: string,
    parameters: OverridesAndLibs,
  ): Promise<KeyTransactionFields> {
    await fillParameters(this._hre, parameters);

    const tx: KeyTransactionFields = {
      to: to,
      from: parameters.from! as string,
      data: JSON.stringify(args),
      chainId: toBigInt(String(parameters.chainId)),
      value: toBigInt(String(parameters.value)),
    };

    return tx;
  }
}
