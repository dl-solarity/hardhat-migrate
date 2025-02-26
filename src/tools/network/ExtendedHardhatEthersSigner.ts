import {
  AddressLike,
  ethers,
  isAddress,
  JsonRpcProvider,
  Transaction,
  TransactionRequest,
  TransactionResponse,
  VoidSigner,
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
  public address: AddressLike | undefined;
  public provider: JsonRpcProvider | HardhatEthersProvider;

  private _config: MigrateConfig = {} as any;
  private _initialized: boolean = false;

  public ethersSigner: VoidSigner | HardhatEthersSigner;

  static async fromSignerName(signerName: AddressLike | undefined): Promise<ExtendedHardhatEthersSigner> {
    const hre = await import("hardhat");
    let ethersSigner: VoidSigner | HardhatEthersSigner;
    try {
      ethersSigner = await networkManager?.getEthersSigner(signerName as any)!;
    } catch {
      ethersSigner = new VoidSigner(isAddress(signerName) ? signerName : ethers.ZeroAddress, hre.ethers.provider);
    }
    return new ExtendedHardhatEthersSigner(hre, ethersSigner, signerName);
  }

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    ethersSigner: VoidSigner | HardhatEthersSigner,
    signerName: AddressLike | undefined,
  ) {
    this.address = signerName;
    this.ethersSigner = ethersSigner;

    this.provider = this._hre.ethers.provider;

    this._config = this._hre.config.migrate;
  }

  private async _initialize(): Promise<void> {
    if (this._initialized) return;

    if (this._config.trezorWallet.enabled) {
      await initTrezor();
    }

    if (this._config.castWallet.enabled) {
      await getCastVersion();
    }

    this._initialized = true;
  }

  public async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    await this._initialize();

    if (!this._config.castWallet.enabled && !this._config.trezorWallet.enabled) {
      return this.ethersSigner.sendTransaction(tx);
    }

    const populatedTx = await this.ethersSigner.populateTransaction(tx);
    delete populatedTx.from;
    const txObj = Transaction.from(populatedTx);

    return this.provider.broadcastTransaction(await this._signTransaction(txObj));
  }

  public async getAddress(): Promise<string> {
    if (isAddress(this.address)) {
      return this.address as string;
    }

    if (this._config.castWallet.enabled) {
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

  private async _signTransaction(tx: Transaction): Promise<string> {
    if (this._config.castWallet.enabled) {
      return this._signWithCast(tx);
    }

    if (this._config.trezorWallet.enabled) {
      return this._signWithTrezor(tx);
    }

    throw new MigrateError("No valid signer configuration found to sign transaction");
  }

  private async _signWithCast(tx: Transaction): Promise<string> {
    const castOpts = this._getCastOptions();
    return getSignedTxViaCast(tx, castOpts);
  }

  private async _signWithTrezor(tx: Transaction): Promise<string> {
    const mnemonicIndex = this._config.trezorWallet.mnemonicIndex || 0;
    return signWithTrezor(tx, mnemonicIndex);
  }

  private async _signWithHardhat(tx: Transaction): Promise<string> {
    if (!("signTransaction" in this.ethersSigner)) {
      throw new MigrateError("Current signer does not support transaction signing");
    }

    return this.ethersSigner.signTransaction(tx);
  }

  private _getCastOptions(): CastSignOptions {
    const config = this._config.castWallet;
    return {
      keystore: config.keystore,
      passwordFile: config.passwordFile,
      account: config.account,
      interactive: config.interactive,
      mnemonicIndex: config.mnemonicIndex,
    };
  }
}
