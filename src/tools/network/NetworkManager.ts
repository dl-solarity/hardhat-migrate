import axios, { Axios } from "axios";
import { AddressLike, ethers } from "ethers";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { HardhatEthersProvider as HardhatEthersProviderT } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ethersProvider, createEthersProvider } from "./EthersProvider";

import { Reporter } from "../reporters/Reporter";
import { createTransactionRunner } from "../runners/TransactionRunner";

import { sleep } from "../../utils";
import { MAX_RECONNECT_ATTEMPTS, RECONNECT_INTERVAL } from "../../constants";

class StateMiddleware {
  private static _isNetworkIssue: boolean = false;

  public static async retry<T extends (...args: any[]) => any>(
    fn: T,
    args: Parameters<T>,
    retryCount = 1,
  ): Promise<Awaited<ReturnType<T>>> {
    try {
      const result = await fn(...args);

      if (this._isNetworkIssue) {
        Reporter?.stopSpinner();

        this._isNetworkIssue = false;
      }

      return result;
    } catch (e: any) {
      const networkErrorCodes = ["EAI_AGAIN", "ENETDOWN", "ENETUNREACH", "ENOTFOUND", "ECONNABORTED"];
      const isNetworkError = networkErrorCodes.includes(e.code);

      if (!isNetworkError) {
        Reporter?.stopSpinner();

        throw e;
      }

      await Reporter?.startSpinner("network-error");

      Reporter!.reportNetworkError(retryCount, fn.name, e);

      this._isNetworkIssue = true;

      await sleep(RECONNECT_INTERVAL);

      if (retryCount >= MAX_RECONNECT_ATTEMPTS) {
        throw e;
      }

      return this.retry(fn, args, retryCount + 1);
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
