import { format } from "prettier";

import { Reporter } from "./Reporter";

/* eslint-disable no-console */
import { networkManager } from "../network/NetworkManager";

import { TransactionRunner } from "../runners/TransactionRunner";

import { MigrateError } from "../../errors";

export class PublicReporter {
  public static async reportTransactionByHash(txHash: string, name?: string) {
    const tx = await networkManager!.provider.getTransaction(txHash);

    if (!tx) {
      throw new MigrateError("Transaction not found.");
    }

    await TransactionRunner!.reportTransactionResponse(tx, name || "Unknown");
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

  public static async reportContractsMD(...contracts: [string, string][]): Promise<void> {
    const explorer = await Reporter!.getExplorerUrl();
    const normalizedExplorer = explorer.endsWith("/") ? explorer : `${explorer}/address/`;

    let markdownContent;

    const headers = [
      "| Contract      | Address                                    |",
      "|---------------|--------------------------------------------|",
    ];
    const rows = contracts.map(([contract, address]) => {
      const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`; // Shorten address
      return `| ${contract} | [${shortenedAddress}](${normalizedExplorer}${address}) |`;
    });

    markdownContent = [...headers, ...rows].join("\n");
    console.log(
      await format(markdownContent, {
        parser: "markdown",
        printWidth: 80,
        proseWrap: "always",
      }),
    );
  }
}
