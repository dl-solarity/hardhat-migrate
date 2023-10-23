# Changelog

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
