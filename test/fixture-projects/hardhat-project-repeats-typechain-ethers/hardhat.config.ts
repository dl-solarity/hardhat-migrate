import "@typechain/hardhat";

import config from "../hardhat.config";

const defaultConfig = {
  ...config,
  typechain: {
    outDir: `typechain-types`,
    target: "ethers-v6",
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
  },
};

export default defaultConfig;
