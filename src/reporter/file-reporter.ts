import { readFileSync, writeFileSync } from "fs";
import { DeployContractMessage, Reporter, ReportMessage } from "../types/reporter";

export class FileReporter implements Reporter {
  constructor(private _filePath: string, private _verbose: boolean = false) {}

  public report(message: ReportMessage): void {
    if (this._verbose) {
      console.log(message);
    }

    writeFileSync(this._filePath, JSON.stringify(message), { flag: "a", encoding: "utf-8" });
  }

  public async read(): Promise<ReportMessage> {
    const data = readFileSync(this._filePath, { encoding: "utf-8" });

    return JSON.parse(data) as ReportMessage;
    // read from file
  }
}
