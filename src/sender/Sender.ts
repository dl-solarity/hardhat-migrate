import { ContractTransactionResponse } from "ethers";
import { Reporter } from "../tools/reporter/Reporter";
import { catchError } from "../utils";

@catchError
export class Sender {
  constructor(private _reporter: Reporter) {}

  public async sendTransaction(
    task: Promise<ContractTransactionResponse>,
    misc = "",
  ): Promise<ContractTransactionResponse> {
    const result = await task;

    // TransactionProcessor.saveTransaction(result);
    await this._reporter.reportTransaction(result, misc);

    return result;
  }

  // public track(receipt: any): void {
  //   // pass receipt to reporter
  //   // save in storage
  // }
}
