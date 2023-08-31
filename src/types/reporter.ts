export type ReportMessage = DeployContractMessage;

export interface DeployContractMessage {
  type: "deployContract";
  contractName: string;
  contractAddress: string;
  constructorArguments: any[];
  transactionHash: string;
  signer: string;
  value: string;
  libraries?: { [libraryName: string]: string };
}
