export interface MigrateConfig {
  from: number;
  to: number;
  only: number;
  skip: number;
  confirmations: number;
  verify: boolean;
  attempts: number;
  pathToMigrations: string;
  skipVerificationErrors: string[];
}

export interface MigrateUserConfig {
  from?: number;
  to?: number;
  only?: number;
  skip?: number;
  confirmations?: number;
  verify?: boolean;
  attempts?: number;
  pathToMigrations?: string;
  skipVerificationErrors?: string[];
}
