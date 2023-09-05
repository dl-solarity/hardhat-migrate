import { assert } from "chai";
import { Storage } from "../../src/tools/Storage";
import { resolvePathToFile } from "../../src/utils";

describe("Storage", () => {
  let path: string;

  let storage: Storage;

  before(() => {
    process.chdir(__dirname);

    path = resolvePathToFile(__dirname, "storage");
  });

  beforeEach(() => {
    storage = Storage.getInstance();
    storage.clear();
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

  describe("get()/set()", () => {
    it("should correctly set and get a value", () => {
      storage.set("test", "test");
      assert.strictEqual(storage.get("test"), "test");
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
