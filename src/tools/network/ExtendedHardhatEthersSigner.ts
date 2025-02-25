import { AddressLike, JsonRpcProvider, TransactionRequest, TransactionResponse } from "ethers";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

import { MigrateError } from "../../errors";

import { getCastVersion, getSignedTxViaCast } from "../cast/cast-integration";

export class ExtendedHardhatEthersSigner {
  public address: AddressLike;
  public provider: JsonRpcProvider | HardhatEthersProvider;

  constructor(public innerSigner: HardhatEthersSigner) {
    this.provider = this.innerSigner.provider;
    this.address = this.innerSigner.address;
  }

  public async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    // if (!this.useCast) {
    //   return this.innerSigner.sendTransaction(tx);
    // }
    //
    // try {
    //   await getCastVersion();
    // } catch (error) {
    //   throw new MigrateError("Cast is not installed or not found in PATH. Please install it to use this feature.");
    // }
    //
    // const signedTx = await getSignedTxViaCast(tx, this.castOptions);
    //
    // return this.provider.broadcastTransaction(signedTx);

    return this.innerSigner.sendTransaction(tx);
  }
}
