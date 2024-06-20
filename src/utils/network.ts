import { toBigInt } from "ethers";

import { networkManager } from "../tools/network/NetworkManager";

export async function getChainId(): Promise<bigint> {
  return toBigInt(await networkManager!.provider.send("eth_chainId"));
}

export async function isDeployedContractAddress(address: string): Promise<boolean> {
  return (await networkManager!.provider.getCode(address)) !== "0x";
}
