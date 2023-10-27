import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";

import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, extendEnvironment, task, types } from "hardhat/config";
import { lazyFunction, lazyObject } from "hardhat/plugins";
import { ActionType, HardhatRuntimeEnvironment } from "hardhat/types";

import "./type-extensions";

import { mergeConfigs, migrateConfigExtender } from "./config";
import { TASK_MIGRATE } from "./constants";

import { Migrator } from "./migrator/Migrator";

import { Reporter } from "./tools/reporters/Reporter";
import { DefaultStorage } from "./tools/storage/MigrateStorage";
import { ArtifactProcessor } from "./tools/storage/ArtifactProcessor";

import { TruffleAdapter } from "./deployer/adapters/TruffleAdapter";
import { MigrateConfig } from "./types/migrations";

export { Deployer } from "./deployer/Deployer";
export { DefaultStorage } from "./tools/storage/MigrateStorage";
export { Verifier } from "./verifier/Verifier";

extendConfig(migrateConfigExtender);

const migrate: ActionType<MigrateConfig> = async (taskArgs, env) => {
  env.config.migrate = mergeConfigs(taskArgs, env.config.migrate);

  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: env.config.migrate.force,
  });

  await ArtifactProcessor.parseArtifacts(env);

  Reporter.init(env);

  overrideTruffleRequire(env);

  await new Migrator(env).migrate();
};

extendEnvironment((hre) => {
  hre.migrator = lazyObject(() => {
    return new Migrator(hre);
  });

  hre.storage = lazyObject(() => DefaultStorage);
});

// TODO: override the `clean` task

task(TASK_MIGRATE, "Deploy contracts via migration files")
  .addOptionalParam("from", "The migration number from which the migration will be applied.", undefined, types.int)
  .addOptionalParam("to", "The migration number up to which the migration will be applied.", undefined, types.int)
  .addOptionalParam(
    "only",
    "The number of the migration that will be applied. Overrides from and to parameters.",
    undefined,
    types.int,
  )
  .addOptionalParam("skip", "The number of migration to skip. Overrides only parameter.", undefined, types.int)
  .addOptionalParam("verify", "The enum defining the verification strategy.", undefined, types.string)
  .addFlag("force", "The flag indicating whether the compilation is forced.")
  .addOptionalParam(
    "confirmations",
    "The number defining after how many blocks the verification should start.",
    undefined,
    types.int,
  )
  .addOptionalParam("attempts", "The number of attempts to verify the contract.", undefined, types.int)
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string,
  )
  .addFlag("continue", "The flag indicating whether the previous deployment should be continued.")
  .setAction(migrate);

const overrideTruffleRequire = (env: HardhatRuntimeEnvironment) => {
  const old = env.artifacts.require;

  env.artifacts.require = lazyFunction(() => {
    return (contractPath: string): any => {
      const res = old(contractPath);

      new TruffleAdapter(env).overrideConnectMethod(res);

      return res;
    };
  });
};
