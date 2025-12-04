import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { assert } from "chai";

import { useEnvironment } from "../../helpers.js";
import { resolvePathToFile } from "../../../src/internal/utils/common.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

describe("ResolvePathToFile()", () => {
  useEnvironment("typechain-ethers");

  it("should correctly resolve paths with and without slash", function () {
    const firstResolvedPath = resolvePathToFile(`${currentDir}/deploy-files/`);

    const secondResolvedPath = resolvePathToFile(`${currentDir}/deploy-files`);

    assert.equal(firstResolvedPath, secondResolvedPath);
  });
});
