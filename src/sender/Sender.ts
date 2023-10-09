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

    await this._reporter.reportTransaction(result, misc);

    return result;
  }
}
