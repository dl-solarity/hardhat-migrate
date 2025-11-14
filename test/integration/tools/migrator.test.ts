import { assert } from "chai";

import { useEnvironment } from "../../helpers.js";
import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { Migrator } from "../../../src/internal/migrator/Migrator.js";

function getMigratorInstance(
  hre: HardhatRuntimeEnvironment,
  from: number = -1,
  to: number = -1,
  only: number = -1,
  skip: number = -1,
): any {
  return new Migrator({
    ...hre,
    config: {
      ...hre.config,
      migrate: {
        filter: {
          from: from,
          to: to,
          only: only,
          skip: skip,
        },
        verification: {
          verify: false,
          verificationDelay: 0,
          verifyParallel: 0,
          verifyAttempts: 0,
        },
        paths: {
          pathToMigrations: "./deploy-files",
          namespace: "",
          reportPath: "cache",
          reportFormat: "md",
        },
        execution: {
          force: false,
          continue: false,
          wait: 0,
          transactionStatusCheckInterval: 0,
          withoutCLIReporting: false,
        },
        castWallet: {},
        trezorWallet: {
          enabled: false,
          mnemonicIndex: 0,
        },
      },
    },
  });
}

describe("Migrator", function () {
  describe("getMigrationFiles()", function () {
    describe("from/to", function () {
      useEnvironment("mock-files");

      it("should correctly return specified migrations", function () {
        const instance = getMigratorInstance(this.hre, 3, 5, -1, -1);
        const migrationFiles = instance._migrationFiles;

        const expectedFiles = ["3_mock.migration.ts", "4_mock.migration.ts", "5_mock.migration.ts"];

        assert.deepStrictEqual(migrationFiles, expectedFiles);
      });
    });

    describe("from/to/only", function () {
      useEnvironment("mock-files");

      it("should return only one migration", function () {
        const instance = getMigratorInstance(this.hre, 3, 5, 4, -1);
        const migrationFiles = instance._migrationFiles;

        assert.deepStrictEqual(migrationFiles, ["4_mock.migration.ts"]);
      });

      it("should return no migration if only specified out of from/to range", function () {
        const hre = this.hre;
        assert.throw(() => getMigratorInstance(hre, 3, 5, 1, -1), "No migration files were found.");
      });
    });

    describe("from/to/only/skip", function () {
      useEnvironment("mock-files");

      it("should skip migrations", function () {
        const instance = getMigratorInstance(this.hre, -1, 5, -1, 2);
        const migrationFiles = instance._migrationFiles;

        const expectedFiles = [
          "1_mock.migration.ts",
          "3_mock.migration.ts",
          "4_mock.migration.ts",
          "5_mock.migration.ts",
        ];

        assert.deepStrictEqual(migrationFiles, expectedFiles);
      });

      it("should return only migration if there is a no collision between them", function () {
        const instance = getMigratorInstance(this.hre, 3, 4, 4, 3);
        const migrationFiles = instance._migrationFiles;

        assert.deepStrictEqual(migrationFiles, ["4_mock.migration.ts"]);
      });

      it("should skip all migrations with only parameter specified", function () {
        const hre = this.hre;
        assert.throw(() => getMigratorInstance(hre, 1, 5, 2, 2), "No migration files were found.");
      });

      it("should skip all migrations without only parameter specified", function () {
        const hre = this.hre;
        assert.throw(() => getMigratorInstance(hre, 3, 3, -1, 3), "No migration files were found.");
      });
    });
  });
});
