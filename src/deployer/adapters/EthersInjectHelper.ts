import {
  BaseContract,
  BaseContractMethod,
  ContractTransaction,
  ContractTransactionResponse,
  defineProperties,
  FunctionFragment,
  Interface,
} from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { fillParameters, getMethodString } from "../../utils";

import { MigrateConfig } from "../../types/migrations";
import { OverridesAndLibs } from "../../types/deployer";

import { Reporter } from "../../tools/reporter/Reporter";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

export class EthersInjectHelper {
  protected _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
  }

  public insertHandlers(contract: BaseContract, contractName: string, parameters: OverridesAndLibs): BaseContract {
    const methodSet = new Set<string>();

    for (const methodFragments of this._getContractFunctionFragments(contract.interface)) {
      if (methodFragments.stateMutability === "view" || methodFragments.stateMutability === "pure") {
        continue;
      }

      const methodName = methodFragments.format();
      const shortName = methodName.split("(")[0];

      const oldMethod: BaseContractMethod = (contract as any)[methodName];

      const newMethod = this._wrapOldMethod(contractName, methodName, methodFragments, oldMethod, parameters);

      defineProperties<any>(newMethod, {
        name: oldMethod.name,
        getFragment: oldMethod.getFragment,
        estimateGas: oldMethod.estimateGas,
        populateTransaction: oldMethod.populateTransaction,
        send: oldMethod.send,
        staticCall: oldMethod.staticCall,
        staticCallResult: oldMethod.staticCallResult,
      });
      Object.defineProperty(newMethod, "fragment", oldMethod.fragment);

      (contract as any)[methodName] = newMethod;

      if (!methodSet.has(shortName)) {
        (contract as any)[shortName] = newMethod;

        methodSet.add(shortName);
      } else {
        (contract as any)[shortName] = undefined;
      }
    }

    return contract;
  }

  private _getContractFunctionFragments(contractInterface: Interface): FunctionFragment[] {
    const result: FunctionFragment[] = [];

    contractInterface.forEachFunction((fragment) => {
      result.push(fragment);
    });

    return result;
  }

  private _wrapOldMethod(
    methodName: string,
    contractName: string,
    methodFragments: FunctionFragment,
    oldMethod: BaseContractMethod,
    parameters: OverridesAndLibs,
  ): (...args: any[]) => Promise<ContractTransactionResponse> {
    return async (...args: any[]): Promise<ContractTransactionResponse> => {
      await fillParameters(this._hre, parameters);
      const tx = await oldMethod.populateTransaction(...args, parameters);

      const methodString = getMethodString(contractName, methodName, methodFragments, args);

      if (this._config.continue) {
        return this._recoverTransaction(methodString, tx, oldMethod, args);
      } else {
        return this._sendTransaction(methodString, tx, oldMethod, args);
      }
    };
  }

  private async _recoverTransaction(
    methodString: string,
    tx: ContractTransaction,
    oldMethod: BaseContractMethod,
    args: any[],
  ) {
    try {
      const txResponse = TransactionProcessor.tryRestoreSavedTransaction(tx);

      Reporter.notifyTransactionRecovery(methodString);

      return txResponse;
    } catch {
      Reporter.notifyTransactionSendingInsteadOfRecovery(methodString);

      return this._sendTransaction(methodString, tx, oldMethod, args);
    }
  }

  private async _sendTransaction(
    methodString: string,
    tx: ContractTransaction,
    oldMethod: BaseContractMethod,
    args: any[],
  ) {
    const txResponse: ContractTransactionResponse = (await oldMethod(...args)) as ContractTransactionResponse;

    TransactionProcessor.saveTransaction(tx);

    await Reporter.reportTransaction(txResponse, methodString);

    return txResponse;
  }
}
