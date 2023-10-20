export interface KeyDeploymentFields {
  data: string;
  from: string;
  chainId: bigint;
}

export interface KeyTransactionFields {
  data: string;
  from: string;
  chainId: bigint;
  to: string;
}

export enum StorageNamespaces {
  Storage = "storage",
  Artifacts = "artifacts",
  Transactions = "transactions",
  Verification = "verification",
}
