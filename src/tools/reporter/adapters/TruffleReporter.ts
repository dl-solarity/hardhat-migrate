import { Reporter } from "../Reporter";

import { TruffleTransactionResponse } from "../../../types/deployer";

export class TruffleReporter {
  public static async reportTransaction(tx: TruffleTransactionResponse | string, instanceName: string) {
    if (typeof tx === "string") {
      await Reporter.reportTransactionByHash(tx, instanceName);

      return;
    }

    await Reporter.reportTransactionByHash(tx.receipt.transactionHash, instanceName);
  }
}
