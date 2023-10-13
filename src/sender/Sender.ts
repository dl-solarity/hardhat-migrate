import { ContractTransactionResponse } from "ethers";

import { catchError } from "../utils";

import { Reporter } from "../tools/reporter/Reporter";

@catchError
export class Sender {
  public async sendTransaction(
    task: Promise<ContractTransactionResponse>,
    misc = "",
  ): Promise<ContractTransactionResponse> {
    const result = await task;

    // TransactionProcessor.saveTransaction(result);
    await Reporter.reportTransaction(result, misc);

    return result;
  }

  // public track(receipt: any): void {
  //   // pass receipt to reporter
  //   // save in storage
  // }
}
