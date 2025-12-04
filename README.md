[![npm](https://img.shields.io/npm/v/@solarity/hardhat-migrate.svg)](https://www.npmjs.com/package/@solarity/hardhat-migrate) [![hardhat](https://hardhat.org/buidler-plugin-badge.svg?1)](https://hardhat.org)

# Hardhat Migrate

The simplest way to deploy smart contracts.

## What

This plugin helps you deploy and verify the source code for your Solidity contracts via migrations. 

With sleek UX that doesn't require writing "deployment wrappers", users can:

- Specify custom smart contract deployment rules and configuration via [@ethers](https://www.npmjs.com/package/ethers).
- Verify smart contracts source code through seamless integration with [@nomicfoundation/hardhat-verify](https://www.npmjs.com/package/@nomicfoundation/hardhat-verify).
- Leverage "migration recovery mode" that syncs up deployment from the last failed transaction.
- Observe real-time status and logging of executing transactions.
- Check out the generation of deployment reports in Markdown (.md) or JSON (.json) format.
- Simplify Solidity `libraries` usage via auto-linking mechanics.
- Support multiple wallet types, including [Cast Wallet](https://book.getfoundry.sh/cast/) and [Trezor](https://trezor.io/) hardware wallet.
- And much more.

## Installation

### 1. Install the dependencies

```bash
npm install --save-dev @solarity/hardhat-migrate @nomicfoundation/hardhat-ethers @nomicfoundation/hardhat-verify
```

### 2. Register the plugin in `hardhat.config.ts`

```ts
import { HardhatUserConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import hardhatMigrate from "@solarity/hardhat-migrate";

const config: HardhatUserConfig = {
  plugins: [hardhatEthers, hardhatVerify, hardhatMigrate],
  // networks, solidity, ...
};

export default config;
```

> [!NOTE]
> `@nomicfoundation/hardhat-ethers` must be available so the deployer can resolve the active signer.

### Environment extensions

## Tasks

- `migrate` — compiles, runs numbered migration files, reports progress, and (optionally) verifies contracts.
- `migrate:verify` — reuses `.migrate.storage` data to verify previously deployed contracts in batch mode.

Run `npx hardhat help migrate` (or `migrate:verify`) to inspect every flag.

## Configuration

Add a `migrate` section to `HardhatUserConfig`. The snippet below shows all defaults:

```ts
const config: HardhatUserConfig = {
  plugins: [hardhatEthers, hardhatVerify, hardhatMigrate],
  migrate: {
    filter: { from: -1, to: -1, only: -1, skip: -1 },
    verification: { verify: false, verificationDelay: 5000, verifyParallel: 1, verifyAttempts: 3 },
    paths: { pathToMigrations: "./deploy", namespace: "", reportPath: "cache", reportFormat: "md" },
    execution: {
      force: false,
      continue: false,
      wait: 1,
      transactionStatusCheckInterval: 2000,
      withoutCLIReporting: false,
    },
    castWallet: {
      passwordFile: "/path/to/password",
      keystore: "/path/to/keystore",
      account: "account-name",
    },
    trezorWallet: {
      enabled: false,
      mnemonicIndex: 0,
    },
  },
};
```

- **filter** — choose which migration numbers run (`only` overrides `from`/`to`; `skip` overrides `only`).
- **verification** — toggle automatic verification and control retries, delays, and parallelism.
- **paths** — point to the folder that stores migrations (`pathToMigrations` + optional `namespace`), and configure where/how reports are written (`cache`/`md` by default).
- **execution** — manage compilation forcing, `--continue` mode, confirmation depth (`wait`), spinner refresh rate, and opt-out of CLI reporting.
- **castWallet / trezorWallet** — opt into external signers via config or CLI flags (see [External Wallets](./docs/ExternalWallets.md)).

> [!NOTE]
> Cast-based signing is only enabled once you provide `account`, `keystore`, or the matching CLI flags/environment variables.

Every CLI flag maps 1:1 to these settings (kebab-cased). For example, `npx hardhat migrate --verify --verify-parallel 3 --namespace l2` 
overrides the corresponding config fields for that run.

## Usage

Each migration file must match `X_name.migration.ts` (where `X` is the execution order). Hardhat Migrate injects an instance 
of `Deployer` into the default-exported async function so you can focus on contract logic and recovery.

```ts
// ./deploy/1_token.migration.ts
import { ethers } from "ethers";
import type { Deployer } from "@solarity/hardhat-migrate";
import { Reporter } from "@solarity/hardhat-migrate";

import { ERC20Mock__factory } from "../generated-types/ethers";

export default async function (deployer: Deployer) {
  const token = await deployer.deploy(ERC20Mock__factory, ["Example Token", "ET", 18]);

  await (await token.mint("0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B", ethers.parseEther("1000"), {
    customData: { txName: "Mint allocation" },
  })).wait();

  await Reporter.reportContractsMD(["Example Token", await token.getAddress()]);
}
```

`npx hardhat migrate --network sepolia` compiles contracts (forced when `execution.force` is true), runs each script in order, 
shows live transaction status, and produces Markdown/JSON reports under `cache/`.

## Verification

If `migrate.verification.verify` is `true`, verification kicks in right after the last migration finishes. You can re-run verification later via `npx hardhat migrate:verify --input-file ./cache/.migrate.storage.json --parallel 4 --attempts 5`.

## Migration naming & namespaces

Place migrations under `pathToMigrations` (default `./deploy`) and prefix them with an ordinal: `1_token.migration.ts`, `2_setup.migration.ts`, etc. To isolate environments, create subfolders and set `migrate.paths.namespace` or pass `--namespace <folder>`:

```
deploy
├── l1
│   ├── 1_core.migration.ts
│   └── 2_setup.migration.ts
└── l2-testnet
    ├── 1_prepare.migration.ts
    └── 2_bridge.migration.ts
```

`npx hardhat migrate --namespace l2-testnet` executes only the files inside that scope.

## Recovery & transaction naming

Enable `execution.continue` (or pass `--continue`) to resume from the first failed transaction. To avoid collisions when 
rerunning the same contract method, set `txName` via `overrides.customData`:

```ts
await contract.someMethod(value, { customData: { txName: "configure:v1" } });
```

Recovered transactions/contracts are logged so you can confirm what was reused versus redeployed. 
If collisions are detected, the CLI warns that recovery might be unreliable and suggests supplying explicit names.

## External wallets

Hardhat Migrate can sign via Foundry Cast or Trezor Connect in addition to the default Hardhat signer.

```ts
const config: HardhatUserConfig = {
  // ...
  migrate: {
    castWallet: { account: "test-0", passwordFile: "./passwords/.env" },
    trezorWallet: { enabled: false, mnemonicIndex: 0 },
  },
};
```

CLI overrides are available as `--account`, `--password-file`, `--keystore`, `--trezor-enabled`, and `--trezor-mnemonic-index`. 
See [External Wallets](./docs/ExternalWallets.md) for best practices around secrets.

## Example

The snippet below shows the structure of a simple migration alongside the corresponding CLI output and stored report.

<table>
<tr>
<th>Migration Script</th>
<th>Deployment Output</th>
<th>Migration Report</th>
</tr>
<tr>
<td>

```ts
// file location: ./deploy/1_token.migration.ts

import { ethers } from "ethers";
import type { Deployer } from "@solarity/hardhat-migrate";
import { PublicReporter as Reporter } from "@solarity/hardhat-migrate";

import { ERC20Mock__factory } from "../generated-types/ethers";

export default async (deployer: Deployer) => {
  const token = await deployer.deploy(ERC20Mock__factory, ["Example Token", "ET", 18]);

  const recipient = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";
  const amount = ethers.parseEther("1000");

  await token.mint(recipient, amount, { customData: { txName: "Airdrop" } });

  await Reporter.reportContractsMD(["Example Token", await token.getAddress()]);
};
```
</td>
<td>

```
Migration files:
> 1_token.migration.ts

> Network:             sepolia
> Network id:          11155111

Starting migration...

Running 1_token.migration.ts...

Deploying ERC20Mock
> explorer: 0xc35dd9e9600f102cf3b414f1341560870021b3824ace4bedbd59e2216bd89a49
> contractAddress: 0xc596A6e2f1558c7e030272d2A2E37E53050E2D63
> blockNumber: 7844739
> blockTimestamp: 1741263816
> account: 0xf41ceE234219D6cc3d90A6996dC3276aD378cfCF
> value: 0.0 ETH
> balance: 0.117945868841929599 ETH
> gasUsed: 571635
> gasPrice: 96.422889727 GWei
> fee: 0.055118698569093645 ETH

Transaction: ERC20Mock.mint(address,uint256)(2 arguments)
> explorer: 0x508a289795cb8e3e1265dfd8f528efc206146a62deba4f9a80a2fa19d6a6ec8e
> blockNumber: 7844740
> blockTimestamp: 1741263828
> account: 0xf41ceE234219D6cc3d90A6996dC3276aD378cfCF
> value: 0.0 ETH
> balance: 0.111637670105208768 ETH
> gasUsed: 68433
> gasPrice: 92.180654607 GWei
> fee: 0.006308198736720831 ETH

| Contract      | Address                                    |
| ------------- | ------------------------------------------ |
| Example Token | 0xc596A6e2f1558c7e030272d2A2E37E53050E2D63 |

> Total transactions:  2
> Final cost:          0.061426897305814476 ETH
```
</td>
<td>

# Migration Report 2025-03-14T16:01:26.567Z.md

## General Information

### Migration Files

- 1_token.migration.ts

### Networks

- sepolia - Chain ID: 11155111. Explorer: https://sepolia.etherscan.io

## Detailed Migration Files

### 1_token.migration.ts

- https://sepolia.etherscan.io/tx/0xc35dd9e9600f102cf3b414f1341560870021b3824ace4bedbd59e2216bd89a49
- https://sepolia.etherscan.io/tx/0x508a289795cb8e3e1265dfd8f528efc206146a62deba4f9a80a2fa19d6a6ec8e

## Stats

| Total Contracts | Total Transactions | Gas Used | Average Gas Price | Fee Payed                | Native Currency Sent |
| --------------- | ------------------ | -------- | ----------------- | ------------------------ | -------------------- |
| 1               | 1                  | 640068   | 94.301772167 GWei | 0.061426897305814476 ETH | 0.0 ETH              |

Total Cost:

0.061426897305814476 ETH

## All Data

| Name                                          | Address                                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| contracts/mock/tokens/ERC20Mock.sol:ERC20Mock | 0xc596A6e2f1558c7e030272d2A2E37E53050E2D63                         |
| ERC20Mock.mint(address,uint256)(2 arguments)  | 0x508a289795cb8e3e1265dfd8f528efc206146a62deba4f9a80a2fa19d6a6ec8e |
</td>
</tr>
</table>

Reports are saved under `cache/` as `.md` or `.json` depending on `paths.reportFormat`.

## Documentation

- [Deployer API](./docs/Deployer.md) — deployment helpers, proxies, signer management.
- [Reporter API](./docs/Reporter.md) — logging utilities used from migration scripts.
- [Migration Process](./docs/MigrationProcess.md) — lifecycle, namespaces, recovery, verification.
- [External Wallets](./docs/ExternalWallets.md) — Cast and Trezor configuration/CLI overrides.
- [Detailed Example](./docs/DetailedExample.md) — end-to-end walkthrough.

## Known limitations

- Changing Solidity compiler inputs (file layout, artifacts, etc.) between runs can alter bytecode and break verification. 
See [Solidity#9573](https://github.com/ethereum/solidity/issues/9573) for details.
- `factory.attach()` and similar native Ethers helpers bypass the storage that recovery relies on. Always use `deployer.deployed()` 
or persist addresses manually via `deployer.save()`.
