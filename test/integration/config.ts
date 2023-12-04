import { join } from "path";

import { assert, expect } from "chai";

import { HardhatPluginError } from "hardhat/plugins";
import { resetHardhatContext } from "hardhat/plugins-testing";

import { extendConfig } from "hardhat/config";

import { useEnvironment } from "../helpers";

import { migrateConfigExtender } from "../../src/config";

import { resetNetworkManager } from "../../src/tools/network/NetworkManager";

import { MigrateConfig } from "../../src/types/migrations";

describe("config", () => {
  describe("loading", () => {
    useEnvironment("defined-config");

    let loadedOptions: MigrateConfig;

    beforeEach(function () {
      loadedOptions = this.hre.config.migrate;
    });

    it("should apply from", async function () {
      assert.equal(loadedOptions.from, 1);
    });

    it("should apply to", async function () {
      assert.equal(loadedOptions.to, 5);
    });

    it("should apply only", async function () {
      assert.equal(loadedOptions.only, 2);
    });

    it("should apply skip", async function () {
      assert.equal(loadedOptions.skip, 1);
    });

    it("should apply wait", async function () {
      assert.equal(loadedOptions.wait, 2);
    });

    it("should apply verify", async function () {
      assert.isTrue(loadedOptions.verify);
    });

    it("should apply verifyAttempts", async function () {
      assert.equal(loadedOptions.verifyAttempts, 5);
    });

    it("should apply verifyParallel", async function () {
      assert.equal(loadedOptions.verifyParallel, 4);
    });

    it("should apply pathToMigrations", async function () {
      assert.equal(loadedOptions.pathToMigrations, "./deploy/");
    });

    it("should apply force", async function () {
      assert.isTrue(loadedOptions.force);
    });

    it("should apply continue", async function () {
      assert.isTrue(loadedOptions.continue);
    });
  });

  describe("validation", () => {
    const fixtureProjectName = "invalid-config";

    it("should throw if pathToMigrations is not a relevant path", async function () {
      expect(() => {
        const prefix = "hardhat-project-";
        process.chdir(join(__dirname, "../", "fixture-projects", prefix + fixtureProjectName));
        process.env.HARDHAT_NETWORK = "hardhat";

        require("hardhat");
      }).to.throw(HardhatPluginError, "config.migrate.pathToMigrations must be a relative path");

      resetHardhatContext();
      resetNetworkManager();
    });
  });

  describe("extension", () => {
    useEnvironment("undefined-config");

    let loadedOptions: MigrateConfig;

    beforeEach(function () {
      extendConfig(migrateConfigExtender);
      loadedOptions = this.hre.config.migrate;
    });

    it("the migrate field should be present", function () {
      assert.isDefined(loadedOptions);
    });

    it("should set to default from", async function () {
      assert.equal(loadedOptions.from, -1);
    });

    it("should set to default to", async function () {
      assert.equal(loadedOptions.to, -1);
    });

    it("should set to default only", async function () {
      assert.equal(loadedOptions.only, -1);
    });

    it("should set to default skip", async function () {
      assert.equal(loadedOptions.skip, -1);
    });

    it("should set to default wait", async function () {
      assert.equal(loadedOptions.wait, 1);
    });

    it("should set to default verify", async function () {
      assert.equal(loadedOptions.verify, false);
    });

    it("should set to default verifyAttempts", async function () {
      assert.equal(loadedOptions.verifyAttempts, 3);
    });

    it("should set to default verifyParallel", async function () {
      assert.equal(loadedOptions.verifyParallel, 1);
    });

    it("should set to default pathToMigrations", async function () {
      assert.equal(loadedOptions.pathToMigrations, "./deploy");
    });

    it("should set to default force", async function () {
      assert.isFalse(loadedOptions.force);
    });

    it("should set to default continue", async function () {
      assert.isFalse(loadedOptions.continue);
    });
  });
});
