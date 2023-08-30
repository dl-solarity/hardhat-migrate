import { Adapter } from "../../types/adapter";
import { abi } from "../../types/deployer";

export class EthersAdapter implements Adapter {
  public getABI(...args: any): abi {
    throw new Error("Method not implemented.");
  }

  public getByteCode(...args: any): string {
    throw new Error("Method not implemented.");
  }
}
