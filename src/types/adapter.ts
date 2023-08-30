export interface Adapter {
  getABI(...args: any): any[];
  getByteCode(...args: any): string;
}
