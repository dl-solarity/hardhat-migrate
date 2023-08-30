import { abi } from "./deployer";

export interface Adapter {
  getABI(...args: any): abi;
  getByteCode(...args: any): string;
}
