import fs = require("fs");
import path = require("path");

export function resolvePathToFile(path_: string, file_: string = ""): string {
  return path.join(fs.realpathSync(path_), file_);
}
