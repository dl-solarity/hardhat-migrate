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
   * The number of the migrations that will be applied. Overrides from and to parameters.
   */
  only: number;

  /*
   * The number of migrations to skip. Overrides only parameter.
   */
  skip: number;

  /*
   * The number defining how many confirmations each transaction should have.
   */
  wait: number;

  /*
   * The flag indicating whether the contract should be verified.
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
   * The flag indicating whether the compilation is forced.
   */
  force: boolean;

  /*
   * The flag indicating whether the previous deployment should be continued.
   */
  continue: boolean;
}
