# Changelog

## Version 3.0.0

### Breaking changes

- Removed Truffle support.
- Removed import of `@nomicfoundation/hardhat-verify` from the index.ts.
  - Please refer to the `Installation` section in the README for the updated installation instructions.
  - The motivation is to avoid conflicts with `@nomicfoundation/hardhat-toolbox` when using both plugins.
- Removed the default conversion of the `bigint` to `string` for the `JSON.stringify` function.

### New features

- Added an ability to specify namespaces for deployment scripts.

Now instead of having all deployment scripts in the `deploy` folder, tou can separate those into subfolders like below.

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

- Added an ability to disable address shortening in the reporter with following syntax: `PublicReporter.disableShortenAddress().reportContractsMD`

- Added file reporting throughout the migration process
  - During the migration the relevant report will be generated and stored in the `cache` folder.
  
- Added an ability to link proxy to the implementation contract
  - The linking is decided based on the presence of the `IMPLEMENTATION_SLOT` in the contract

## Version 2.1.11 

* Added a caching mechanism to reduce the number of requests to the RPC provider.  
* Removed handling of network errors due to the high instability of the current implementation of the network handler.  
* Updated packages and replaced `require` with `await import` to load migration files.  
* Updated the version of the eslint package to the latest one.  
* Added the `reportContractsMD` function to the public reporter.  
* Fixed a bug where migration files were missing when running the migration command from outside the project root.  

## Version 2.1.10

* Added an ability to change signer during the migration

## Version 2.1.9

* Updated dependencies
* Fixed a bug when the cache was not saved if the `cache` directory did not exist
* Exported `TransactionStorage`, `VerificationStorage`, and `ArtifactStorage` for convenience

## Version 2.1.8

* Fixed a bug where remote chain metadata overwrote the local one.

## Version 2.1.7

* Fixed a visual bug that sometimes `total cost` was displayed incorrectly.

## Version 2.1.6

* Fixed a bug when the default signer was used instead of the actual signer.

## Version 2.1.5

* Fixed behaviour of connect method in Ethers Adapter. 

## Version 2.1.4

* Deleted `pinst` package.

## Version 2.1.3

* Added the `verificationDelay` parameter, which defines the time in milliseconds that must pass before the verification process starts.
* Added health check for the explorer links before the verification process starts
* Added `BigInt.prototype.toJSON` to the `BigInt` type to fix the issue with the `BigInt` type in the `JSON.stringify` function.

## Version 2.1.2

* Updated the ethers version to `6.1.1` to address issue: [4583](https://github.com/ethers-io/ethers.js/issues/4583).

## Version 2.1.1

* Fixed a bug related to the shallow copying and mutation of arguments within the `getMethodString` function.
* Added ability to retrieve the class name from the contract instance.

## Version 2.1.0

* Updated packages to their latest versions (updated `@nomicfoundation/hardhat-verify` to version `2.0.4`).
* Added a `save` function to the Deployer class to enable saving the contract to storage without deploying it.

## Version 2.0.1

* Fixed a bug where an instance of a storage object overwrote the state of another object in the file.
* Changed the way of naming for Truffle transactions to `txName`.

## Version 2.0.0

* Removed redundant Hardhat Runtime Extensions.
* Removed Verifier from Migrator class.
* Revised the test infrastructure and architecture.
* Fixed bugs related to the recovery of contract names.
* Fixed a bug related to contract recovery when a custom name is used.
* Migrated test fixture projects to TypeScript, updating configurations and scripts. 
  Created new fixture contracts for testing and deleted auto-generated files.
* Added `TransactionFieldsToSave` as a return value to the `sendNative` function
* Added handling of the custom chains specified in the Hardhat config
* Refactored the architecture and made it consistent
* Used spinner instead of `console.log` for network errors

## Version 2.0.0-alpha.22

* Enforce the overwriting in ArtifactStorage in the case of bytecodeHash as a key

## Version 2.0.0-alpha.21

* Fix a bug related to parsing the same bytecode for two different contracts

## Version 2.0.0-alpha.20

* Remove redundant initializers in a verifier task

## Version 2.0.0-alpha.19

* Handle the potentially undefined tx.customData.txName field

## Version 2.0.0-alpha.18

* Handle the partially linked Bytecode in the Truffle Adapter.

## Version 2.0.0-alpha.17

* Separated the logic of the Reporter and moved transaction-related functions to the TransactionRunner class.
* Added the ability to specify a name for each transaction, essentially enabling the same transaction to be distinguishable. Also fixed a few bugs related to migration storage.
* Added a Network Manager to handle network errors and implemented logic for reconnection. Also updated the Reporter to support these changes properly.

## Version 2.0.0-alpha.16

* Fixed a bug when txs could not be sent with overrides
* Eliminate a collision warning during recovery

## Version 2.0.0-alpha.15

* Added ethers to dependencies

## Version 2.0.0-alpha.12

* Added ability to accept Overrides as second parameter to the `deploy` function.

## Version 2.0.0-alpha.11

* Initially, the fully qualified name is used to retrieve a contract from the Transaction Storage.
* If the fully qualified name is absent, the recovery process falls back to using the `ContractFieldsToSave` derived from the contract.
* Should the name be located, the `ContractFieldsToSave` is disregarded and is not used as a key within the Transaction Storage.

## Version 2.0.0-alpha.2

* Library linking fully relies on the hardhat artifacts.

## Version 2.0.0-alpha.1

This release represents a major update to our plugin. We have completely rebuilt the core logic from scratch, now using ethersV6. 
Additionally, we have conducted a comprehensive code walkthrough, addressing and resolving bugs, as well as introducing new features.

### Breaking changes

* Removed the logger from migrations. Logging functionality is now fully integrated within the plugin.
* Restructured the arguments passed to the `deploy` function.
* Transitioned to using the `hardhat-verify` plugin for contract verification.

### Deployer

* Added support for EthersV5, EthersV6, and TruffleV5 through Adapters.
* Introduced types support for EthersV5 and EthersV6 only, including constructor arguments validation.
* Implemented a library linking during contract deployment.
* Enhanced reporting during contract deployment.
* Enabled recoverability of contract deployments.
* Improved error reporting during contract deployment.
* Added special user storage between deployments.

### Verifier

* Utilized the `hardhat-verify` plugin for contract verification.
* Added three types of verification: "immediately," "at-the-end," and "none."
* Introduced Verification processor and Verification Storage to enable verification of all deployed contracts at the end of the migration.
* Implemented verification error handling.
* Utilized Reporter to override the default 'hardhat-verify' logging.

## New tools

### Reporter

Centralizes all console logging.

### Storage

A module that stores necessary data for the migration process in a JSON file. 
The default path is the `artifacts/build-info` folder.

...
