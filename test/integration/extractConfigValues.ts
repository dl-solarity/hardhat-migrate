import { assert } from "chai";

import { useEnvironment } from "../helpers";

describe("hardhat-migrate configuration extension", function () {
  useEnvironment("hardhat-project-defined-config", "hardhat");

  it("the migrate field should be present", function () {
    assert.isDefined(this.env.config.migrate);
  });

  it("the migrate object should have values from hardhat.env.config.js", function () {
    const { migrate } = this.env.config;

    assert.equal(migrate.from, 1);
    assert.equal(migrate.to, 5);
    assert.equal(migrate.only, 2);
    assert.deepEqual(migrate.skip, [1, 2]);
    assert.equal(migrate.verify, true);
    assert.equal(migrate.verificationAttempts, 2);
    assert.equal(migrate.confirmations, 5);
    assert.equal(migrate.pathToMigrations, "./deploy/");
    assert.deepEqual(migrate.skipVerificationErrors, ["already verified"]);
  });
});

describe("hardhat-migrate configuration defaults in an empty project", function () {
  useEnvironment("hardhat-project-undefined-config", "hardhat");

  it("the migrate field should be present", function () {
    assert.isDefined(this.env.config.migrate);
  });

  it("fields of the migrate object should be set to default", function () {
    assert.equal(this.env.config.migrate.from, -1);
    assert.equal(this.env.config.migrate.to, -1);
    assert.equal(this.env.config.migrate.only, -1);
    assert.deepEqual(this.env.config.migrate.skip, []);
    assert.equal(this.env.config.migrate.verify, false);
    assert.equal(this.env.config.migrate.verificationAttempts, 1);
    assert.equal(this.env.config.migrate.confirmations, 0);
    assert.equal(this.env.config.migrate.pathToMigrations, "./deploy");
    assert.deepEqual(this.env.config.migrate.skipVerificationErrors, ["already verified"]);
  });
});
