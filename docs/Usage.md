# Usage

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
      withoutCLIReporting: false,
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
- `withoutCLIReporting` : The flag indicating whether the CLI reporting should be disabled.

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
npx hardhat migrate --network sepolia --castEnabled --keystore ./keys --passwordFile ./password.txt
```

With Trezor hardware wallet:
```bash
npx hardhat migrate --network sepolia --trezorEnabled --trezorMnemonicIndex 5
```
