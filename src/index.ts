import "./type-extensions.js";

import type { HardhatPlugin } from "hardhat/types/plugins";
import { overrideTask } from "hardhat/config";

import migrateTask from "./internal/tasks/migrate/index.js";
import migrateVerifyTask from "./internal/tasks/migrate-verify/index.js";

import { MIGRATE_NPM_PACKAGE, PLUGIN_ID } from "./constants.js";
import { DefaultStorage } from "./internal/tools/storage/MigrateStorage.js";

const hardhatPlugin: HardhatPlugin = {
  id: PLUGIN_ID,
  hookHandlers: {
    config: () => import("./config.js"),
  },
  tasks: [
    migrateTask,
    migrateVerifyTask,
    overrideTask("clean")
      .setAction(async () => ({
        default: async (args, _hre, runSuper) => {
          DefaultStorage.deleteStateFile();

          await runSuper(args);
        },
      }))
      .build(),
  ],
  npmPackage: MIGRATE_NPM_PACKAGE,
} satisfies HardhatPlugin;

export default hardhatPlugin;
