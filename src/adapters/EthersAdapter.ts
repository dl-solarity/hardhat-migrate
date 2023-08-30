import { Adapter } from "../types/adapter";

export class EthersAdapter implements Adapter {
  public getABI(...args: any): any[] {
    throw new Error("Method not implemented.");
  }

  public getByteCode(...args: any): string {
    throw new Error("Method not implemented.");
  }
}
