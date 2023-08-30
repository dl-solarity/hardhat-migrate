import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";
import { Adapter } from "../types/adapter";

export class TruffleAdapter implements Adapter {
  public getABI(instance: TruffleContract): any[] {
    return instance.abi;
  }

  public getByteCode(instance: TruffleContract): string {
    return instance.bytecode;
  }
}
