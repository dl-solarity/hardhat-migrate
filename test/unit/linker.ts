import { expect } from "chai";

import { Linker } from "../../src/deployer/Linker";

describe("Linker", () => {
  describe("validateBytecode", () => {
    it("should not throw error if bytecode does not contain unresolved libraries", () => {
      expect(Linker.isValidBytecode("0x12345678")).to.be.true;
    });

    it("should throw error if bytecode contains unresolved libraries", () => {
      expect(Linker.isValidBytecode("0x1234__LibraryName__5678")).to.be.false;
    });
  });
});
