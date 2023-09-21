import { ContractDeployTransaction } from "ethers";

// TODO: Too long. Maybe just KeyTxFields?
export type ContractDeploymentTransactionInterestedValues = Pick<
  ContractDeployTransaction,
  "data" | "from" | "chainId"
>;
