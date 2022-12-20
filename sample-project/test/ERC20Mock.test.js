const { accounts, wei, toBN } = require("./helpers/utils");
const { assert } = require("chai");

const ERC20Mock = artifacts.require("ERC20Mock");
const TokenBalance = artifacts.require("TokenBalance");

describe("ERC20Mock", () => {
  let OWNER;
  let SECOND;

  let token;

  before(async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);

    const tokenBalance = await TokenBalance.new();
    await ERC20Mock.link(tokenBalance);
  });

  beforeEach("setup", async () => {
    token = await ERC20Mock.new("Mock", "Mock", 18);
  });

  describe("constructor", () => {
    it("should set parameters correctly", async () => {
      assert.equal(await token.name(), "Mock");
      assert.equal(await token.symbol(), "Mock");
      assert.equal(await token.decimals(), 18);
    });
  });

  describe("mint", () => {
    it("should mint correctly", async () => {
      assert.equal(await token.balanceOf(SECOND), "0");

      await token.mint(SECOND, wei("1000"));

      assert.equal(await token.balanceOf(SECOND), wei("1000"));
    });
  });

  describe("burn", () => {
    it("should burn correctly", async () => {
      assert.equal(await token.balanceOf(SECOND), "0");

      await token.mint(SECOND, wei("1000"));
      await token.burn(SECOND, wei("500"));

      assert.equal(await token.balanceOf(SECOND), wei("500"));
    });
  });

  describe("useLib", () => {
    it("should useLib correctly", async () => {
      assert.equal(toBN(await token.useLib(token.address)).toString(), "0");

      await token.mint(token.address, wei("1000"));

      assert.equal(
        toBN(await token.useLib(token.address)).toString(),
        toBN(10).pow(21).toString()
      );
    });
  });
});
