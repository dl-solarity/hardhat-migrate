export class Sender {
  constructor() {}

  public async send<T>(foo: () => Promise<T>): Promise<TransactionReceipt> {
    const receipt = (await foo()) as unknown as TransactionReceipt;

    // pass receipt to reporter
    // save in storage

    return receipt;
  }

  public track(receipt: any): void {
    // pass receipt to reporter
    // save in storage
  }
}
