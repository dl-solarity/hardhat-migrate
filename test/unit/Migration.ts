import { assert, expect } from "chai";
import { Migrations } from "../../src/deployer/migrations";
import { useEnvironment } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

function getMigrationInstance(
  env: HardhatRuntimeEnvironment,
  from: number = -1,
  to: number = -1,
  only: number = -1,
  skip: number[] = []
): Migrations {
  return new Migrations(env, false, 0, "./deploy", from, to, only, skip, [], 0);
}

function getMigrationInstanceFromConfig(env: HardhatRuntimeEnvironment, migrate: any) {
  return new Migrations(
    env,
    migrate.verify,
    migrate.confirmations,
    migrate.pathToMigrations,
    migrate.from,
    migrate.to,
    migrate.only,
    migrate.skip,
    migrate.skipVerificationErrors,
    migrate.verificationAttempts
  );
}

describe("GetMigrationFiles functionality", () => {
  useEnvironment("hardhat-project-defined-config", "hardhat");

  describe("from/to", () => {
    it("should correctly return specified migrations", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 3, 5, -1, []);
      const migrationFiles = instance.getMigrationFiles();
      assert.equal(migrationFiles.length, 3);
      assert.equal(migrationFiles[0], "3_mock.migration.js");
      assert.equal(migrationFiles[1], "4_mock.migration.js");
      assert.equal(migrationFiles[2], "5_mock.migration.js");
    });
  });

  describe("from/to/only", () => {
    it("should return only one migration", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 3, 5, 4, []);
      const migrationFiles = instance.getMigrationFiles();
      assert.equal(migrationFiles.length, 1);
      assert.equal(migrationFiles[0], "4_mock.migration.js");
    });

    it("should return no migration if only specified out of from/to range", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 3, 5, 1, []);
      expect(() => instance.getMigrationFiles()).to.throw("No migration files were found.");
    });
  });

  describe("from/to/only/skip", () => {
    it("should skip migrations", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 1, 5, -1, [2, 3]);
      const migrationFiles = instance.getMigrationFiles();
      assert.equal(migrationFiles.length, 3);
      assert.equal(migrationFiles[0], "1_mock.migration.js");
      assert.equal(migrationFiles[1], "4_mock.migration.js");
      assert.equal(migrationFiles[2], "5_mock.migration.js");
    });
    it("should skip only migration if there is a collision between them", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 1, 5, 2, [2, 3]);
      const migrationFiles = instance.getMigrationFiles();
      assert.equal(migrationFiles.length, 3);
      assert.equal(migrationFiles[0], "1_mock.migration.js");
      assert.equal(migrationFiles[1], "4_mock.migration.js");
      assert.equal(migrationFiles[2], "5_mock.migration.js");
    });
    it("should return only migration if there is a no collision between them", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 1, 5, 4, [2, 3]);
      const migrationFiles = instance.getMigrationFiles();
      assert.equal(migrationFiles.length, 1);
      assert.equal(migrationFiles[0], "4_mock.migration.js");
    });
    it("should skip all migrations with only parameter specified", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 1, 5, 2, [1, 2, 3, 4, 5]);
      expect(() => instance.getMigrationFiles()).to.throw("No migration files were found.");
    });
    it("should skip all migrations without only parameter specified", () => {
      // @ts-ignore
      const instance = getMigrationInstance(this.env, 1, 5, -1, [1, 2, 3, 4, 5]);
      expect(() => instance.getMigrationFiles()).to.throw("No migration files were found.");
    });
  });
});

describe("ResolvePathToFile functionality", () => {
  useEnvironment("hardhat-project-defined-config", "hardhat");

  it("should correctly resolve paths with and without slash", () => {
    // @ts-ignore
    const instance = getMigrationInstance(this.env, 3, 5, -1, []);
    const firstResolvedPath = instance.resolvePathToFile("./deploy");
    const secondResolvedPath = instance.resolvePathToFile("./deploy/");
    assert.equal(firstResolvedPath, secondResolvedPath);
  });
});

describe("GetParams from defined config", () => {
  useEnvironment("hardhat-project-defined-config", "hardhat");

  it("should correctly get params from defined config", function () {
    // @ts-ignore
    const { migrate } = this.env.config;
    // @ts-ignore
    const instance = getMigrationInstanceFromConfig(this.env, migrate);
    const params = instance.getParams();
    assert.equal(params[0], true);
    assert.equal(params[1], 5);
    assert.equal(params[2], 2);
  });
});

describe("GetParams from undefined config", () => {
  useEnvironment("hardhat-project-undefined-config", "hardhat");

  it("should correctly get params from undefined config", function () {
    // @ts-ignore
    const { migrate } = this.env.config;
    // console.log(migrate);
    // @ts-ignore
    const instance = getMigrationInstanceFromConfig(this.env, migrate);
    const params = instance.getParams();
    assert.equal(params[0], false);
    assert.equal(params[1], 0);
    assert.equal(params[2], 1);
  });
});
