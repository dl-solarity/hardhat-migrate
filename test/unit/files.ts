import { assert } from "chai";

import { resolvePathToFile } from "../../src/utils";

describe("ResolvePathToFile()", () => {
  it("should correctly resolve paths with and without slash", () => {
    const firstResolvedPath = resolvePathToFile(require("hardhat"), __dirname + "/deploy-files/");

    const secondResolvedPath = resolvePathToFile(require("hardhat"), __dirname + "/deploy-files");

    assert.equal(firstResolvedPath, secondResolvedPath);
  });
});
