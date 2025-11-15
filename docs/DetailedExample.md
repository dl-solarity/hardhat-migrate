# Detailed Example

Below is a sample migration file (`1_simple.migration.ts`) written in ESM, which is the default for Hardhat 3 projects:

```ts
import type { Deployer } from "@solarity/hardhat-migrate/dist/src/internal/deployer/Deployer.js";
import { PublicReporter as Reporter } from "@solarity/hardhat-migrate/dist/src/internal/tools/reporters/PublicReporter.js";

import { ERC20Mock__factory } from "../typechain-types";
import { ethers } from "ethers";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export default async function (deployer: Deployer) {
  const token = await deployer.deploy(ERC20Mock__factory, ["Example Token", "ET", 18]);

  await (
    await token.mint(TOKEN_OWNER, ethers.parseEther("1000"), {
      customData: { txName: "Mint allocation" },
    })
  ).wait();

  await Reporter.reportContractsMD(["Example Token", await token.getAddress()]);
}
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
7. The migration concludes with the `PublicReporter` helper summarizing the migration details.
