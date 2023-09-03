import {
  BaseContract,
  ContractFactory,
  ContractTransactionResponse,
  getCreateAddress,
  Signer,
  TransactionRequest,
  TransactionResponse,
} from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MigrateError } from "../errors";
import { Reporter } from "../tools/Reporter";
import { Adapter } from "../types/adapter";
import { args, deployFactoryParams } from "../types/deployer";

export class Deployer {
  constructor(private _hre: HardhatRuntimeEnvironment, private _adapter: Adapter, private _reporter: Reporter) {}

  public async deploy(instance: any, args: args, value: bigint, from?: string): Promise<string> {
    const abi = this._adapter.getABI(instance);

    const bytecode = this._adapter.getByteCode(instance);

    try {
      const signer: Signer = await this._getSigner(from);

      const tx = await this.createDeployTransaction(args, value, abi, bytecode, signer);

      const sentTx = await signer.sendTransaction(tx);

      await this._reportContractDeploy(sentTx);

      const address = getCreateAddress(sentTx);

      const contract: BaseContract = new (<any>BaseContract)(address, abi, signer, sentTx);

      await contract.waitForDeployment();

      return this._adapter.toInstance(contract);
    } catch (e: any) {
      console.log(e);
      throw new MigrateError(e.message);
    }
  }

  protected async _reportContractDeploy(tx: TransactionResponse): Promise<void> {
    Reporter.reportDeploy(tx);

    // TODO: save to storage
  }

  protected async createDeployTransaction(
    args: args,
    value: bigint,
    ...contractParams: deployFactoryParams
  ): Promise<TransactionRequest> {
    const factory = new this._hre.ethers.ContractFactory(...contractParams);

    const tx = factory.getDeployTransaction(...args, {
      value,
    });

    return tx;
  }

  private async _getSigner(from?: string): Promise<Signer> {
    return from ? await this._getSigner(from) : (await this._hre.ethers.getSigners())[0];
  }
}
