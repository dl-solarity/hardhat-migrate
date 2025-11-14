import {
  AddressLike,
  JsonRpcProvider,
  Transaction,
  TransactionLike,
  TransactionRequest,
  TransactionResponse,
  VoidSigner,
} from "ethers";

import { HardhatEthersProvider, HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";

import { MigrateError } from "../../utils/index.js";

import { getTrezorAddress, initTrezor, signWithTrezor } from "../integrations/trezor-integration.js";
import {
  CastSignOptions,
  getCastVersion,
  getCastWalletAddress,
  getSignedTxViaCast,
} from "../integrations/cast-integration.js";
import { MigrateConfig } from "../../../types/index.js";
import { networkManager } from "./NetworkManager.js";
import { connection } from "./EthersProvider.js";

export class ExtendedHardhatEthersSigner {
  public readonly provider: JsonRpcProvider | HardhatEthersProvider;
  public readonly ethersSigner: VoidSigner | HardhatEthersSigner;
  public readonly signerIdentifier: AddressLike;
  private _initialized: boolean = false;

  constructor(
    private _config: MigrateConfig,
    ethersSigner: VoidSigner | HardhatEthersSigner,
    signerName?: AddressLike,
  ) {
    this.ethersSigner = ethersSigner;
    this.provider = connection!.ethers.provider

    this.signerIdentifier = this._determineSignerIdentifier(signerName);
  }

  static async fromSignerName(signerName?: AddressLike): Promise<ExtendedHardhatEthersSigner> {
    const hre = await import("hardhat");
    let ethersSigner: VoidSigner | HardhatEthersSigner;

    try {
      ethersSigner = await networkManager?.getEthersSigner(signerName as any)!;
    } catch {
      const ethers = await import("ethers");

      const address = ethers.isAddress(signerName) ? signerName : ethers.ZeroAddress;
      ethersSigner = new ethers.VoidSigner(address, null);
    }

    return new ExtendedHardhatEthersSigner(hre.config.migrate, ethersSigner, signerName);
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
    await this._ensureInitialized();

    if (!this._isCastEnabled() && !this._config.trezorWallet.enabled) {
      return this.ethersSigner.sendTransaction(tx);
    }

    const voidSigner = new connection!.ethers.VoidSigner(await this.getAddress(), connection!.ethers.provider);
    let preparedTx = await voidSigner.populateTransaction(tx);

    if (connection!.networkConfig.gasPrice) {
      try {
        preparedTx.gasPrice = connection?.ethers.parseUnits(connection!.networkConfig.gasPrice.toString(), "gwei");
      } catch {
        /* empty */
      }
    }

    if (connection!.networkConfig.gasMultiplier) {
      preparedTx.gasLimit = String(
        (BigInt(preparedTx.gasLimit!) * BigInt(connection!.networkConfig.gasMultiplier * 100)) / 100n,
      );
    }

    delete preparedTx.from;

    if (this._config.trezorWallet.enabled) {
      preparedTx = await this._prepareTrezorTransaction(preparedTx);
    }

    const signedTx = await this._signTransaction(connection!.ethers.Transaction.from(preparedTx));

    return connection!.ethers.provider.broadcastTransaction(signedTx);
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
    tx.gasPrice = await connection!.ethers.provider.send("eth_gasPrice", []);

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
