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
   * The size of the batch for verification.
   */
  verifyParallel: number;

  /*
   * The number of attempts to verify the contract.
   */
  verifyAttempts: number;

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

  /*
   * The interval in milliseconds between transaction status checks.
   */
  transactionStatusCheckInterval: number;

  /*
   * The maximum number of attempts to retry operation.
   */
  maxRetryAttempts: number;

  /*
   * The interval in milliseconds between attempts to retry operation.
   */
  retryGapMs: number;
}

export interface VerifyConfig {
  /*
   * The size of the batch for verification.
   */
  parallel: number;

  /*
   * The number of attempts to verify the contract.
   */
  attempts: number;
}

export interface MigrateVerifyConfig extends VerifyConfig {
  /*
   * The path to the file with the verification input.
   */
  inputFile: string | undefined;
}
