export function logTransaction(tx: any, name: any) {
  console.log(`Transaction ${name}: Gas used ${tx.receipt.gasUsed}, Hash ${tx.tx}\n`);
}

export function logContracts(...contracts: any) {
  const table = [];

  for (const element of contracts) {
    table.push({ "Proxy Contract": element[0], Address: element[1] });
  }

  console.table(table);

  console.log();
}
