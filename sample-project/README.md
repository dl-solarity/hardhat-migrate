# Sample Hardhat Project

This project demonstrates a basic use case of [Hardhat migrate](https://www.npmjs.com/package/@dlsl/hardhat-migrate) plugin. 

It comes with a sample contract and an external library, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat test
npx hardhat node
npx hardhat deploy --network localhost
```

## Deploy and Verify on Goerli 

You can try to deploy and verify the contracts on a Goerli test network.

First you will need to configure the `.env` file, an example of which you can find in this folder.

Next, you could run *deploy* migration with the following command:
```shell
npx hardhat deploy --network goerli --only 1
```

If you want to verify manually multiple contracts, firstly you will need to configure then in `100_tokens.verify.migration.js`, after it, you could run *verify* migration with the following command: 
```shell
npx hardhat verify:batch-verify --network goerli --only 100
```
