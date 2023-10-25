import { Args } from "./deployer";

export type VerifierArgs = {
  contractAddress: string;
  contractName: string;
  constructorArguments: Args;
  chainId: bigint;
};

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
  explorers: {
    name: string;
    url: string;
    icon?: string;
    standard?: string;
  }[];
}

export const predefinedChains: Record<number, ChainRecord> = {
  1337: {
    name: "Local Ethereum",
    chain: "ETH",
    title: "Local",
    rpc: ["http://127.0.0.1:8545"],
    faucets: [],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    infoURL: "https://ethereum.org",
    shortName: "eth",
    chainId: 1337,
    networkId: 1337,
    ens: {
      registry: "0x0000000000000000000000000000000000000000",
    },
    explorers: [
      {
        name: "Local Explorer",
        url: "",
      },
    ],
  },
  31337: {
    name: "Local Ethereum",
    chain: "ETH",
    title: "Local",
    rpc: ["http://127.0.0.1:8545"],
    faucets: [],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    infoURL: "https://ethereum.org",
    shortName: "eth",
    chainId: 31337,
    networkId: 31337,
    explorers: [
      {
        name: "Local Explorer",
        url: "",
      },
    ],
  },
};
