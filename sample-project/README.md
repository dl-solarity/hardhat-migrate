# Sample Hardhat Project

This project demonstrates a basic use case of [Hardhat migrate](https://www.npmjs.com/package/@dlsl/hardhat-migrate) plugin. 

It comes with a sample contract and an external library, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat test
npx hardhat node
npx hardhat migrate --network localhost
```

## Deploy and Verify on Goerli 

You can deploy and verify the contracts on a Goerli test network.

First you will need to configure the `.env` file, an example of which you can find in this folder.

Next, run the *deploy* migration with the following command:

```shell
npx hardhat migrate --network goerli --only 1
```

Or, if you want to verify multiple contracts manually, configure them in `100_tokens.verify.migration.js` file and run the *verify* migration with the following command: 

```shell
npx hardhat verify:batch-verify --network goerli --only 100
```
