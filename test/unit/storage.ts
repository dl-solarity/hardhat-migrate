import { expect } from "chai";

import {
  clearAllStorage,
  DefaultStorage,
  UserStorage,
  TransactionStorage,
  ArtifactStorage,
  VerificationStorage,
  MigrateStorage,
} from "../../src/tools/storage/MigrateStorage";

import { useEnvironment } from "../helpers";

describe("Migrator Storage", function () {
  useEnvironment("defined-config");

  it("should save and restore state", function () {
    UserStorage.set("test-key", "test-value");

    expect(UserStorage.get("test-key")).to.equal("test-value");
    expect(UserStorage.has("test-key")).to.be.true;

    UserStorage.delete("test-key");

    expect(UserStorage.get("test-key")).to.be.undefined;
    expect(UserStorage.has("test-key")).to.be.false;
  });

  it("should set state without file", function () {
    const manuallyDefinedStorage = new MigrateStorage(require("hardhat"), "test-storage");

    manuallyDefinedStorage.set("test-key", "test-value");

    expect(manuallyDefinedStorage.get("test-key")).to.equal("test-value");
  });

  it("should throw error if key already exist/not found", function () {
    UserStorage.set("test-key", "test-value");

    expect(() => UserStorage.set("test-key", "test-value")).to.throw("Key already exists");
    expect(() => UserStorage.delete("test-key-2")).to.throw("Key not found");
  });

  it("should get all keys", function () {
    UserStorage.set("test-key", "test-value");
    UserStorage.set("test-key-2", "test-value-2");

    expect(UserStorage.getAll()).to.deep.equal({
      "test-key": "test-value",
      "test-key-2": "test-value-2",
    });
  });

  it("should clear state", function () {
    UserStorage.set("test-key", "test-value");

    UserStorage.clear();

    expect(UserStorage.get("test-key")).to.be.undefined;
  });

  it("should delete state file", function () {
    UserStorage.set("test-key", "test-value");

    expect(DefaultStorage.stateExistsInFile()).to.be.true;

    DefaultStorage.deleteStateFile();

    expect(DefaultStorage.stateExistsInFile()).to.be.false;

    expect(DefaultStorage.deleteStateFile()).to.not.throw;
  });

  it("should manage different storages", function () {
    UserStorage.set("user-key", "user-value");
    ArtifactStorage.set("artifact-key", "artifact-value");
    TransactionStorage.set("transaction-key", "transaction-value");
    VerificationStorage.set("verification-key", "verification-value");

    UserStorage.set("user-key2", "user-value2");

    const fullState = UserStorage.readFullStateFromFile();

    const expectedState = {
      storage: { "user-key": "user-value", "user-key2": "user-value2" },
      artifacts: { "artifact-key": "artifact-value" },
      transactions: { "transaction-key": "transaction-value" },
      verification: { "verification-key": "verification-value" },
    };

    expect(fullState).to.deep.equal(expectedState);
  });

  afterEach("Clean up", function () {
    clearAllStorage();
  });
});
