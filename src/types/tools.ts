import { TransactionReceiptParams } from "ethers";

import { TransactionReceipt } from "./deployer";

export interface BaseTxFields {
  name: string;
  data: string;
  from: string;
  chainId: bigint;
  value: bigint;
}

export interface KeyDeploymentFields extends BaseTxFields {}

export interface KeyTransactionFields extends BaseTxFields {
  to: string;
}

export interface TransactionFieldsToSave {
  txKeyData: KeyTransactionFields;
  receipt: TransactionReceiptParams | TransactionReceipt;
  metadata: MigrationMetadata;
}

export interface ContractFieldsToSave {
  contractKeyData?: KeyDeploymentFields;
  contractAddress: string;
  metadata: MigrationMetadata;
}

export interface MigrationMetadata {
  migrationNumber: number;
  contractName?: string;
  methodName?: string;
}

export interface MigrationStats {
  currentMigration: number;
}

export enum StorageNamespaces {
  Storage = "storage",
  Artifacts = "artifacts",
  Transactions = "transactions",
  Verification = "verification",
}
