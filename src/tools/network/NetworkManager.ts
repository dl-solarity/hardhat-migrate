import axios, { Axios } from "axios";
import { AddressLike, ethers } from "ethers";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { HardhatEthersProvider as HardhatEthersProviderT } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { createEthersProvider, ethersProvider } from "./EthersProvider";

import { toJSON } from "../../utils";
import { createTransactionRunner } from "../runners/TransactionRunner";

class StateMiddleware {
  private static pendingRequests: Record<string, any> = {};

  public static async retry<T extends (...args: any[]) => any>(
    fn: T,
    args: Parameters<T>,
  ): Promise<Awaited<ReturnType<T>>> {
    const cacheKey = ethers.id(`${fn.name}:${toJSON(args)}`);

    if (this.pendingRequests[cacheKey]) {
      return this.pendingRequests[cacheKey];
    }

    const workPromise = fn(...args);
    this.pendingRequests[cacheKey] = workPromise;

    try {
      return await workPromise;
    } finally {
      delete this.pendingRequests[cacheKey];
    }
  }
}

class NetworkManager {
  public axios: Axios;
  public provider: HardhatEthersProviderT;

  private currentFrom: string | undefined = undefined;

  constructor() {
    this.axios = this.withRetry(axios);
    this.provider = this.withRetry(ethersProvider!);
  }

  public async getSigner(from?: null | AddressLike): Promise<HardhatEthersSigner> {
    if (!from) {
      return this.provider.getSigner(this.currentFrom);
    }

    const address = await ethers.resolveAddress(from, this.provider);

    return this.provider.getSigner(address);
  }

  public async setSigner(from?: AddressLike): Promise<void> {
    this.currentFrom = from ? await ethers.resolveAddress(from, this.provider) : undefined;
  }

  public withRetry<T extends { [key: string]: any }>(instance: T): T {
    return new Proxy(instance, {
      get(target, propKey, receiver) {
        const origMethod = target[propKey as keyof T];

        if (typeof origMethod === "function") {
          return (...args: any[]) => {
            return StateMiddleware.retry(origMethod.bind(target), args);
          };
        }

        return Reflect.get(target, propKey, receiver);
      },
    });
  }
}

export let networkManager: NetworkManager | null = null;

export function buildNetworkDeps(hre: HardhatRuntimeEnvironment) {
  createEthersProvider(hre);
  createTransactionRunner(hre);

  if (networkManager) {
    return;
  }

  networkManager = new NetworkManager();
}

/**
 * Used only in test environments to ensure test atomicity
 */
export function resetNetworkManager() {
  networkManager = null;
}
