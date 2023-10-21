export interface KeyDeploymentFields {
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

export enum StorageNamespaces {
  Storage = "storage",
  Artifacts = "artifacts",
  Transactions = "transactions",
  Verification = "verification",
}
