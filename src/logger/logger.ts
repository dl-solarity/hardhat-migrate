export function logTransaction(tx: any, name: any, printLogs: boolean = false) {
  let output = `\n   > ${"Transaction name".padEnd(20)} ${name}\n`;
  let logs = "";
  const excludedKeys = ["contractAddress", "cumulativeGasUsed", "status", "transactionIndex", "type", "logsBloom"];
  for (const [key, value] of Object.entries(tx.receipt)) {
    if (!excludedKeys.includes(key)) {
      if (key.toLowerCase().includes("logs")) {
        logs += `   > ${key.padEnd(20)} \n${JSON.stringify(value, null, 2)}\n`;
      } else {
        output += `   > ${key.padEnd(20)} ${value}\n`;
      }
    }
  }

  console.log(output);

  if (printLogs) {
    console.log(logs);
  }
}

export function logContracts(...contracts: any) {
  const table = [];

  for (const element of contracts) {
    table.push({ "Proxy Contract": element[0], Address: element[1] });
  }

  console.table(table);

  console.log();
}
