import { ContractDeployTransaction } from "ethers";

export type ContractDeploymentTransactionInterestedValues = Pick<
  ContractDeployTransaction,
  "data" | "from" | "chainId"
>;
