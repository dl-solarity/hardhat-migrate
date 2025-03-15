# External Wallets

## Cast Wallet Integration

The Cast integration allows you to use Foundry's cast tool to sign transactions.

### Available Options

The following configuration options are available for Cast wallet:

| Option          | Description                                            |
|-----------------|--------------------------------------------------------|
| `passwordFile`  | Path to a file containing the keystore password        |
| `keystore`      | Path to a keystore file or directory                   |
| `account`       | Account name when using the default keystore directory |

### Usage

In your Hardhat config:

```javascript
module.exports = {
  migrate: {
    castWallet: {
      account: "test-0",
      passwordFile: "./password",
    }
  }
}
```

Or via command line:

```bash
npx hardhat migrate --network sepolia --account test-0 --password-file ./password
```

> [!NOTE]
> If an account or keystore is provided, the plugin will try to use cast to sign transactions.

### Managing Passwords for Deployment

You can store passwords in a `.env` file:

```bash
PASSWORD_TEST_0=password123
```

> [!IMPORTANT]
> The plugin expects the environment variable name to contain the account name itself. 
> If your account is named `test-0` or `test_0`, the plugin will look for an environment variable named `PASSWORD_TEST_0`.

When using `.env` files, you'll need to load these environment variables into your application using a package like `dotenv`:

```ts
import * as dotenv from "dotenv";
dotenv.config();
```

Alternatively, you can export passwords directly in your CLI before deployment:

```bash
export PASSWORD_TEST_0=password123
```

> [!NOTE]
> For security reasons, avoid hardcoding passwords in files that are version-controlled. 
> Consider using environment-specific configuration files that are excluded from your repository.
> Also do not forget to escape [special characters](https://stackoverflow.com/questions/15783701/which-characters-need-to-be-escaped-when-using-bash) in your password if needed.

## Trezor Hardware Wallet Integration

The Trezor integration allows signing transactions with a Trezor hardware wallet for enhanced security.

### Available Options

| Option          | Description                                        |
|-----------------|----------------------------------------------------|
| `enabled`       | Flag to enable/disable Trezor wallet usage         |
| `mnemonicIndex` | Index for the account derivation path (default: 0) |

### Important Notes

- The integration uses the standard Ethereum derivation path: `m/44'/60'/0'/0'/{index}`
- Initial connection requires user interaction with the device to confirm access

### Usage

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
npx hardhat migrate --network sepolia --trezor-enabled --trezor-mnemonic-index 5
```

## Implementation Details

### Cast Integration

- Uses Node.js `child_process` to execute cast commands
- Provides wrapped functions to interact with cast's wallet functionality
- Automatically handles command construction with appropriate flags

### Trezor Integration

- Uses the official `@trezor/connect` library
- Provides initialization, address retrieval, and transaction signing
