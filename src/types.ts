export interface DlDeployConfig {
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

export interface DlDeployUserConfig {
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
