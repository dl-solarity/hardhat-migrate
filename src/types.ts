export interface DlDeployConfig {
  from: number;
  to: number;
  only: number;
  confirmations: number;
  verify: boolean;
  verificationAttempts: number;
  pathToMigrations: string;
  skipVerificationErrors: string[];
}

export interface DlDeployUserConfig {
  from?: number;
  to?: number;
  only?: number;
  confirmations?: number;
  verify?: boolean;
  verificationAttempts: number;
  pathToMigrations?: string;
  skipVerificationErrors?: string[];
}
