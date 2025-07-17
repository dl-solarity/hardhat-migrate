import type {
  AddressLike,
  JsonRpcProvider,
  Transaction,
  VoidSigner,
  TransactionLike,
  TransactionRequest,
  TransactionResponse,
} from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

import { MigrateError } from "../../errors";

import { getTrezorAddress, initTrezor, signWithTrezor } from "../integrations/trezor-integration";
import {
  CastSignOptions,
  getCastVersion,
  getCastWalletAddress,
  getSignedTxViaCast,
} from "../integrations/cast-integration";
import { MigrateConfig } from "../../types/migrations";
import { networkManager } from "./NetworkManager";

export class ExtendedHardhatEthersSigner {
  private readonly _config: MigrateConfig;
  private _initialized: boolean = false;

  public readonly provider: JsonRpcProvider | HardhatEthersProvider;
  public readonly ethersSigner: VoidSigner | HardhatEthersSigner;
  public readonly signerIdentifier: AddressLike;

  static async fromSignerName(signerName?: AddressLike): Promise<ExtendedHardhatEthersSigner> {
    const hre = await import("hardhat");
    let ethersSigner: VoidSigner | HardhatEthersSigner;

    try {
      ethersSigner = await networkManager?.getEthersSigner(signerName as any)!;
    } catch {
      const address = hre.ethers.isAddress(signerName) ? signerName : hre.ethers.ZeroAddress;
      ethersSigner = new hre.ethers.VoidSigner(address, hre.ethers.provider);
    }

    return new ExtendedHardhatEthersSigner(hre, ethersSigner, signerName);
  }

  constructor(
    private readonly _hre: HardhatRuntimeEnvironment,
    ethersSigner: VoidSigner | HardhatEthersSigner,
    signerName?: AddressLike,
  ) {
    this.ethersSigner = ethersSigner;

    this._config = this._hre.config.migrate;
    this.provider = this._hre.ethers.provider;

    this.signerIdentifier = this._determineSignerIdentifier(signerName);
  }

  public async getAddress(): Promise<string> {
    if (this._isCastEnabled()) {
      return getCastWalletAddress(this._getCastOptions());
    }

    if (this._config.trezorWallet.enabled) {
      return getTrezorAddress(this._config.trezorWallet.mnemonicIndex || 0);
    }

    if ("getAddress" in this.ethersSigner) {
      return this.ethersSigner.getAddress();
    }

    throw new MigrateError("No valid signer configuration found to determine address");
  }

  public async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    const hre = await import("hardhat");

    await this._ensureInitialized();

    if (!this._isCastEnabled() && !this._config.trezorWallet.enabled) {
      return this.ethersSigner.sendTransaction(tx);
    }

    const voidSigner = new hre.ethers.VoidSigner(await this.getAddress(), this.provider);
    let preparedTx = await voidSigner.populateTransaction(tx);

    if (hre.network.config.gasPrice) {
      try {
        preparedTx.gasPrice = hre.ethers.parseUnits(hre.network.config.gasPrice.toString(), "gwei");
      } catch {}
    }

    if (hre.network.config.gasMultiplier) {
      preparedTx.gasLimit = String(BigInt(preparedTx.gasLimit!) * BigInt(hre.network.config.gasMultiplier * 100) / 100n);
    }
    delete preparedTx.from;

    if (this._config.trezorWallet.enabled) {
      preparedTx = await this._prepareTrezorTransaction(preparedTx);
    }

    const signedTx = await this._signTransaction(hre.ethers.Transaction.from(preparedTx));

    return this.provider.broadcastTransaction(signedTx);
  }

  private _determineSignerIdentifier(signerName?: AddressLike): AddressLike {
    if (signerName) {
      return signerName;
    }

    if (this._isCastEnabled()) {
      return (this._config.castWallet.account || this._config.castWallet.keystore)!;
    }

    if (this._config.trezorWallet.enabled) {
      return "trezor";
    }

    return this.ethersSigner.getAddress();
  }

  private async _ensureInitialized(): Promise<void> {
    if (this._initialized) return;

    if (this._config.trezorWallet.enabled) {
      await initTrezor();
    }

    if (this._isCastEnabled()) {
      await getCastVersion();
    }

    this._initialized = true;
  }

  private async _prepareTrezorTransaction(tx: TransactionLike): Promise<TransactionLike> {
    delete tx.maxFeePerBlobGas;
    delete tx.maxFeePerGas;
    delete tx.maxPriorityFeePerGas;

    tx.type = 1;
    tx.gasPrice = await this.provider.send("eth_gasPrice", []);

    return tx;
  }

  private async _signTransaction(tx: Transaction): Promise<string> {
    if (this._isCastEnabled()) {
      return getSignedTxViaCast(tx, this._getCastOptions());
    }

    if (this._config.trezorWallet.enabled) {
      const mnemonicIndex = this._config.trezorWallet.mnemonicIndex || 0;
      return signWithTrezor(tx, mnemonicIndex);
    }

    throw new MigrateError("No valid signer configuration found to sign transaction");
  }

  private _getCastOptions(): CastSignOptions {
    const config = this._config.castWallet;
    return {
      keystore: config.keystore,
      passwordFile: config.passwordFile,
      account: config.account,
    };
  }

  private _isCastEnabled(): boolean {
    return this._config.castWallet.account !== undefined || this._config.castWallet.keystore !== undefined;
  }
}
