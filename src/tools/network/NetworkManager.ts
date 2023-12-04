import axios, { Axios } from "axios";

import type { HardhatEthersProvider as HardhatEthersProviderT } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ethersProvider, initEthersProvider } from "./EthersProvider";

import { reporter } from "../reporters/Reporter";

import { sleep } from "../../utils";
import { MAX_RECONNECT_ATTEMPTS, RECONNECT_INTERVAL } from "../../constants";

import { initTransactionRunner } from "../runners/TransactionRunner";

class StateMiddleware {
  public static async retry<T extends (...args: any[]) => any>(
    fn: T,
    args: Parameters<T>,
    retryCount = 1,
  ): Promise<Awaited<ReturnType<T>>> {
    try {
      const result = await fn(...args);

      reporter?.resetSpinnerMessageIfActive();

      return result;
    } catch (e: any) {
      // TODO: use spinner instead of console.log.
      const networkErrorCodes = ["EAI_AGAIN", "ENETDOWN", "ENETUNREACH", "ENOTFOUND", "ECONNABORTED"];
      const isNetworkError = networkErrorCodes.includes(e.code) || e.isAxiosError;

      if (!isNetworkError) {
        throw e;
      }

      // TODO: set timeout manually.
      reporter!.reportNetworkError(retryCount, fn.name, e);

      await sleep(RECONNECT_INTERVAL);

      if (retryCount >= MAX_RECONNECT_ATTEMPTS) {
        throw e;
      }

      return this.retry(fn, args, retryCount + 1);
    }
  }

  public static withRetry<T extends { [key: string]: any }>(instance: T): T {
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

class NetworkManager {
  public axios: Axios;
  public provider: HardhatEthersProviderT;

  constructor() {
    this.axios = StateMiddleware.withRetry(axios);
    this.provider = StateMiddleware.withRetry(ethersProvider!);
  }
}

export let networkManager: NetworkManager | null = null;

export function initNetworkManager(hre: HardhatRuntimeEnvironment) {
  initEthersProvider(hre);
  initTransactionRunner(hre);

  if (networkManager) {
    return;
  }

  networkManager = new NetworkManager();
}

export function resetNetworkManager() {
  networkManager = null;
}
