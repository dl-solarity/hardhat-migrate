import { Contract } from "typechain";
import { MigrateError } from "../errors";
import { Adapter } from "../types/adapter";

export class TypeChainAdapter implements Adapter {
  public getABI(instance: Contract): any[] {
    throw new MigrateError("Method not implemented.");
  }

  public getByteCode(instance: Contract): string {
    throw new MigrateError("Method not implemented.");
  }
}
