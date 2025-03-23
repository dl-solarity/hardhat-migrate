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
        filter: {
          from: 1,
          to: 3,
          only: 2,
          skip: 4,
        },
        verification: {
          verify: true,
          verificationDelay: 5000,
          verifyParallel: 12,
          verifyAttempts: 32,
        },
        paths: {
          pathToMigrations: "./path-to-deploy",
          namespace: "",
          reportPath: "cache",
        },
        execution: {
          force: true,
          continue: true,
          wait: 2,
          transactionStatusCheckInterval: 4000,
          withoutCLIReporting: false,
        },
        castWallet: {},
        trezorWallet: {
          enabled: false,
          mnemonicIndex: 0,
        },
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
        filter: {
          from: -1,
          to: -1,
          only: -1,
          skip: -1,
        },
        verification: {
          verify: false,
          verificationDelay: 5000,
          verifyParallel: 1,
          verifyAttempts: 3,
        },
        paths: {
          pathToMigrations: "./deploy",
          namespace: "",
          reportPath: "cache",
        },
        execution: {
          force: false,
          continue: false,
          wait: 1,
          transactionStatusCheckInterval: 2000,
          withoutCLIReporting: false,
        },
        castWallet: {},
        trezorWallet: {
          enabled: false,
          mnemonicIndex: 0,
        },
      };

      expect(loadedOptions).to.deep.equal(defaultConfig);
    });
  });
});
