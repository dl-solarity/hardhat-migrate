import { ContractTransactionResponse } from "ethers";

import { catchError, resolveAdapter } from "../utils";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Reporter } from "../tools/reporter/Reporter";
import { Instance, TypedArgs } from "../types/adapter";
import { OverridesAndLibs } from "../types/deployer";

@catchError
export class Sender {
  constructor(private _hre: HardhatRuntimeEnvironment) {}
  // TODO: add types -- Hard
  public async sendTransaction(
    task: Promise<ContractTransactionResponse>,
    misc = "",
  ): Promise<ContractTransactionResponse> {
    const result = await task;

    // TransactionProcessor.saveTransaction(result);
    await Reporter.reportTransaction(result, misc);

    return result;
  }

  public async sendTransaction2<A, I>(
    contract: Instance<A, I>,
    method: string,
    args: TypedArgs<A> = [] as any,
    parameters: OverridesAndLibs = {},
  ): Promise<ContractTransactionResponse> {
    const adapter = resolveAdapter(this._hre, contract);

    return adapter.sendTransaction(contract, method, args, parameters);
  }
}
