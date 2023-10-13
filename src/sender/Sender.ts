import { ContractTransactionResponse } from "ethers";

import { catchError } from "../utils";

import { Reporter } from "../tools/reporter/Reporter";

@catchError
export class Sender {
  // TODO: add similar function as in the deployer (instance, args, options)
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
}
