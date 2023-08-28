import fs = require("fs");
import path = require("path");

export function resolvePathToFile(path_: string, file_: string = ""): string {
  return path.normalize(fs.realpathSync(path_) + "/" + file_);
}
