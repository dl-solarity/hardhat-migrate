// Required plugins to write migrations and tests
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");
require("../dist/src");

module.exports = {
  networks: {
    hardhat: {
      initialDate: "1970-01-01T00:00:00Z",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      initialDate: "1970-01-01T00:00:00Z",
      gasMultiplier: 1.2,
    },
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  migrate: {
    pathToMigrations: "./deploy/",
  },
};
