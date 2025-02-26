[![npm](https://img.shields.io/npm/v/@solarity/hardhat-migrate.svg)](https://www.npmjs.com/package/@solarity/hardhat-migrate) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat migrate

[Hardhat](https://hardhat.org) plugin to simplify the deployment and verification of contracts.

## What

This plugin helps you deploy and verify the source code for your Solidity contracts through the specification of migrations. With sleek UX, the plugin enables users to:

- Specify custom smart contracts deployment rules and configuration via [@ethers](https://www.npmjs.com/package/ethers).
- Relax from the source code verification hassle due to seamless integration with [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify).
- Leverage the "migration recovery mode" that automatically syncs up the deployment to the last failed transaction.
- Observe the real-time status of transactions being executed.
- Simplify the `libraries` usage via auto-linking mechanics.
- Support for multiple wallet types, including [Cast Wallet](https://book.getfoundry.sh/cast/) and [Trezor](https://trezor.io/) hardware wallet.
- And much more.

## Installation

```bash
npm install --save-dev @solarity/hardhat-migrate
```

And add the following statement to your `hardhat.config.js`:

```js
require("@solarity/hardhat-migrate");
require("@nomicfoundation/hardhat-verify"); // If you want to verify contracts after deployment
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```ts
import "@solarity/hardhat-migrate";
import "@nomicfoundation/hardhat-verify"; // If you want to verify contracts after deployment
```

> [!NOTE]
> See [How it works](https://github.com/dl-solarity/hardhat-migrate#how-it-works) for further information.

## Naming convention

It is also **mandatory** to specify the naming convention for migrations such as this one:

> X_migration_name.migration.[js|ts]

- Where **X** is an ordinal number of the migration in which it will be applied.
- **migration_name** is simply the name of the migration.

## Tasks

- `migrate` task, which allows you to deploy and automatically verify contracts.
- `migrate:verify` task, which helps you verify already deployed contracts.

> [!WARNING]
> **Hardhat Config**: Make sure they follow the docs from `@nomicfoundation/hardhat-verify`.

Do not forget to import `@nomicfoundation/hardhat-verify` when using `@solarity/hardhat-migrate` plugin to verify contracts after deployment.

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

### Parameter explanation

#### Filter Parameters

- `from` : The migration number from which the migration will be applied.
- `to` : The migration number up to which the migration will be applied.
- `only` : The number of the migration that will be applied. **Overrides from and to parameters.**
- `skip`: The number of migration to skip. **Overrides only parameter.**

#### Verification Parameters

- `verify` : The flag indicating whether the contracts have to be verified after all migrations.
- `verificationDelay` : The delay in milliseconds between the deployment and verification of the contract.
- `verifyParallel` : The size of the batch for verification.
- `verifyAttempts` : The number of attempts to verify the contract.

#### Path Parameters

- `pathToMigrations` : The path to the folder with the specified migrations.
- `namespace`: The path to the folder where the migration should be done.
   - This parameter is used together with the `pathToMigrations` parameter. If the `namespace` parameter specified, the migrations will be retrieved from following path: `{hardhat.config.path.root}/{pathToMigrations}/{namespace}`

#### Execution Parameters

- `force` : The flag indicating whether the contracts compilation is forced.
- `continue` : The flag indicating whether the deployment should restore the state from the previous deployment.
- `wait` : The number of confirmations to wait for after the transaction is mined.
- `transactionStatusCheckInterval` : The interval in milliseconds between transaction status checks.

#### Cast Wallet Parameters

- `enabled`: The flag indicating whether to use the Cast wallet for signing transactions.
- `passwordFile`: File path to the keystore password.
- `keystore`: Use a keystore file or directory.
- `mnemonicIndex`: The mnemonic index (default 0).
- `account`: The account name (when using the default keystore directory).
- `interactive`: Open an interactive prompt to enter your private key.

#### Trezor Wallet Parameters

- `enabled`: The flag indicating whether to use the Trezor hardware wallet for signing transactions.
- `mnemonicIndex`: The mnemonic index for Trezor wallet.

### Deploying

You can set your own migrations and deploy the contracts to the network you want.

#### With only parameter

```bash
npx hardhat migrate --network sepolia --verify --only 2
```

In this case, only the migration that begins with digit 2 will be applied.

The plugin will also attempt to automatically verify the deployed contracts after all migrations are complete.

#### Or with from/to parameters

```bash
npx hardhat migrate --network sepolia --from 1 --to 2
```

In this case, migrations 1 through 2 (both) will be applied without the automatic verification.

#### Using a specific wallet

With Cast Wallet:
```bash
npx hardhat migrate --network sepolia --castWalletEnabled --keystore ./keys --passwordFile ./password.txt
```

With Trezor hardware wallet:
```bash
npx hardhat migrate --network sepolia --trezorEnabled --trezorMnemonicIndex 5
```

## How it works

The plugin includes the following packages to perform the deployment and verification process:

- For deployment
  - [@ethers](https://www.npmjs.com/package/ethers)
- For verification:
  - [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify)

The core of this plugin is migration files, you can specify the migration route that suits you best.

### Migration Sample

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

### Migration Lifecycle

Migration files are executed in ascending order, sorted by the ordinal file number (the number in the file name). 
Parameters such as `filter.from`, `filter.to`, `filter.only`, and `filter.skip` influence the selection of migration files.

### Deployer

The Deployer offers several functionalities:

---

- **deploy(contractInstance, argsOrParameters, parameters)**:
 
Utilizes `ContractFactory` from [@ethers](https://www.npmjs.com/package/ethers) to deploy contracts, inferring types and providing enhanced functionalities like transaction recovery and reporting. It also stores deployment transaction data for later contract verification.

---

- **save(contractInstance | name, address)**:
 
Saves the contract to storage under the given `address` without deployment.

---

- **deployed(contractInstance, contractIdentifier)**: 

Returns the deployed contract instance, inferring types and enhancing functionalities for comfortable interaction.

---

- **deployERC1967Proxy(implementationFactory, argsOrParameters, parameters)**:

Deploys an implementation contract and an ERC1967 proxy pointing to it. The implementation is deployed first, and then the proxy is deployed with the implementation's address. Returns a contract instance representing the proxied implementation.

---

- **deployTransparentUpgradeableProxy(implementationFactory, proxyAdmin, argsOrParameters, parameters)**:

Deploys an implementation contract and a Transparent Upgradeable Proxy pointing to it. Requires a valid proxy admin address. Returns a contract instance representing the proxied implementation.

---

- **deployProxy(implementationFactory, proxyFactoryName, proxyArgs, argsOrParameters, parameters)**:

Generic method for deploying proxies with custom logic.

---

- **sendNative(to, value, name <- optional)**: 

Facilitates sending native assets to a specified address, primarily for the recovery process.

---

- **setSigner(from <- optional)**:

Sets the signer for the following transactions and deployments.

If the `from` parameter is not specified, the signer is reset to the default.

---

- **getSigner(from <- optional)**: 

Retrieves an ethers signer for use in migrations.

---

- **getChainId()**: 

Identifies the current chain ID for the deployment.

### Reporter

The Reporter provides various methods for logging deployment information.
Automatically saves transaction data to the deployment report.

---

- **reportTransactionByHash(hash, name <- optional)**:

Retrieves and displays transaction receipts with standard formatting.

---

- **reportContracts(...contracts: [string, string][])**: 

Displays a list of contract names and addresses in a table format.

---

- **reportContractsMD(...contracts: [string, string][])**: 

Displays a list of contract names and addresses in Markdown format with links to the block explorer.

---

- **disableShortenAddress()**:

Returns the Reporter class with address shortening disabled. By default, addresses are shortened. Chain with `reportContractsMD` Reporter method:

```typescript
Reporter.disableShortenAddress().reportContractsMD([
  "My Contract", "0x1234567890123456789012345678901234567890"
]);
```

### Deployment Reporting

The plugin automatically generates comprehensive deployment reports throughout the migration process. 
These reports are stored in the cache folder and include:

* List of deployed contracts with addresses
* Transaction details including gas usage and status
* Networks used in the deployment
* Statistics about gas usage and fees paid
* Verification status for contracts
* Any issues encountered during deployment or verification
* Proxy contract linking success/failure

### Transactions

We have introduced the capability to assign a specific name to each transaction, enhancing its entropy. 
This feature varies depending on the framework used.

#### Ethers.js Usage:

In Ethers.js, you can specify the transaction name using the `customData` field within the overrides. 
A special field, `txName`, is dedicated for this purpose.

Here's an example of how to set a transaction name using Ethers.js:

```javascript
await govToken.transferOwnership(TOKEN_OWNER, { customData: { txName: "Transfer Ownership" }});
```

This method helps avoid potential collisions and ensures a smoother recovery process.

#### Purpose

The primary purpose of naming transactions is to facilitate the deployment process.
If an error occurs, you can use the `--continue` flag to resume the deployment from the point of failure. 
The Migrator will utilize these names to distinguish between identical transactions

### Verifier

For a list of parameters that affect the verification process, see [Parameter Explanation](https://github.com/dl-solarity/hardhat-migrate#parameter-explanation).

If verification fails, the `verification.verifyAttempts` parameter indicates how many additional requests will be made before the migration process is terminated.

### Namespaces

Instead of having all deployment scripts in the `deploy` folder, you can separate those into subfolders:

```
deploy
├── l1-deployment
│   ├── 1_core.migration.ts
│   └── 2_setup.migration.ts
└── l2-testnet
    ├── 1_prepare.migration.ts
    └── 2_deploy.migration.ts
```

And when running the migration, you can specify the namespace like this:
```bash
npx hardhat migrate --namespace l1-deployment
```

## Cast and Trezor Wallet Integration Changelog

### Cast Wallet Integration

The Cast integration allows you to use Foundry's cast tool to sign transactions.

#### Available Options

The following configuration options are available for Cast wallet:

| Option          | Description                                            |
|-----------------|--------------------------------------------------------|
| `enabled`       | Flag to enable/disable Cast wallet usage               |
| `passwordFile`  | Path to a file containing the keystore password        |
| `keystore`      | Path to a keystore file or directory                   |
| `mnemonicIndex` | The index to use with a mnemonic (default: 0)          |
| `account`       | Account name when using the default keystore directory |
| `interactive`   | Open an interactive prompt for entering private key    |

#### Usage

In your Hardhat config:
```javascript
module.exports = {
  migrate: {
    castWallet: {
      enabled: true,
      passwordFile: "./password",
    }
  }
}
```

Or via command line:
```bash
npx hardhat migrate --network sepolia --castWalletEnabled --passwordFile ./password
```

### Trezor Hardware Wallet Integration

The Trezor integration allows signing transactions with a Trezor hardware wallet for enhanced security.

#### Available Options

| Option          | Description                                        |
|-----------------|----------------------------------------------------|
| `enabled`       | Flag to enable/disable Trezor wallet usage         |
| `mnemonicIndex` | Index for the account derivation path (default: 0) |

#### Important Notes

- Only **empty passphrases** are currently supported
- The integration uses the standard Ethereum derivation path: `m/44'/60'/0'/0/{index}`
- Requires the Trezor Bridge to be installed on the host system
- Initial connection requires user interaction with the device to confirm access

#### Usage

In your Hardhat config:
```javascript
module.exports = {
  migrate: {
    trezorWallet: {
      enabled: true,
      mnemonicIndex: 0
    }
  }
}
```

Or via command line:
```bash
npx hardhat migrate --network sepolia --trezorEnabled --trezorMnemonicIndex 5
```

### Implementation Details

#### Cast Integration
- Uses Node.js `child_process` to execute cast commands
- Provides wrapped functions to interact with cast's wallet functionality
- Automatically handles command construction with appropriate flags

#### Trezor Integration
- Uses the official `@trezor/connect` library
- Provides initialization, address retrieval, and transaction signing

## Known limitations

- Adding, removing, moving or renaming new contracts to the hardhat project or reorganizing the directory structure of contracts after deployment may alter the resulting bytecode in some solc versions. See this [Solidity issue](https://github.com/ethereum/solidity/issues/9573) for further information.
- This plugin does not function properly with native Ethers factories methods, such as `factory.attach()`. So, instead of using mentioned method, it is necessary to use the `deployer.deployed()`.
