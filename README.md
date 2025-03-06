[![npm](https://img.shields.io/npm/v/@solarity/hardhat-migrate.svg)](https://www.npmjs.com/package/@solarity/hardhat-migrate) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat migrate

[Hardhat](https://hardhat.org) plugin to simplify the deployment and verification of contracts.

## What

This plugin helps you deploy and verify the source code for your Solidity contracts via migrations. 

With sleek UX that doesn't require writing "deployment wrappers", users can:

- Specify custom smart contract deployment rules and configuration via [@ethers](https://www.npmjs.com/package/ethers).
- Verify smart contracts source code through seamless integration with [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify).
- Leverage "migration recovery mode" that syncs up deployment from the last failed transaction.
- Observe real-time status and logging of executing transactions.
- Simplify Solidity `libraries` usage via auto-linking mechanics.
- Support multiple wallet types, including [Cast Wallet](https://book.getfoundry.sh/cast/) and [Trezor](https://trezor.io/) hardware wallet.
- And much more.

## Installation

```bash
npm install --save-dev @solarity/hardhat-migrate
```

Add the following statement to your `hardhat.config.js`:

```js
require("@solarity/hardhat-migrate");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify"); // If you want to verify contracts
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```ts
import "@solarity/hardhat-migrate";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify"; // If you want to verify contracts
```

> [!NOTE]
> The `@nomicfoundation/hardhat-ethers` import is obligatory as it is used to determine the deployment account.

## Usage

You may add the following `migrate` config to your `hardhat.config` file:

```js
module.exports = {
  migrate: {
    filter: {
      from: -1,
      to: -1,
      only: -1,
      skip: -1,
    },
    verification: {
      verify: false,
      verificationDelay: 5000,
      verifyParallel: 1,
      verifyAttempts: 3,
    },
    paths: {
      pathToMigrations: "./deploy",
      namespace: "",
    },
    execution: {
      force: false,
      continue: false,
      wait: 1,
      transactionStatusCheckInterval: 2000,
      withoutCLIReporting: false,
    },
    castWallet: {
      enabled: false,
      // Optional parameters below
      // passwordFile: "/path/to/password.txt",
      // keystore: "/path/to/keystore",
      // mnemonicIndex: 0,
      // account: "account-name",
      // interactive: false,
    },
    trezorWallet: {
      enabled: false,
      mnemonicIndex: 0,
    },
  },
};
```

Where:

- `filter`
  - `from` - The migration number from which the migration will be applied.
  - `to` - The migration number up to which the migration will be applied.
  - `only` - The number of the migration that will be applied. **Overrides from and to parameters.**
  - `skip`- The number of migration to skip. **Overrides only parameter.**
- `verification`
  - `verify` - The flag indicating whether the contracts have to be verified after all migrations.
  - `verificationDelay` - The delay in milliseconds between the deployment and verification of the contract.
  - `verifyParallel` - The size of the batch for verification.
  - `verifyAttempts` - The number of attempts to verify the contract.
- `paths`
  - `pathToMigrations` - The path to the folder with the specified migrations.
  - `namespace` - The path to the subfolder where the migration should be run.
- `execution`
  - `force` - The flag indicating whether the contracts compilation is forced.
  - `continue` - The flag indicating whether the deployment should restore the state from the previous deployment.
  - `wait` - The number of block confirmations to wait for after the transaction is mined.
  - `transactionStatusCheckInterval` - The interval in milliseconds between transaction status checks.
  - `withoutCLIReporting` - The flag indicating whether the CLI reporting should be disabled.
- `castWallet`
  - `enabled` - The flag indicating whether to use the Cast wallet for signing transactions.
  - `passwordFile` - File path to the keystore password.
  - `keystore` - Use a keystore file or directory.
  - `mnemonicIndex` - The mnemonic index (default 0).
  - `account` - The account name (when using the default keystore directory).
  - `interactive` - Open an interactive prompt to enter your private key.
- `trezorWallet`
  - `enabled` - The flag indicating whether to use the Trezor hardware wallet for signing transactions.
  - `mnemonicIndex` - The mnemonic index for Trezor wallet.

## Tasks

- `migrate` task, which allows you to deploy and automatically verify contracts.
- `migrate:verify` task, which helps you verify already deployed contracts.

To view the available options, run the help command:

```bash
npx hardhat help migrate
```

> [!WARNING]
> If you are willing to verify smart contracts source code, make sure to specify the correct config for the `@nomicfoundation/hardhat-verify` plugin.

## Migration naming

It is **mandatory** to follow this naming convention for migration files:

> X_migration_name.migration.[js|ts]

- Where **X** is an ordinal number indicating the order in which the migration will be applied.
- **migration_name** is simply the name of the migration.

## Example

After importing the necessary dependencies to the `hardhat.config`, create the file `1_token.migration.ts` in the `deploy` directory.

Then run:

```bash
npx hardhat migrate --network <the network of choice>
```

This command will run the migration script and execute all the specified actions, producing the following deployment log:

<table>
<tr>
<th>Migration Script</th>
<th>Deployment Output</th>
</tr>
<tr>
<td>

```ts
// file location: ./deploy/1_token.migration.ts

import { ethers } from "ethers";

import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { ERC20Mock__factory } from "../generated-types/ethers";

export = async (deployer: Deployer) => {
  // deploy the token via `Deployer` object
  const token = await deployer.deploy(
    ERC20Mock__factory, 
    ["Example Token", "ET", 18]
  );

  const recipient = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

  // call the `mint` function on the token
  await token.mint(recipient, ethers.parseEther("1000"), {
    customData: { txName: "Initial Token Mint" },
  });

  // log the token address via `Reporter` object
  await Reporter.reportContractsMD(
    ["Example Token", await token.getAddress()]
  );
};
```
</td>
<td>

```
Migration files:
> 1_token.migration.ts

> Network:             amoy
> Network id:          80002

Starting migration...

Running 1_token.migration.ts...

Deploying ERC20Mock
> explorer: 0x54c96efe35332f8f2f1f1172ce79c79116ffd85733c1e622927b39e639716e0c
> contractAddress: 0x4131287D67125B59935A0671dbBa592fF65C0622
> blockNumber: 18828270
> blockTimestamp: 1741173920
> account: 0xf41ceE234219D6cc3d90A6996dC3276aD378cfCF
> value: 0.0 POL
> balance: 35.978078759922074382 POL
> gasUsed: 571635
> gasPrice: 30.000000015 GWei
> fee: 0.017149050008574525 POL

Transaction: ERC20Mock.mint(address,uint256)(2 arguments)
> explorer: 0x4a2481b749b9b4a444ca270d3a062b41c9c374e3736b2fe35a877caf62c9f5e5
> blockNumber: 18828272
> blockTimestamp: 1741173926
> account: 0xf41ceE234219D6cc3d90A6996dC3276aD378cfCF
> value: 0.0 POL
> balance: 35.976025769921047887 POL
> gasUsed: 68433
> gasPrice: 30.000000015 GWei
> fee: 0.002052990001026495 POL

| Contract      | Address                                    |
| ------------- | ------------------------------------------ |
| Example Token | 0x4131287D67125B59935A0671dbBa592fF65C0622 |

> Total transactions:  2
> Final cost:          0.01920204000960102 POL
```
</td>
</tr>
</table>

The detailed migration report with all information about transactions is automatically saved in the `cache` folder.

## Documentation

For more detailed information, please refer to the following documentation:

- [Deployer API](./docs/Deployer.md) - Core functionality for contract deployment
- [Reporter API](./docs/Reporter.md) - Logging and reporting utilities 
- [Migration Process](./docs/MigrationProcess.md) - Lifecycle and transaction handling
- [External Wallets](./docs/ExternalWallets.md) - Cast Wallet and Trezor integration
- [Detailed Example](./docs/DetailedExample.md) - Comprehensive migration example

## Known limitations

- Adding, removing, moving, or renaming contracts in your Hardhat project or reorganizing the directory structure after deployment may alter the resulting bytecode in some Solidity compiler versions. See this [Solidity issue](https://github.com/ethereum/solidity/issues/9573) for further information.
- This plugin does not function properly with native Ethers factory methods, such as `factory.attach()`. Instead, use `deployer.deployed()`.
