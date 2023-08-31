import { ReportMessage } from "../types/reporter";

export class ConsoleReporter {
  constructor(private _verbose: boolean = false) {}

  public report(message: ReportMessage): void {
    if (this._verbose) {
      console.log(message);
    }
  }
}
