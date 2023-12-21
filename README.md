[![npm](https://img.shields.io/npm/v/@solarity/hardhat-migrate.svg)](https://www.npmjs.com/package/@solarity/hardhat-migrate) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat migrate

[Hardhat](https://hardhat.org) plugin to simplify the deployment and verification of contracts.

## What

This plugin helps you deploy and automatically verify the source code for your Solidity contracts on [Etherscan](https://etherscan.io)-based explorers and explorers compatible with its API like [Blockscout](https://www.blockscout.com/).

This is a fairly simple and rather straightforward Hardhat plugin:

- For deployment, it uses [@ethers](https://www.npmjs.com/package/ethers).

- For verification, it uses [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify).

## Installation

```bash
npm install --save-dev @solarity/hardhat-migrate
```

And add the following statement to your `hardhat.config.js`:

```js
require("@solarity/hardhat-migrate");
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```ts
import "@solarity/hardhat-migrate";
```

> **Important**.

See [How it works](https://github.com/dl-solarity/hardhat-migrate#how-it-works) for further information.

## Naming convention

It is also **mandatory** to specify the naming convention for migrations such as this one:

> X_migration_name.migration.[js|ts]

- Where **X** is an ordinal number of the migration in which it will be applied.
- **migration_name** is simply the name of the migration.

## Tasks

- `migrate` task, which allows you to deploy and automatically verify contracts.
- `migrate:verify` task, which helps you verify already deployed contracts.

> :warning: **Hardhat Config**: Make sure they are follow the docs from `@nomicfoundation/hardhat-verify`.

Do not import `@solarity/hardhat-migrate` and `@nomicfoundation/hardhat-verify`, `@nomicfoundation/hardhat-ethers` together, the etherscan plugin is already included in the migrate plugin.

To view the available options, run the command (help command):

```bash
npx hardhat help migrate
```

## Environment extensions

This plugin does not extend the Hardhat Runtime Environment.

## Usage

You may add the following `migrate` config to your _hardhat config_ file:

```js
module.exports = {
  migrate: {
    from: -1,
    to: -1,
    only: -1,
    skip: -1,
    wait: 1,
    verify: false,
    verifyParallel: 1,
    verifyAttempts: 3,
    pathToMigrations: "./deploy",
    force: false,
    continue: false,
    transactionStatusCheckInterval: 2000,
  },
};
```

### Parameter explanation

- `from` : The migration number from which the migration will be applied.
- `to` : The migration number up to which the migration will be applied.
- `only` : The number of the migration that will be applied. **Overrides from and to parameters.**
- `skip`: The number of migration to skip. **Overrides only parameter.**
- `wait` : The number of confirmations to wait for after the transaction is mined.
- `verify` : The flag indicating whether the contracts should be verified.
- `verifyParallel` : The size of the batch for verification.
- `verifyAttempts` : The number of attempts to verify the contract.
- `pathToMigrations` : The path to the folder with the specified migrations.
- `force` : The flag indicating whether the contracts compilation is forced.
- `continue` : The flag indicating whether the deployment should restore the state from the previous deployment.
- `transactionStatusCheckInterval` : The interval in milliseconds between transaction status checks.

### Deploying

You can set your own migrations and deploy the contracts to the network you want.

#### With only parameter

```console
npx hardhat migrate --network sepolia --verify --only 2
```

In this case, only the migration that begins with digit 2 will be applied. The plugin will also try to automatically verify the deployed contracts.

#### Or with from/to parameters

```console
npx hardhat migrate --network sepolia --from 1 --to 2
```

In this case, migrations 1 through 2 (both) will be applied without the automatic verification.

## How it works

The plugin includes the following packages to perform the deployment and verification process:

- For deployment
  - [@ethers](https://www.npmjs.com/package/ethers)
- For verification:
  - [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify)

The core of this plugin is migration files, you can specify the migration route that suits you best.


### Migration Sample

Below is a sample migration file:

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
3. It is required to import contract factories, or, in the case of Truffle, the necessary Truffle Contract Instance that need to be deployed.
4. Define all relevant constants as necessary.
5. The migration file's main body grants access to the deployer object, allowing for contract deployment and supporting 
recovery from failures in previous migration runs.
6. Standard transaction-sending processes are used without special wrappers.
7. The migration concludes with the `Reporter` class summarizing the migration details.

### Migration Lifecycle

Migration files are executed in ascending order, sorted by the first digit in the file name. 
Parameters such as `from`, `to`, `only`, and `skip` influence the selection of migration files.

### Deployer

The Deployer offers several functionalities:

---

- **deploy(contractInstance, argsOrParameters, parameters)**:
 
Utilizes `ContractFactory` from [@ethers](https://www.npmjs.com/package/ethers) to deploy contracts, inferring types and providing enhanced functionalities like transaction recovery and reporting. It also stores deployment transaction data for later contract verification.

---

- **deployed(contractInstance, contractIdentifier)**: 

Returns the deployed contract instance, inferring types and enhancing functionalities for comfortable interaction.

---

- **sendNative(to, value, name <- optional)**: 

Facilitates sending native assets to a specified address, primarily for the recovery process.

---

- **getSigner(from <- optional)**: 

Retrieves an ethers signer for use in migrations.

---

- **getChainId()**: 

Identifies the current chain ID for the deployment.

### Reporter

The Reporter, a static class, provides functionalities like:

---

- **reportTransactionByHash(hash, name <- optional)**:

Retrieves and displays transaction receipts with standard formatting.

---

- **reportContracts(...contracts: [string, string][])**: 

Displays a list of contract names and addresses in a table format.

---

The usage of these functionalities is demonstrated in the sample migration file above.

#### Truffle native functions

Most of the functions exposed by the Truffle contract, which directly impact or create the Truffle Contract Instance, are not supported.

The following function is supported:
- link

For a usage example, see the deployment scripts in the fixture project created to test how plugins work with Truffle.

### Transactions

We have introduced the capability to assign a specific name to each transaction, enhancing its entropy. 
This feature varies depending on the framework used.

#### Ethers.js Usage:

In Ethers.js, you can specify the transaction name using the `customData` field within the overrides. 
A special field, `txName`, is dedicated for this purpose. 
Here’s an example of how to set a transaction name using Ethers.js:

```javascript
await contract.runner.sendTransaction({ customData: { txName: "Funding Transaction" }});
```

This method helps avoid potential collisions and ensures a smoother recovery process.

#### Truffle Usage:

For those using Truffle, the transaction name can be specified using the `hardfork` field. Here's how you can do it:

``` javascript
await contract.send(1, { hardfork: "Funding Transaction" });
```

#### Purpose

The primary purpose of naming transactions is to facilitate the deployment process.
If an error occurs, you can use the `--continue` flag to resume the deployment from the point of failure. 
The Migrator will utilize these names to distinguish between identical transactions

### Verifier

For a list of parameters that affect the verification process, see [Parameter Explanation](https://github.com/dl-solarity/hardhat-migrate#parameter-explanation).

If verification fails, the `attempts` parameter indicates how many additional requests will be made before the migration process is terminated.

## Known limitations

- This plugin, as well as the [Hardhat Toolbox](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox) plugin, use the [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify) plugin internally, so both of these plugins cannot be imported at the same time. A quick fix is to manually import the needed plugins that ToolBox imports.
- Adding, removing, moving or renaming new contracts to the hardhat project or reorganizing the directory structure of contracts after deployment may alter the resulting bytecode in some solc versions. See this [Solidity issue](https://github.com/ethereum/solidity/issues/9573) for further information.
- This plugin does not function properly with native Truffle methods, such as in `contract.deployed()`, unless otherwise specified above at the instance level. Instead, it is necessary to use the `deployer.deploy()` method.
