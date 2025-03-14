import { assert } from "chai";

import { useEnvironment } from "../../helpers";
import { resolvePathToFile } from "../../../src/utils";

describe("ResolvePathToFile()", () => {
  useEnvironment("typechain-ethers");

  it("should correctly resolve paths with and without slash", () => {
    const firstResolvedPath = resolvePathToFile(require("hardhat"), __dirname + "/deploy-files/");

    const secondResolvedPath = resolvePathToFile(require("hardhat"), __dirname + "/deploy-files");

    assert.equal(firstResolvedPath, secondResolvedPath);
  });
});
