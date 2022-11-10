import { ConfigExtender } from "hardhat/types";

export const etherscanConfigExtender: ConfigExtender = (
    resolvedConfig,
    config
) => {
    const defaultConfig = {
        confirmations: 1,
        verify: true,
        pathToMigrations: "./migrations"
    };

    if (config.deploy !== undefined) {
        const { cloneDeep } = require("lodash");
        const customConfig = cloneDeep(config.deploy);

        resolvedConfig.deploy = { ...defaultConfig, ...customConfig };
    } else {
        resolvedConfig.deploy = defaultConfig;
    }
};
