import { Interface, toBigInt } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { MinimalContract } from "../MinimalContract";

import { bytecodeToString, catchError, fillParameters, getMethodString, toJSON } from "../../utils";

import { EthersContract, Instance, TruffleFactory } from "../../types/adapter";
import {
  BaseTruffleMethod,
  OverridesAndLibs,
  OverridesAndMisc,
  TruffleTransactionResponse,
} from "../../types/deployer";
import { KeyTransactionFields } from "../../types/tools";

import { Reporter } from "../../tools/reporters/Reporter";
import { TruffleReporter } from "../../tools/reporters/TruffleReporter";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class TruffleAdapter extends Adapter {
  constructor(private _hre: HardhatRuntimeEnvironment) {
    super(_hre.config.migrate);
  }

  public async fromInstance<A, I>(
    instance: EthersContract<A, I>,
    parameters: OverridesAndMisc,
  ): Promise<MinimalContract> {
    return new MinimalContract(
      this._config,
      this.getRawBytecode(instance),
      this.getRawAbi(instance),
      this.getContractName(instance, parameters),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async toInstance<I>(instance: TruffleFactory<I>, address: string, _: OverridesAndMisc): Promise<I> {
    const contract = this._hre.artifacts.require(instance.contractName!);

    await this._overrideConnectMethod(contract);

    contract.setAsDeployed(address);

    return contract.at(address);
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

  public getContractName<A, I>(instance: Instance<A, I>, parameters: OverridesAndMisc): string {
    if (parameters.name) {
      return parameters.name;
    }

    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      if ((instance as any).contractName) {
        return (instance as any).contractName;
      }

      return "Unknown Contract";
    }
  }

  protected async _overrideConnectMethod<I>(instance: TruffleFactory<I>) {
    const atMethod = instance.at;

    instance.at = async (address: string): Promise<I> => {
      const contract = await atMethod(address);

      return this._insertHandlers(instance, contract, address, {});
    };
  }

  protected _insertHandlers<I>(instance: TruffleFactory<I>, contract: I, to: string, parameters: OverridesAndLibs): I {
    const contractInterface = this.getInterface(instance);
    const contractName = this.getContractName(instance, parameters);

    for (const methodName of Object.keys((contract as any).contract.methods)) {
      const oldMethod: BaseTruffleMethod = (contract as any)[methodName];

      let functionStateMutability: string | undefined;
      try {
        functionStateMutability = contractInterface.getFunction(methodName)?.stateMutability;
      } catch {
        // Ambiguous function description in ABI
        continue;
      }

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

      TruffleReporter.notifyTransactionSending(methodString);

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
    await fillParameters(parameters);

    return {
      to: to,
      from: parameters.from! as string,
      data: toJSON(args),
      chainId: toBigInt(String(parameters.chainId)),
      value: toBigInt(String(parameters.value)),
    };
  }
}
