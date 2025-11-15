# Migration Lifecycle

Migration files are executed in ascending order, sorted by the ordinal file number (the number in the file name). 
Parameters such as `filter.from`, `filter.to`, `filter.only`, and `filter.skip` influence the selection of migration files.

## Transactions

We have introduced the capability to assign a specific name to each transaction, enhancing its entropy. 
This feature varies depending on the framework used.

## Ethers.js Usage:

In Ethers.js, you can specify the transaction name using the `customData` field within the overrides. 
A special field, `txName`, is dedicated for this purpose.

Here's an example of how to set a transaction name using Ethers.js:

```javascript
await govToken.transferOwnership(TOKEN_OWNER, { customData: { txName: "Transfer Ownership" }});
```

This method helps avoid potential collisions and ensures a smoother recovery process.

## Purpose

The primary purpose of naming transactions is to facilitate the deployment process.
If an error occurs, you can use the `--continue` flag to resume the deployment from the point of failure. 
The Migrator will utilize these names to distinguish between identical transactions

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

# Verifier

Configuration options that influence verification are documented in the [README configuration section](../README.md#configuration).

If verification fails, the `verification.verifyAttempts` parameter only governs how many times the plugin retries contacting the explorer after migrations finish—it does not roll back or halt the deployment step itself.
