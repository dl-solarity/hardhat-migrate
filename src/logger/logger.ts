import { BigNumber } from "bignumber.js";

export class Logger {
  public totalCost: BigNumber = BigNumber(0);
  public totalTransactions: number = 0;

  logTransaction(tx: any, name: any, printLogs: boolean = false) {
    const excludedKeys = ["contractAddress", "cumulativeGasUsed", "status", "transactionIndex", "type", "logsBloom"];
    let output = this.underline(`Transaction '${name}'`);
    let logs = "";

    for (const [key, value] of Object.entries(tx.receipt)) {
      if (excludedKeys.includes(key)) {
        continue;
      }

      if (key.toLowerCase().includes("logs")) {
        logs += `   + ${(key + ":").padEnd(20)} \n${JSON.stringify(value, null, 2)}\n`;
      } else if (key === "effectiveGasPrice") {
        output += `   + ${"gasPrice:".padEnd(20)} ${BigNumber(<string>value).div(10 ** 9)} gwei\n`;
      } else {
        output += `   + ${(key + ":").padEnd(20)} ${value}\n`;
      }
    }

    if (tx.receipt.effectiveGasPrice != undefined) {
      const totalCost = BigNumber(tx.receipt.effectiveGasPrice)
        .times(tx.receipt.gasUsed)
        .div(10 ** 18);

      output += `   + ${"totalCost:".padEnd(20)} ${totalCost} ETH\n`;
      this.totalCost = this.totalCost.plus(totalCost);
      this.totalTransactions += 1;
    }

    console.log(output);

    if (printLogs) {
      console.log(logs);
    }
  }

  summary() {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${this.totalTransactions}\n` +
      `> ${"Final transaction cost:".padEnd(20)} ${this.totalCost.toString()} ETH\n`;
    console.log(output);
  }

  logContracts(...contracts: any) {
    const table = [];

    for (const element of contracts) {
      table.push({ Contract: element[0], Address: element[1] });
    }

    console.table(table);

    console.log();
  }

  underline(msg: string): string {
    return `\n   ${msg}\n   ${"-".repeat(msg.length)}\n`;
  }
}
