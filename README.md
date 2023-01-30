[![npm](https://img.shields.io/npm/v/@dlsl/hardhat-migrate.svg)](https://www.npmjs.com/package/@dlsl/hardhat-migrate) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat migrate

[Hardhat](https://hardhat.org) plugin to simplify the deployment and verification of contracts.

## What

This plugin helps you deploy and automatically verify the source code for your Solidity contracts on [Etherscan](https://etherscan.io).

This is a fairly simple and rather straightforward Hardhat plugin:

- For deployment, it uses [@truffle/deployer](https://www.npmjs.com/package/@truffle/deployer) and 
[@truffle/reporters](https://www.npmjs.com/package/@truffle/reporters) to report on the deployment process.

- For verification, it uses [@nomiclabs/hardhat-etherscan](https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan)

## Installation

```bash
npm install --save-dev @dlsl/hardhat-migrate
```

And add the following statement to your `hardhat.config.js`:

```js
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");
require("@dlsl/hardhat-migrate");
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```ts
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-truffle5";
import "@dlsl/hardhat-migrate";
```

> **Important**.

The `@nomiclabs/hardhat-web3` and `@nomiclabs/hardhat-truffle5` are necessary,
as these plugins are used to work with migration files.

See [How it works](https://github.com/dl-solidity-library/hardhat-migrate#how-it-works) for further information.

## Naming convention

It is also **mandatory** to specify the naming convention for migrations such as this one:
> X_migration_name.migration.js

* Where **X** is an ordinal number of the migration in which it will be applied.
* migration_name is simply the name of the migration.

## Tasks

- `migrate` task, which allows you to deploy and automatically verify contracts.
- `migrate:verify` task, which helps you verify already deployed contracts.

Under the hood, for verification process, it uses [@nomiclabs/hardhat-etherscan](https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan) 
plugin.  

> :warning: **Hardhat Config**: Make sure they are follow the docs from `@nomiclabs/hardhat-etherscan`. 

Do not import `@dlsl/hardhat-migrate` and `@nomiclabs/hardhat-etherscan` together, the etherscan plugin is already included in the migrate plugin.

To view the available options, run the command (help command):

```bash
npx hardhat help migrate
```

## Environment extensions

This plugin does not extend the environment.

## Usage

You may add the following `migrate` config to your *hardhat config* file:

```js
module.exports = {
  migrate: {
    from: 1,
    to: 5,
    only: 2,
    skip: 1,
    verify: true,
    attempts: 2,
    confirmations: 5,
    pathToMigrations: "./deploy/", 
    skipVerificationErrors: ["already verified"],
  },
};
```

### Parameter explanation

- `from` : The migration number from which the migration will be applied.
- `to` : The migration number up to which the migration will be applied.
- `only` : The number of the migration that will be applied. **Overrides from and to parameters.**
- `skip`: The number of migration to skip. **Overrides only parameter.**
- `confirmations` : The number defining after how many blocks the verification should start.
- `attempts`: The number of attempts to verify the contract.
- `pathToMigrations` : The path to the folder with the specified migrations.
- `skipVerificationErrors` : The user can specify custom verification errors that will be omitted and just be printed 
to the log instead of stopping the program completely.
By default, if this parameter is not specified, the `already verified` error is omitted.

* `verify` : The flag indicating whether the verification of the contract is needed.
* `force` : The flag indicating whether the contracts compilation is forced.

### Deploying

You can set your own migrations and deploy the contracts to the network you want.

#### With only parameter

```console
$ npx hardhat migrate --network goerli --verify --only 2
```

In this case, only the migration that begins with digit 2 will be applied. The plugin will also try to automatically verify the deployed contracts.

#### Or with from/to parameters

```console
$ npx hardhat migrate --network sepolia --from 1 --to 2
```

In this case, migrations 1 through 2 (both) will be applied without the automatic verification.

### Verifying

> *This plugin has a `migrate:verify` task, to learn how to use it, see the example project.*

#### You can manually verify contracts:

```console
$ npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```

Other examples of manual contract verification can be found here [@nomiclabs/hardhat-etherscan](https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan)


## How it works

The plugin includes the following packages to perform the deployment and verification process:

* For deployment
    * [@nomiclabs/hardhat-web3](https://www.npmjs.com/package/@nomiclabs/hardhat-web3)
    * [@nomiclabs/hardhat-truffle5](https://www.npmjs.com/package/@nomiclabs/hardhat-truffle5)
* For verification:
    * [@nomiclabs/hardhat-etherscan](https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan)

The core of this plugin is migration files, you can specify the migration route that suits you best.

You can find an example of migration files in the sample project.

### Migration Lifecycle

The migration files are sorted by the first digit in the file name and run one after the other in ascending order.

Parameters: `from`, `to`, `only` and `skip` affect the selection of the migration files.

### Deployer

Deployer contains two functions that are used to deploy contracts:

* **Deployment function**
  
Under the hood, it uses `TruffleDeployer` from [@truffle/deployer](https://www.npmjs.com/package/@truffle/deployer) 
and `TruffleReporter` from [@truffle/reporters](https://www.npmjs.com/package/@truffle/reporters) to deploy the contracts and log their statuses during the deployment process.
    
After that, if the user had set the `verify` flag, the contract would be automatically verified. However, 
the execution will wait `confirmations` number of blocks before sending a request to etherscan.

* **Link function**
    
The link function of the `TruffleContract` class from the [@nomiclabs/hardhat-truffle5](https://www.npmjs.com/package/@nomiclabs/hardhat-truffle5) 
package is used to link external libraries to a contract.

### Verifier

If the `verify` flag is set, automatic verification will start immediately after the contract is deployed. 
For a list of parameters that affect the verification process, see [Parameter Explanation](https://github.com/dl-solidity-library/hardhat-migrate#parameter-explanation).

If verification fails, the `attempts` parameter indicates how many additional requests will be made before the migration process is terminated.   

The user can also define which verification errors are irrelevant and have to be ignored using the `skipVerificationErrors` parameter. By default, the `already verified` error is omitted.

### Logger

Logger provides two functions:

* `logTransaction` - logs data about the transaction after its confirmation.
* `logContracts` - logs contract addresses in an assembled table.

## Known limitations

- This plugin, as well as the [Hardhat Toolbox](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox) plugin, use the [@nomiclabs/hardhat-etherscan](https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan) plugin internally, so both of these plugins cannot be imported at the same time. A quick fix is to manually import the needed plugins that ToolBox imports.
- Adding, removing, moving or renaming new contracts to the hardhat project or reorganizing the directory structure of contracts after deployment may alter the resulting bytecode in some solc versions. See this [Solidity issue](https://github.com/ethereum/solidity/issues/9573) for further information.
