import axios, { Axios } from "axios";

import type { HardhatEthersProvider as HardhatEthersProviderT } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ethersProvider, initEthersProvider } from "./EthersProvider";

import { reporter } from "../reporters/Reporter";

import { sleep } from "../../utils";
import { initTransactionRunner } from "../runners/TransactionRunner";

class StateMiddleware {
  public static async retry<T extends (...args: any[]) => any>(
    fn: T,
    args: Parameters<T>,
    maxTry: number,
    retryGapMs: number = 3000,
    retryCount = 1,
  ): Promise<Awaited<ReturnType<T>>> {
    try {
      const result = await fn(...args);

      reporter?.resetSpinnerMessageIfActive();

      return result;
    } catch (e: any) {
      const networkErrorCodes = ["EAI_AGAIN", "ENETDOWN", "ENETUNREACH", "ENOTFOUND", "ECONNABORTED"];
      const isNetworkError = networkErrorCodes.includes(e.code) || e.isAxiosError;

      if (!isNetworkError) {
        throw e;
      }

      reporter!.reportNetworkError(retryCount, maxTry, fn.name, e);

      await sleep(retryGapMs);

      if (retryCount >= maxTry) {
        throw e;
      }

      return this.retry(fn, args, maxTry, retryGapMs, retryCount + 1);
    }
  }

  public static withRetry<T extends { [key: string]: any }>(instance: T, retryGapMs: number, retryCount: number): T {
    return new Proxy(instance, {
      get(target, propKey, receiver) {
        const origMethod = target[propKey as keyof T];
        if (typeof origMethod === "function") {
          return (...args: any[]) => {
            return StateMiddleware.retry(origMethod.bind(target), args, retryGapMs, retryCount);
          };
        }
        return Reflect.get(target, propKey, receiver);
      },
    });
  }
}

class NetworkManager {
  public axios: Axios;
  public provider: HardhatEthersProviderT;

  constructor(hre: HardhatRuntimeEnvironment) {
    this.axios = StateMiddleware.withRetry(axios, hre.config.migrate.maxRetryAttempts, hre.config.migrate.retryGapMs);
    this.provider = StateMiddleware.withRetry(
      ethersProvider!,
      hre.config.migrate.maxRetryAttempts,
      hre.config.migrate.retryGapMs,
    );
  }
}

export let networkManager: NetworkManager | null = null;

export function initNetworkManager(hre: HardhatRuntimeEnvironment) {
  initEthersProvider(hre);
  initTransactionRunner(hre);
  networkManager = new NetworkManager(hre);
}
