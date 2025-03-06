# Detailed Example

Below is a sample migration file (1_simple.migration.ts):

```ts 
import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { GovToken__factory } from "../typechain-types";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  const govToken = await deployer.deploy(GovToken__factory, ["Token", "TKN"]);
  
  const transferOwnershipTx = (await (await govToken.transferOwnership(TOKEN_OWNER)).wait())!;
  
  await Reporter.reportTransactionByHash(
    transferOwnershipTx.hash,
    "Transfer Ownership of Governance Token to Token Owner",
  );
  
  Reporter.reportContracts([
    `Governance Token ${await govToken.name()} (${await govToken.symbol()}) Address`,
    await govToken.getAddress(),
  ]);
};
```

This example illustrates the basic principles of how migrations operate:

1. The core component is the `Deployer` object, which acts as a wrapper for the [@ethers](https://www.npmjs.com/package/ethers) 
library, facilitating the deployment and processing of contracts.
2. The `Reporter` class, a static entity, logs intermediary information into the console.
3. It is required to import contract factories.
4. All relevant constants can be defined if necessary.
5. The migration file's main body grants access to the deployer object, allowing for contract deployment and supporting 
recovery from failures in previous migration runs.
6. Standard transaction-sending processes are used without special wrappers.
7. The migration concludes with the `Reporter` class summarizing the migration details.
