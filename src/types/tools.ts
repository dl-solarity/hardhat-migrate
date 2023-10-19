import { ContractDeployTransaction } from "ethers/lib.esm";

export type KeyTxFields = Pick<ContractDeployTransaction, "data" | "from" | "chainId"> & { instanceName?: string };

export enum StorageNamespaces {
  Storage = "storage",
  Artifacts = "artifacts",
  Transactions = "transactions",
  Verification = "verification",
}
