/* eslint-disable no-console */
import { Reporter } from "./Reporter";

import { TruffleTransactionResponse } from "../../types/deployer";

export class TruffleReporter {
  public static async reportTransaction(tx: TruffleTransactionResponse | string, instanceName: string) {
    const hash = typeof tx === "string" ? tx : tx.receipt.transactionHash;

    await Reporter.reportTransactionByHash(hash, instanceName);
  }

  public static notifyTransactionSending(methodString: string) {
    console.log(`> ${methodString} is sending...`);
  }
}
