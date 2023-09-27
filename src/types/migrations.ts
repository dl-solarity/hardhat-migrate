/**
 * Configuration options for the migration.
 */
export interface MigrateConfig {
  /*
   * The migration number from which the migration will be applied.
   */
  from: number;

  /*
   * The migration number up to which the migration will be applied.
   */
  to: number;

  /*
   * The number of the migration that will be applied. Overrides from and to parameters.
   */
  only: number;

  /*
   * The number of migration to skip. Overrides only parameter.
   */
  skip: number;

  /*
   * The number defining after how many blocks the verification should start.
   */
  confirmations: number;

  /*
   * The flag indicating whether the verification of the contract is needed.
   */
  verify: boolean;

  /*
   * The number of attempts to verify the contract.
   */
  attempts: number;

  /*
   * The path to the folder with the specified migrations.
   */
  pathToMigrations: string;

  /*
   * The user can specify custom verification errors that will be omitted
   * and just be printed to the log instead of stopping the program completely.
   */
  skipVerificationErrors: string[];

  /*
   * The flag indicating whether the compilation is forced.
   */
  force: boolean;

  /*
   * The flag indicating whether the previous deployment should be continued.
   */
  continuePreviousDeployment: boolean;
}
