import { DeployContractMessage, Reporter, ReportMessage } from "../types/reporter";

export class ConsoleReporter implements Reporter {
  constructor(private _verbose: boolean = false) {}

  public report(message: ReportMessage): void {
    if (this._verbose) {
      console.log(message);
    }
  }

  public async read(): Promise<ReportMessage> {
    throw new Error("Not implemented");
  }
}
