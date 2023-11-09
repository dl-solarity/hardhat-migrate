/* eslint-disable no-console */
import { Reporter } from "./Reporter";

import { Provider } from "../Provider";

import { MigrateError } from "../../errors";

export class PublicReporter {
  public static async reportTransactionByHash(txHash: string, instanceName: string) {
    const tx = await Provider.provider.getTransaction(txHash);

    if (!tx) {
      throw new MigrateError("Transaction not found.");
    }

    await Reporter.reportTransactionResponse(tx, instanceName);
  }

  public static reportContracts(...contracts: [string, string][]): void {
    const table: { Contract: string; Address: string }[] = contracts.map(([contract, address]) => ({
      Contract: contract,
      Address: address,
    }));
    console.log();
    console.table(table);
    console.log();
  }
}
