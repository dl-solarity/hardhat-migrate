# External Wallets

## Cast Wallet Integration

The Cast integration allows you to use Foundry's cast tool to sign transactions.

### Available Options

The following configuration options are available for Cast wallet:

| Option          | Description                                            |
|-----------------|--------------------------------------------------------|
| `enabled`       | Flag to enable/disable Cast wallet usage               |
| `passwordFile`  | Path to a file containing the keystore password        |
| `keystore`      | Path to a keystore file or directory                   |
| `mnemonicIndex` | The index to use with a mnemonic (default: 0)          |
| `account`       | Account name when using the default keystore directory |
| `interactive`   | Open an interactive prompt for entering private key    |

### Usage

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
npx hardhat migrate --network sepolia --castEnabled --passwordFile ./password
```

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
npx hardhat migrate --network sepolia --trezorEnabled --trezorMnemonicIndex 5
```

## Implementation Details

### Cast Integration
- Uses Node.js `child_process` to execute cast commands
- Provides wrapped functions to interact with cast's wallet functionality
- Automatically handles command construction with appropriate flags

### Trezor Integration
- Uses the official `@trezor/connect` library
- Provides initialization, address retrieval, and transaction signing
