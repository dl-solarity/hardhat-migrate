import { ContractDeployTransaction } from "ethers";

export type KeyTxFields = Pick<
  ContractDeployTransaction,
  "data" | "from" | "chainId"
>;
