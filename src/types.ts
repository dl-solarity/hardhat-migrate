export interface DlDeployConfig {
  from: number;
  to: number;
  only: number;
  confirmations: number;
  verify: boolean;
  pathToMigrations: string;
}

export interface DlDeployUserConfig {
  from?: number;
  to?: number;
  only?: number;
  confirmations?: number;
  verify?: boolean;
  pathToMigrations?: string;
}
