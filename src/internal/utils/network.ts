import { toBigInt } from "ethers";

import { networkManager } from "../tools/network/NetworkManager.js";

export async function getChainId(): Promise<bigint> {
  return toBigInt(await networkManager!.provider.provider.send("eth_chainId"));
}

export async function isDeployedContractAddress(address: string): Promise<boolean> {
  return (await networkManager!.provider.provider.getCode(address)) !== "0x";
}
