export interface DlDeployConfig {
  from: number;
  to: number;
  only: number;
  confirmations: number;
  verify: boolean;
  pathToMigrations: string;
  excludedErrors: string[];
}

export interface DlDeployUserConfig {
  from?: number;
  to?: number;
  only?: number;
  confirmations?: number;
  verify?: boolean;
  pathToMigrations?: string;
  excludedErrors?: string[];
}
