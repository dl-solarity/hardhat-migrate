import { TransactionReceiptParams } from "ethers";

export interface KeyDeploymentFields {
  name: string;
  data: string;
  from: string;
  chainId: bigint;
  value: bigint;
}

export interface KeyTransactionFields {
  data: string;
  from: string;
  chainId: bigint;
  to: string;
  value: bigint;
}

export interface TransactionFieldsToSave {
  txKeyData: KeyTransactionFields;
  receipt: TransactionReceiptParams;
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

export const UNKNOWN_CONTRACT_NAME = "Unknown Contract";
