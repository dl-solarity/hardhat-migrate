# Changelog

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
