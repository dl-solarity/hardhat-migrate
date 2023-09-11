import { assert } from "chai";
import { Migrator } from "../../src/migrator/migrator";
import { PluginName } from "../../src/types/migrations";

function getMigratorInstance(from: number = -1, to: number = -1, only: number = -1, skip: number = -1): any {
  return new Migrator({
    config: {
      migrate: {
        from: from,
        to: to,
        only: only,
        skip: skip,
        verify: false,
        confirmations: 0,
        skipVerificationErrors: [],
        attempts: 0,
        pathToMigrations: "./deploy-files",
        force: false,
        pluginName: PluginName.ETHERS,
      },
    },
    network: {
      provider: {},
    },
  } as any);
}

describe("Migrator", function () {
  describe("getMigrationFiles()", function () {
    before("Loading chdir", function () {
      process.chdir(__dirname);
    });

    describe("from/to", function () {
      it("should correctly return specified migrations", function () {
        const instance = getMigratorInstance(3, 5, -1, -1);
        const migrationFiles = instance._migrationFiles;

        const expectedFiles = ["3_mock.migration.ts", "4_mock.migration.ts", "5_mock.migration.ts"];

        assert.deepStrictEqual(migrationFiles, expectedFiles);
      });
    });

    describe("from/to/only", () => {
      it("should return only one migration", () => {
        const instance = getMigratorInstance(3, 5, 4, -1);
        const migrationFiles = instance._migrationFiles;

        assert.deepStrictEqual(migrationFiles, ["4_mock.migration.ts"]);
      });

      it("should return no migration if only specified out of from/to range", () => {
        assert.throw(() => getMigratorInstance(3, 5, 1, -1), "No migration files were found.");
      });
    });

    describe("from/to/only/skip", () => {
      it("should skip migrations", () => {
        const instance = getMigratorInstance(-1, 5, -1, 2);
        const migrationFiles = instance._migrationFiles;

        const expectedFiles = [
          "1_mock.migration.ts",
          "3_mock.migration.ts",
          "4_mock.migration.ts",
          "5_mock.migration.ts",
        ];

        assert.deepStrictEqual(migrationFiles, expectedFiles);
      });

      it("should return only migration if there is a no collision between them", () => {
        const instance = getMigratorInstance(3, 4, 4, 3);
        const migrationFiles = instance._migrationFiles;

        assert.deepStrictEqual(migrationFiles, ["4_mock.migration.ts"]);
      });

      it("should skip all migrations with only parameter specified", () => {
        assert.throw(() => getMigratorInstance(1, 5, 2, 2), "No migration files were found.");
      });

      it("should skip all migrations without only parameter specified", () => {
        assert.throw(() => getMigratorInstance(3, 3, -1, 3), "No migration files were found.");
      });
    });
  });

  describe("migrate()", () => {
    before("Loading chdir", function () {
      process.chdir(__dirname);
    });
  });
});
