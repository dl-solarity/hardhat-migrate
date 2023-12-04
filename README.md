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

This plugin extends the Hardhat Runtime Environment by adding the following fields:

- `deployer` - The deployer object that is used to deploy contracts.
- `verifier` - The verifier object that is used to verify contracts.

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

[//]: # (You can find an example of migration files in the sample project.)

### Migration Lifecycle

The migration files are sorted by the first digit in the file name and run one after the other in ascending order.

Parameters: `from`, `to`, `only` and `skip` affect the selection of the migration files.

### Deployer

Deployer contains the following functionality:

- **deploy()**

Under the hood, it uses `ContractFactory` from [@ethers](https://www.npmjs.com/package/ethers) to deploy the contracts.

- **deployed()**

Returns the deployed contract instance.

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
