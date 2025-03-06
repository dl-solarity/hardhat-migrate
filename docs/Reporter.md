# Reporter

The Reporter provides various methods for logging deployment information, automatically saving transactions data to the deployment report.

---

- **reportTransactionByHash(hash, name <- optional)**:

Retrieves and displays transaction receipts with standard formatting.

---

- **reportContracts(...contracts: [string, string][])**: 

Displays a list of contract names and addresses in a table format.

---

- **reportContractsMD(...contracts: [string, string][])**: 

Displays a list of contract names and addresses in Markdown format with links to the block explorer.

---

- **disableShortenAddress()**:

Returns the Reporter class with address shortening disabled. By default, addresses are shortened. Chain with `reportContractsMD` Reporter method:

```typescript
Reporter.disableShortenAddress().reportContractsMD([
  "My Contract", "0x1234567890123456789012345678901234567890"
]);
```

## Deployment Reporting

The plugin automatically generates comprehensive deployment reports throughout the migration process. 
These reports are stored in the cache folder and include:

* List of deployed contracts with addresses
* Transaction details including gas usage and status
* Networks used in the deployment
* Statistics about gas usage and fees paid
* Verification status for contracts
* Any issues encountered during deployment or verification
* Proxy contract linking success/failure
