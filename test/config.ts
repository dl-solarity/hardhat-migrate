import { assert, expect } from "chai";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { resetHardhatContext } from "hardhat/plugins-testing";

import path from "path";
import { MigrateConfig } from "../src/types/migrations";
import { useEnvironment } from "./helpers";

describe("config", () => {
  it("should be true", () => {});
});
describe("config", () => {
  describe("loading", () => {
    useEnvironment("defined-config");

    let loadedOptions: MigrateConfig;

    beforeEach(function () {
      loadedOptions = this.env.config.migrate;
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

    it("should apply verify", async function () {
      assert.isTrue(loadedOptions.verify);
    });

    it("should apply attempts", async function () {
      assert.equal(loadedOptions.attempts, 2);
    });

    it("should apply confirmations", async function () {
      assert.equal(loadedOptions.confirmations, 5);
    });

    it("should apply pathToMigrations", async function () {
      assert.equal(loadedOptions.pathToMigrations, "./deploy/");
    });

    it("should apply skipVerificationErrors", async function () {
      assert.deepEqual(loadedOptions.skipVerificationErrors, ["already verified"]);
    });
  });

  describe("validation", () => {
    const fixtureProjectName = "invalid-config";

    it("should throw if pathToMigrations is not a relevant path", async function () {
      expect(() => {
        const prefix = "hardhat-project-";
        process.chdir(path.join(__dirname, "fixture-projects", prefix + fixtureProjectName));
        process.env.HARDHAT_NETWORK = "hardhat";

        require("hardhat");
      }).to.throw(NomicLabsHardhatPluginError, "config.migrate.pathToMigrations must be a relative path");

      resetHardhatContext();
    });
  });

  describe("extension", () => {
    useEnvironment("undefined-config");

    let loadedOptions: MigrateConfig;

    beforeEach(function () {
      loadedOptions = this.env.config.migrate;
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

    it("should set to default verify", async function () {
      assert.isFalse(loadedOptions.verify);
    });

    it("should set to default attempts", async function () {
      assert.equal(loadedOptions.attempts, 0);
    });

    it("should set to default confirmations", async function () {
      assert.equal(loadedOptions.confirmations, 0);
    });

    it("should set to default pathToMigrations", async function () {
      assert.equal(loadedOptions.pathToMigrations, "./deploy");
    });

    it("should set to default skipVerificationErrors", async function () {
      assert.deepEqual(loadedOptions.skipVerificationErrors, ["already verified"]);
    });
  });
});
