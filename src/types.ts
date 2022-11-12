export interface DlDeployConfig {
  confirmations: number;
  verify: boolean;
  pathToMigrations: string;
}

export interface DlDeployUserConfig {
  confirmations?: number;
  verify?: boolean;
  pathToMigrations?: string;
}
