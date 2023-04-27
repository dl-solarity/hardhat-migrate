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

export interface ChainRecord {
  name: string;
  chain: string;
  icon: string;
  rpc: string[];
  features: { name: string }[];
  faucets: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  infoURL: string;
  shortName: string;
  chainId: number;
  networkId: number;
  slip44: number;
  ens: {
    registry: string;
  };
  explorers: {
    name: string;
    url: string;
    standard?: string;
  }[];
}
