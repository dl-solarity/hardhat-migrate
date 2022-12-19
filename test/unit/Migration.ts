import { assert } from "chai";
import { Migrations } from "../../src/deployer/migrations";

function getMigrationInstance(from: number = -1, to: number = -1, only: number = -1, skip: number = -1): Migrations {
  // @ts-ignore
  return new Migrations(undefined,  from, to, only, skip,false, 0,  [], 0, "./deploy");
}

describe("GetMigrationFiles functionality", function () {
  before("Loading chdir", function () {
    process.chdir(__dirname);
  });

  describe("from/to", function () {
    it("should correctly return specified migrations", function () {
      const instance = getMigrationInstance(3, 5, -1, -1);
      const migrationFiles = instance.getMigrationFiles();

      assert.equal(migrationFiles.length, 3);
      assert.equal(migrationFiles[0], "3_mock.migration.js");
      assert.equal(migrationFiles[1], "4_mock.migration.js");
      assert.equal(migrationFiles[2], "5_mock.migration.js");
    });
  });

  describe("from/to/only", () => {
    it("should return only one migration", () => {
      const instance = getMigrationInstance(3, 5, 4, -1);
      const migrationFiles = instance.getMigrationFiles();

      assert.equal(migrationFiles.length, 1);
      assert.equal(migrationFiles[0], "4_mock.migration.js");
    });

    it("should return no migration if only specified out of from/to range", () => {
      const instance = getMigrationInstance(3, 5, 1, -1);

      assert.throw(() => instance.getMigrationFiles(), "No migration files were found.");
    });
  });

  describe("from/to/only/skip", () => {
    it("should skip migrations", () => {
      const instance = getMigrationInstance(-1, 5, -1, 2);
      const migrationFiles = instance.getMigrationFiles();

      assert.equal(migrationFiles.length, 4);
      assert.equal(migrationFiles[0], "1_mock.migration.js");
      assert.equal(migrationFiles[1], "3_mock.migration.js");
      assert.equal(migrationFiles[2], "4_mock.migration.js");
      assert.equal(migrationFiles[3], "5_mock.migration.js");
    });

    it("should return only migration if there is a no collision between them", () => {
      const instance = getMigrationInstance(3, 4, 4, 3);
      const migrationFiles = instance.getMigrationFiles();

      assert.equal(migrationFiles.length, 1);
      assert.equal(migrationFiles[0], "4_mock.migration.js");
    });

    it("should skip all migrations with only parameter specified", () => {
      const instance = getMigrationInstance(1, 5, 2, 2);

      assert.throw(() => instance.getMigrationFiles(), "No migration files were found.");
    });

    it("should skip all migrations without only parameter specified", () => {
      const instance = getMigrationInstance(3, 3, -1, 3);

      assert.throw(() => instance.getMigrationFiles(), "No migration files were found.");
    });
  });
});

describe("ResolvePathToFile functionality", () => {
  it("should correctly resolve paths with and without slash", () => {
    const instance = getMigrationInstance(3, 5, -1, -1);
    const firstResolvedPath = instance.resolvePathToFile(__dirname + "/deploy/");
    const secondResolvedPath = instance.resolvePathToFile(__dirname + "/deploy");

    assert.equal(firstResolvedPath, secondResolvedPath);
  });
});
