import { Transaction } from "ethers";

import TrezorConnect from "@trezor/connect";

import { MigrateError } from "../../errors";

let trezorInitialized = false;

let cachedAddress: string | null = null;
let lastMnemonicIndexAsked: number | null = null;

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
      transports: ["BridgeTransport", "NodeUsbTransport"],
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

  const trezorTx: TrezorTx = {
    to: tx.to!,
    value: tx.value?.toString() || "0",
    chainId: Number(tx.chainId)!,
    gasLimit: tx.gasLimit?.toString() || "0",
    gasPrice: tx.gasPrice?.toString()!,
    nonce: tx.nonce?.toString() || "0",
    data: tx.data || "0x",
  };

  const result = await TrezorConnect.ethereumSignTransaction({
    transaction: trezorTx,
    path: getKeyPath(mnemonicIndex),
    useEmptyPassphrase: true,
  });

  if (!result.success) {
    let errorMessage = `Failed to sign transaction with Trezor: ${result.payload.error}\n`;

    if (result.payload.error.includes("Forbidden key path")) {
      errorMessage +=
        "\n See following GitHub issue on how to resolve the problem: https://github.com/trezor/trezor-suite/issues/17203 \n\n";
    }

    throw new MigrateError(errorMessage);
  }

  return result.payload.serializedTx;
}

export async function getTrezorAddress(mnemonicIndex: number = 0): Promise<string> {
  if (!trezorInitialized) {
    await initTrezor();
  }

  if (lastMnemonicIndexAsked === mnemonicIndex && cachedAddress) {
    return cachedAddress;
  }

  try {
    const result = await TrezorConnect.ethereumGetAddress({
      path: getKeyPath(mnemonicIndex),
      useEmptyPassphrase: true,
    });

    if (!result.success) {
      throw new MigrateError(`Failed to get Trezor address: ${result.payload.error}`);
    }

    lastMnemonicIndexAsked = mnemonicIndex;
    cachedAddress = result.payload.address;

    return result.payload.address;
  } catch (error: any) {
    throw new MigrateError(`Error getting address from Trezor: ${error.message}`);
  }
}

function getKeyPath(mnemonicIndex: number): string {
  return `m/44'/60'/0'/0/${mnemonicIndex}`;
}
