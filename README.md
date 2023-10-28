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
<!-- - `migrate:verify` task, which helps you verify already deployed contracts. -->

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
    attempts: 0,
    pathToMigrations: "./deploy",
    force: false,
    continue: false,
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
- `attempts`: The number of attempts to verify the contract.
- `pathToMigrations` : The path to the folder with the specified migrations.
- `force` : The flag indicating whether the contracts compilation is forced.
- `continue` : The flag indicating whether the deployment should restore the state from the previous deployment.

### Deploying

You can set your own migrations and deploy the contracts to the network you want.

#### With only parameter

```console
npx hardhat migrate --network goerli --verify --only 2
```

In this case, only the migration that begins with digit 2 will be applied. The plugin will also try to automatically verify the deployed contracts.

#### Or with from/to parameters

```console
npx hardhat migrate --network sepolia --from 1 --to 2
```

In this case, migrations 1 through 2 (both) will be applied without the automatic verification.

<!-- ### Verifying

> _This plugin has a `migrate:verify` task, to learn how to use it, see the example project._

#### You can manually verify contracts

```console
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```

Other examples of manual contract verification can be found here [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify) -->

## How it works

The plugin includes the following packages to perform the deployment and verification process:

- For deployment
  - [@ethers](https://www.npmjs.com/package/ethers)
- For verification:
  - [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify)

The core of this plugin is migration files, you can specify the migration route that suits you best.

You can find an example of migration files in the sample project.

### Migration Lifecycle

The migration files are sorted by the first digit in the file name and run one after the other in ascending order.

Parameters: `from`, `to`, `only` and `skip` affect the selection of the migration files.

### Deployer

Deployer contains the following functionality:

- **deploy()**

Under the hood, it uses `ContractFactory` from [@ethers](https://www.npmjs.com/package/ethers) to deploy the contracts.

- **deployed()**

Returns the deployed contract instance.

- **Link function**

Used for backward compatibility with Truffle migrations.

The link function of the `TruffleContract` class from the [@nomiclabs/hardhat-truffle5](https://www.npmjs.com/package/@nomiclabs/hardhat-truffle5)
package is used to link external libraries to a contract.

### Verifier

For a list of parameters that affect the verification process, see [Parameter Explanation](https://github.com/dl-solarity/hardhat-migrate#parameter-explanation).

If verification fails, the `attempts` parameter indicates how many additional requests will be made before the migration process is terminated.

<!-- The user can also define which verification errors are irrelevant and have to be ignored using the `skipVerificationErrors` parameter. By default, the `already verified` error is omitted. -->

## Known limitations

- This plugin, as well as the [Hardhat Toolbox](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox) plugin, use the [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify) plugin internally, so both of these plugins cannot be imported at the same time. A quick fix is to manually import the needed plugins that ToolBox imports.
- Adding, removing, moving or renaming new contracts to the hardhat project or reorganizing the directory structure of contracts after deployment may alter the resulting bytecode in some solc versions. See this [Solidity issue](https://github.com/ethereum/solidity/issues/9573) for further information.
