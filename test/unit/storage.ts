import { assert } from "chai";
import { Storage } from "../../src/tools/Storage";
import { resolvePathToFile } from "../../src/utils";

describe("Storage", () => {
  const path = resolvePathToFile(__dirname, "storage");
  let storage: Storage;

  before(() => {
    storage = Storage.getInstance();

    process.chdir(__dirname);
  });

  beforeEach(() => {
    storage.clear();
  });

  describe("get()/set()", () => {
    it("should correctly set and get a value", () => {
      storage.set("test", "test");
      assert.strictEqual(storage.get("test"), "test");
    });
  });

  describe("saveToDisk()/loadFromDisk()", () => {
    it("should correctly save a storage file", () => {
      storage.loadFromDisk(path);
      assert.strictEqual(storage.get("test"), "test");

      storage.set("test", "test2");
      storage.saveToDisk();
      storage.clear();

      storage.loadFromDisk(path);
      assert.strictEqual(storage.get("test"), "test2");

      storage.set("test", "test");
      storage.saveToDisk();
    });
  });

  describe("delete()", () => {
    it("should correctly delete a value", () => {
      storage.set("test", "test");
      storage.delete("test");
      assert.strictEqual(storage.get("test"), undefined);
    });
  });

  describe("has()", () => {
    it("should correctly check if a value exists", () => {
      assert.strictEqual(storage.has("test"), false);
      storage.set("test", "test");
      assert.strictEqual(storage.has("test"), true);
    });
  });

  describe("clear()", () => {
    it("should correctly clear all values", () => {
      storage.set("test", "test");
      storage.clear();
      assert.strictEqual(storage.get("test"), undefined);
    });
  });
});
