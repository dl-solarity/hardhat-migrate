import { Args } from "./deployer";

export type VerifierArgs = { contractAddress: string; contractName: string; constructorArguments: Args };
export type VerifierBatchArgs = VerifierArgs & { blockNumber: number };

export interface ChainRecord {
  name: string;
  chain: string;
  title?: string;
  icon?: string;
  rpc: string[];
  features?: { name: string }[];
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
  slip44?: number;
  ens?: {
    registry: string;
  };
  explorers?: {
    name: string;
    url: string;
    icon?: string;
    standard?: string;
  }[];
}

export const predefinedChains: Record<number, ChainRecord> = {
  1337: {
    name: "Geth Testnet",
    title: "Go Ethereum (Geth) Private Testnet",
    chain: "ETH",
    rpc: ["http://127.0.0.1:8545"],
    faucets: [],
    nativeCurrency: {
      name: "Geth Testnet Ether",
      symbol: "ETH",
      decimals: 18,
    },
    infoURL: "https://geth.ethereum.org",
    shortName: "geth",
    chainId: 1337,
    networkId: 1337,
  },
  31337: {
    name: "GoChain Testnet",
    chain: "GO",
    rpc: ["https://testnet-rpc.gochain.io"],
    faucets: [],
    nativeCurrency: {
      name: "GoChain Coin",
      symbol: "GO",
      decimals: 18,
    },
    infoURL: "https://gochain.io",
    shortName: "got",
    chainId: 31337,
    networkId: 31337,
    slip44: 6060,
    explorers: [
      {
        name: "GoChain Testnet Explorer",
        url: "https://testnet-explorer.gochain.io",
        standard: "EIP3091",
      },
    ],
  },
};

export const defaultCurrencySymbol = "ETH";
