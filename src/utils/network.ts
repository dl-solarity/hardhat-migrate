import { AddressLike, ethers, toBigInt } from "ethers";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { networkManager } from "../tools/network/NetworkManager";

export async function getChainId(): Promise<bigint> {
  return toBigInt(await networkManager!.provider.send("eth_chainId"));
}

export async function isDeployedContractAddress(address: string): Promise<boolean> {
  return (await networkManager!.provider.getCode(address)) !== "0x";
}

export async function getSignerHelper(from?: null | AddressLike): Promise<HardhatEthersSigner> {
  if (!from) {
    return networkManager!.provider.getSigner();
  }

  const address = await ethers.resolveAddress(from, networkManager!.provider);

  return networkManager!.provider.getSigner(address);
}
