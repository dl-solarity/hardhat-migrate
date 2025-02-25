/* eslint-disable no-console */

import { format } from "prettier";

import { Reporter } from "./Reporter";

import { networkManager } from "../network/NetworkManager";

import { TransactionRunner } from "../runners/TransactionRunner";

import { MigrateError } from "../../errors";

export class PublicReporter {
  public static toShortenAddress = true;

  public static async reportTransactionByHash(txHash: string, name?: string) {
    const tx = await networkManager!.provider.getTransaction(txHash);

    if (!tx) {
      throw new MigrateError("Transaction not found.");
    }

    await TransactionRunner!.reportTransactionResponse(tx, name || "Unknown");
  }

  public static reportContracts(...contracts: [name: string, address: string][]): void {
    const table: { Contract: string; Address: string }[] = contracts.map(([contract, address]) => ({
      Contract: contract,
      Address: address,
    }));
    console.log();
    console.table(table);
    console.log();

    Reporter!.notifyStorageAboutContracts(contracts);
  }

  public static async reportContractsMD(...contracts: [name: string, address: string][]): Promise<void> {
    const explorer = await Reporter!.getExplorerUrl();
    const normalizedExplorer = explorer.endsWith("/") ? explorer : `${explorer}/address/`;

    let markdownContent;

    const headers = [
      "| Contract      | Address                                    |",
      "|---------------|--------------------------------------------|",
    ];
    const rows = contracts.map(([contract, address]) => {
      const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`; // Shorten address
      return `| ${contract} | [${this.toShortenAddress ? shortenedAddress : address}](${normalizedExplorer}${address}) |`;
    });

    markdownContent = [...headers, ...rows].join("\n");
    console.log(
      await format(markdownContent, {
        parser: "markdown",
        printWidth: 80,
        proseWrap: "always",
      }),
    );

    Reporter!.notifyStorageAboutContracts(contracts);
  }

  public static disableShortenAddress(): typeof PublicReporter {
    this.toShortenAddress = false;
    return this;
  }
}
