[//]: # ([![npm]&#40;https://img.shields.io/npm/v/@dlsl/hardhat-deploy.svg&#41;]&#40;https://www.npmjs.com/package/@dlsl/hardhat-deploy&#41; [![hardhat]&#40;https://hardhat.org/buidler-plugin-badge.svg?1&#41;]&#40;https://hardhat.org&#41;)

# hardhat-deploy

[Hardhat](https://hardhat.org) plugin to simplify the deployment and verification of contracts 
to [Etherscan](https://etherscan.io).

## What

This plugin helps you deploy verify the source code for your Solidity contracts on [Etherscan](https://etherscan.io).

[//]: # (It's smart and it tries to do as much as possible to facilitate the process:)

[//]: # ()
[//]: # (- Just provide the deployment address and constructor arguments, and the plugin will detect locally which contract to verify.)

[//]: # (- If your contract uses Solidity libraries, the plugin will detect them and deal with them automatically. You don't need to do anything about them.)

[//]: # (- A simulation of the verification process will run locally, allowing the plugin to detect and communicate any mistakes during the process.)

[//]: # (- Once the simulation is successful the contract will be verified using the Etherscan API.)

## Installation

```bash
npm install --save-dev @dlsl/hardhat-deploy
```

And add the following statement to your `hardhat.config.js`:

```js
require("@dlsl/hardhat-deploy");
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```js
import "@dlsl/hardhat-deploy";
```

## Tasks

This plugin provides the `deploy` task, which allows you to deploy and verify contracts.

Under the hood, for verification process, it uses [@nomiclabs/hardhat-etherscan](https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan) 
plugin.  

## Environment extensions

This plugin does not extend the environment.

## Usage

You need to add the following Deploy config to your `hardhat.config.js` file:

```js
module.exports = {
    hardhat_migrate: {
    verify: true,
    confirmations: 5,
    pathToMigrations: "./deploy/migrations/"
  }
};
```

[//]: # (## How it works)

## Known limitations

- Adding, removing, moving or renaming new contracts to the hardhat project or reorganizing the directory structure of contracts after deployment may alter the resulting bytecode in some solc versions. See this [Solidity issue](https://github.com/ethereum/solidity/issues/9573) for further information.
