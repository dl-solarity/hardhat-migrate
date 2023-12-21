import { expect } from "chai";

import { extendConfig } from "hardhat/config";

import { useEnvironment } from "../../helpers";

import { migrateConfigExtender } from "../../../src/config";

import { MigrateConfig } from "../../../src/types/migrations";

describe("config", () => {
  describe("loading", () => {
    useEnvironment("defined-config");

    let loadedOptions: MigrateConfig;

    beforeEach(function () {
      loadedOptions = this.hre.config.migrate;
    });

    it("should apply user defined config", async function () {
      const userDefinedConfig: MigrateConfig = {
        from: 1,
        to: 3,
        only: 2,
        skip: 4,
        wait: 2,
        verify: true,
        verifyParallel: 12,
        verifyAttempts: 32,
        pathToMigrations: "./path-to-deploy",
        force: true,
        continue: true,
        transactionStatusCheckInterval: 4000,
      };

      expect(loadedOptions).to.deep.equal(userDefinedConfig);
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
      const defaultConfig: MigrateConfig = {
        from: -1,
        to: -1,
        only: -1,
        skip: -1,
        wait: 1,
        verify: false,
        verifyParallel: 1,
        verifyAttempts: 3,
        pathToMigrations: "./deploy",
        force: false,
        continue: false,
        transactionStatusCheckInterval: 2000,
      };

      expect(loadedOptions).to.deep.equal(defaultConfig);
    });
  });
});
