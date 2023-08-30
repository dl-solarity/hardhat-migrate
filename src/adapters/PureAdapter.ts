import { Adapter } from "../types/adapter";

export class PureAdapter implements Adapter {
  public getABI(obj: { abi: any[] }): any[] {
    return obj.abi;
  }

  public getByteCode(obj: { bytecode: string }): string {
    return obj.bytecode;
  }
}
