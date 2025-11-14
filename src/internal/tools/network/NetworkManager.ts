import axios, { Axios } from "axios";
import { AddressLike, ethers } from "ethers";

import type { HardhatEthers, HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";

import { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { ExtendedHardhatEthersSigner } from "./ExtendedHardhatEthersSigner.js";

import { createEthersProvider, ethersProvider } from "./EthersProvider.js";

import { toJSON } from "../../utils/index.js";
import { createTransactionRunner } from "../runners/TransactionRunner.js";
import { HardhatPluginError } from "hardhat/plugins";
import { PLUGIN_ID } from "../../../constants.js";

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
  public provider: HardhatEthers;

  private _currentFrom: string | undefined = undefined;

  private _signers: Record<string, ExtendedHardhatEthersSigner> = {};

  constructor() {
    this.axios = this.withRetry(axios);
    this.provider = this.withRetry(ethersProvider!);
  }

  public getProvider(): HardhatEthers {
    return this.provider;
  }

  public async getEthersSigner(from?: null | AddressLike): Promise<HardhatEthersSigner> {
    if (!from) {
      if (!this._currentFrom) throw new HardhatPluginError(PLUGIN_ID, "Expected _currentFrom to be defined.");

      return this.provider.getSigner(this._currentFrom);
    }

    const address = await ethers.resolveAddress(from);
    return this.provider.getSigner(address);
  }

  async getSigner(from?: null | AddressLike): Promise<ExtendedHardhatEthersSigner> {
    if (from && this._signers[from as string]) {
      return this._signers[from as string];
    }

    const signer = await this._getSigner(from);

    this._signers[await signer.getAddress()] = signer;
    if (from) {
      this._signers[from as string] = signer;
    }

    return signer;
  }

  public async setSigner(from?: AddressLike): Promise<void> {
    this._currentFrom = from ? await ethers.resolveAddress(from) : from;
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

  private async _getSigner(from?: null | AddressLike): Promise<ExtendedHardhatEthersSigner> {
    if (!from) {
      return ExtendedHardhatEthersSigner.fromSignerName(this._currentFrom);
    }

    // From specified as name. Cast Wallet branch.
    if (!ethers.isAddress(from)) {
      return ExtendedHardhatEthersSigner.fromSignerName(from);
    }

    // From specified as address. HardhatEthersProvider branch.
    const address = await ethers.resolveAddress(from);
    return ExtendedHardhatEthersSigner.fromSignerName(address);
  }
}

export let networkManager: NetworkManager | null = null;

export async function buildNetworkDeps(hre: HardhatRuntimeEnvironment) {
  await createEthersProvider(hre);
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
