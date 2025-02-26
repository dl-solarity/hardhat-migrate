import { Transaction } from "ethers";

import TrezorConnect from "@trezor/connect";

import { MigrateError } from "../../errors";

let trezorInitialized = false;

export type TrezorTx = {
  maxFeePerGas?: undefined;
  maxPriorityFeePerGas?: undefined;
  data?: string | undefined;
  txType?: number | undefined;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: string;
  chainId: number;
};

export async function initTrezor(): Promise<void> {
  if (trezorInitialized) return;

  try {
    await TrezorConnect.init({
      manifest: {
        email: "developer@example.com", // TODO: This should be configurable
        appUrl: "https://hardhat.org", // TODO: This should be configurable
      },
      debug: false,
      lazyLoad: true,
      pendingTransportEvent: true,
    });

    trezorInitialized = true;
  } catch (error: any) {
    throw new MigrateError(`Failed to initialize Trezor connection: ${error.message}`);
  }
}

export async function signWithTrezor(tx: Transaction, mnemonicIndex: number = 0): Promise<string> {
  if (!trezorInitialized) {
    await initTrezor();
  }

  const path = `m/44'/60'/0'/0/${mnemonicIndex}`;

  const trezorTx: TrezorTx = {
    to: tx.to!,
    value: tx.value?.toString() || "0",
    chainId: Number(tx.chainId)!,
    gasLimit: tx.gasLimit?.toString() || "0",
    gasPrice: tx.gasPrice?.toString()!,
    nonce: tx.nonce?.toString() || "0",
    data: tx.data || "0x",
  };

  try {
    const result = await TrezorConnect.ethereumSignTransaction({
      transaction: trezorTx,
      path,
      useEmptyPassphrase: true,
    });

    if (!result.success) {
      throw new MigrateError(`Trezor signing failed: ${result.payload.error}`);
    }

    const { r, s, v } = result.payload;
    tx.signature = { r, s, v };

    return tx.serialized;
  } catch (error: any) {
    throw new MigrateError(`Error signing transaction with Trezor: ${error.message}`);
  }
}

export async function getTrezorAddress(mnemonicIndex: number = 0): Promise<string> {
  if (!trezorInitialized) {
    await initTrezor();
  }

  const path = `m/44'/60'/0'/0/${mnemonicIndex}`;

  try {
    const result = await TrezorConnect.ethereumGetAddress({
      path,
      showOnTrezor: false,
      useEmptyPassphrase: true,
    });

    if (!result.success) {
      throw new MigrateError(`Failed to get Trezor address: ${result.payload.error}`);
    }

    return result.payload.address;
  } catch (error: any) {
    throw new MigrateError(`Error getting address from Trezor: ${error.message}`);
  }
}
