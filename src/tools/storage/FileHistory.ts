import { statSync } from "fs";
import { basename } from "path";

export class FileHistory {
  private fileName = ".file_storage.json";

  public createMigrationFilesStamps(_migrationFiles: string[]) {
    const migrationFilesStamps = _migrationFiles.map((element) => {
      const stats = statSync(element);

      return {
        name: basename(element),
        time: stats.mtimeMs,
        hash: stats.ino,
      };
    });

    return migrationFilesStamps;
  }
}
