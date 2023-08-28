import { BrowserProvider, ContractFactory, Signer, TransactionRequest } from "ethers";
import { EthereumProvider } from "hardhat/types";

export class Deployer {
  private _ethersProvider: BrowserProvider;

  constructor(private _provider: EthereumProvider) {
    this._ethersProvider = new BrowserProvider(this._provider);
  }

  // @dev contractByteCode is more specifically the initcode
  public async deploy(contractAbi: any[], contractByteCode: string, deployArgs: any[]) {
    console.log("Deploying...");

    const factory = new ContractFactory(contractAbi, contractByteCode);

    const contract = await factory.deploy(deployArgs);

    return contract;
  }

  public async createDeployTransaction(
    abi: any[],
    byteCode: string,
    args: any[],
    value: bigint,
    from: string
  ): Promise<TransactionRequest> {
    const signer: Signer = await this._getSigner(from);

    const factory = new ContractFactory(abi, byteCode, signer);

    const tx = factory.getDeployTransaction(...args, {
      value,
    });

    return tx;
  }

  public async sendTransaction(tx: TransactionRequest, from: string): Promise<string> {
    const signer: Signer = await this._getSigner(from);

    const response = await signer.sendTransaction(tx);

    const hash = response.hash;

    return hash;
  }

  private async _getSigner(from: string): Promise<Signer> {
    const signer: Signer = await this._ethersProvider.getSigner(from);

    return signer;
  }
}
