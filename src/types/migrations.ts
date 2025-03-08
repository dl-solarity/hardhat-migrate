// Grouped configuration interfaces
export interface MigrationFilterConfig {
  /** The migration number from which the migration will be applied */
  from: number;
  /** The migration number up to which the migration will be applied */
  to: number;
  /** The number of the migrations that will be applied. Overrides from and to parameters */
  only: number;
  /** The number of migrations to skip. Overrides only parameter */
  skip: number;
}

export interface VerificationConfig {
  /** The flag indicating whether the contract should be verified */
  verify: boolean;
  /** The time in milliseconds to wait before the verification process starts */
  verificationDelay: number;
  /** The size of the batch for verification */
  verifyParallel: number;
  /** The number of attempts to verify the contract */
  verifyAttempts: number;
}

export interface PathConfig {
  /** The path to the folder with the specified migrations */
  pathToMigrations: string;
  /**
   * The path to the folder where the migration should be done.
   * This parameter is used together with the `pathToMigrations` parameter.
   * If the following parameter specified, the migrations will be retrieved from following path:
   * `{hardhat.config.path.root}/{pathToMigrations}/{namespace}`
   */
  namespace: string;
}

export interface ExecutionConfig {
  /** The flag indicating whether the compilation is forced */
  force: boolean;
  /** The flag indicating whether the previous deployment should be continued */
  continue: boolean;
  /** The number defining how many confirmations each transaction should have */
  wait: number;
  /** The interval in milliseconds between transaction status checks */
  transactionStatusCheckInterval: number;
  /** The flag indicating whether the CLI reporting should be disabled */
  withoutCLIReporting: boolean;
}

export interface CastWalletConfig {
  /** Flag indicating whether the cast wallet should be used */
  enabled: boolean;
  /** File path to the keystore password */
  passwordFile?: string;
  /** Use a keystore file or directory */
  keystore?: string;
  /** The mnemonic index (default 0) */
  mnemonicIndex?: number;
  /** The account name (when using the default keystore directory) */
  account?: string;
  /** Open an interactive prompt to enter your private key */
  interactive?: boolean;
}

export interface TrezorWalletConfig {
  /** Specifies that the trezor wallet should be used */
  enabled: boolean;
  /** The mnemonic index */
  mnemonicIndex: number;
}

export interface MigrateConfig {
  filter: MigrationFilterConfig;
  verification: VerificationConfig;
  paths: PathConfig;
  execution: ExecutionConfig;
  castWallet: CastWalletConfig;
  trezorWallet: TrezorWalletConfig;
}

export interface VerifyConfig {
  /** The size of the batch for verification */
  parallel: number;
  /** The number of attempts to verify the contract */
  attempts: number;
}

export interface MigrateVerifyConfig extends VerifyConfig {
  /** The path to the file with the verification input */
  inputFile: string | undefined;
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
