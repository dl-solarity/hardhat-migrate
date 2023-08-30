import { Signer, TransactionRequest } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MigrateError } from "../errors";
import { Adapter } from "../types/adapter";

export class Deployer {
  constructor(private _hre: HardhatRuntimeEnvironment, private _adapter: Adapter) {}

  public async deploy(instance: any, args: any[], value: bigint, from?: string): Promise<string> {
    const abi = this._adapter.getABI(instance);

    const bytecode = this._adapter.getByteCode(instance);

    try {
      const signer: Signer = await this._getSigner(from);

      const tx = await this.createDeployTransaction(abi, bytecode, args, value, signer);

      const hash = this.sendTransaction(tx, signer);

      return hash;
    } catch (e: any) {
      console.log(e);
      throw new MigrateError(e.message);
    }
  }
  protected async createDeployTransaction(
    abi: any[],
    byteCode: string,
    args: any[],
    value: bigint,
    signer: Signer
  ): Promise<TransactionRequest> {
    const factory = new this._hre.ethers.ContractFactory(abi, byteCode, signer);

    const tx = factory.getDeployTransaction(...args, {
      value,
    });

    return tx;
  }

  protected async sendTransaction(tx: TransactionRequest, signer: Signer): Promise<string> {
    const response = await signer.sendTransaction(tx);

    const hash = response.hash;

    return hash;
  }

  private async _getSigner(from?: string): Promise<Signer> {
    return from ? await this._getSigner(from) : (await this._hre.ethers.getSigners())[0];
  }
}
