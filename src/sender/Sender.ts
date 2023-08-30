export class Sender {
  constructor() {}

  public send<T>(foo: () => Promise<T>): Promise<T> {
    return foo();
  }
}
