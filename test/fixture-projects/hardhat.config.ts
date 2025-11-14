import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatTypechainPlugin from "@nomicfoundation/hardhat-typechain";

import migratePlugin from "../../src/index.js";

import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  migrate: {
    paths: {
      pathToMigrations: "./deploy",
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
  plugins: [migratePlugin, hardhatEthersPlugin, hardhatTypechainPlugin],
};

export default config;
