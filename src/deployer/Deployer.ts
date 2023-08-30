import { Signer, TransactionRequest } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MigrateError } from "../errors";

export class Deployer {
  constructor(private _hre: HardhatRuntimeEnvironment) {}

  public async deploy(abi: any[], byteCode: string, args: any[], value: bigint, from: string): Promise<string> {
    try {
      const tx = await this.createDeployTransaction(abi, byteCode, args, value, from);

      const hash = this.sendTransaction(tx, from);

      return hash;
    } catch (e: any) {
      console.log(e);
      throw new MigrateError(e.message);
    }
  }

  // public async link(libraryName: string, address: string): Promise<void> {
  //   try {
  //     const signer: Signer = await this._getSigner(address);

  //     const factory = new ContractFactory([], "", signer);

  //     factory.attach(address);

  //     factory.link(libraryName, address);
  //   } catch (e: any) {
  //     console.log(e);
  //     throw new MigrateError(e.message);
  //   }
  // }

  public async createDeployTransaction(
    abi: any[],
    byteCode: string,
    args: any[],
    value: bigint,
    from: string
  ): Promise<TransactionRequest> {
    const signer: Signer = await this._getSigner(from);

    const factory = new this._hre.ethers.ContractFactory(abi, byteCode, signer);

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
    const signer: Signer = await this._hre.ethers.getSigner(from);

    return signer;
  }
}
