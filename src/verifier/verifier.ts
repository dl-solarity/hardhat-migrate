import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import { pluginName } from "../constants";
import { checkExclusion } from "../utils/exclude-error";
import { callEtherscanApi, EtherscanAPIConfig, getEtherscanAPIConfig, RESPONSE_OK } from "./etherscan-api";

type VerificationItem = {
  instance: TruffleContract;
  address: string;
  args: any;
};

export class Verifier {
  constructor(
    private hre: HardhatRuntimeEnvironment | any,
    private attempts: number,
    private skipVerificationErrors: string[]
  ) {
    if (this.hre.config.contractSizer !== undefined) {
      this.hre.config.contractSizer.runOnCompile = false;
    }
  }

  async verifyBatch(verificationTable: Array<VerificationItem>) {
    for (const item of verificationTable) {
      const contract = await item.instance.at(item.address);

      await this.verifySingle(contract, ...item.args);
    }
  }

  async verifySingle(contract: TruffleContract, ...args: any) {
    console.log();

    await this.attemptVerification(contract, ...args);
  }

  async verifyProxy(proxyAddress: string, implAddress: string) {
    console.log();

    try {
      const etherscanApi = await getEtherscanAPIConfig(this.hre);

      await this.linkProxyWithImplementationAbi(etherscanApi, proxyAddress, implAddress);
    } catch (e: any) {
      if (e.message.includes(`{"message":"Unknown action","result":null,"status":"0"}`)) {
        console.log(`Perhaps you are trying to verify a contract on BlockScout. Proxy verification failed!`);
      } else {
        throw new NomicLabsHardhatPluginError(pluginName, e.message);
      }
    }
  }

  private async attemptVerification(contract: TruffleContract, ...args: any) {
    let counter: number = 0;

    while (true) {
      try {
        await this.verificationTask(contract, ...args);
        break;
      } catch (e: any) {
        const [isSkipped, msg] = checkExclusion(e.message, this.skipVerificationErrors);

        if (isSkipped) {
          console.log(`Contract at ${contract.address} ${msg}.`);
          break;
        } else if (counter < this.attempts - 1) {
          console.log(`Attempt #${counter + 1}\n`);
          console.log(`Verification failed\n${e.message}\n`);
        } else {
          throw new NomicLabsHardhatPluginError(pluginName, e.message);
        }
      }

      counter += 1;
    }
  }

  private async verificationTask(contract: TruffleContract, ...args: any) {
    const fileName = contract.constructor._hArtifact.sourceName;
    const contractName = contract.constructor._hArtifact.contractName;

    await this.hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: args,
      contract: fileName + ":" + contractName,
      noCompile: true,
    });
  }

  /**
   * Calls the Etherscan API to link a proxy with its implementation ABI.
   *
   * Source: https://github.com/OpenZeppelin/openzeppelin-upgrades
   *
   * @param etherscanApi The Etherscan API config
   * @param proxyAddress The proxy address
   * @param implAddress The implementation address
   */
  private async linkProxyWithImplementationAbi(
    etherscanApi: EtherscanAPIConfig,
    proxyAddress: string,
    implAddress: string
  ) {
    console.log(`Linking proxy ${proxyAddress} with implementation`);
    const params = {
      module: "contract",
      action: "verifyproxycontract",
      address: proxyAddress,
      expectedimplementation: implAddress,
    };
    let responseBody = await callEtherscanApi(etherscanApi, params);

    if (responseBody.status === RESPONSE_OK) {
      // initial call was OK, but need to send a status request using the returned guid to get the actual verification status
      const guid = responseBody.result;
      responseBody = await this.checkProxyVerificationStatus(etherscanApi, guid);

      while (responseBody.result === "Pending in queue") {
        await delay(3000);
        responseBody = await this.checkProxyVerificationStatus(etherscanApi, guid);
      }
    }

    if (responseBody.status === RESPONSE_OK) {
      console.log("Successfully linked proxy to implementation.");
    } else {
      throw new NomicLabsHardhatPluginError(
        pluginName,
        `Failed to link proxy ${proxyAddress} with its implementation. Reason: ${responseBody.result}`
      );
    }

    async function delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  private async checkProxyVerificationStatus(etherscanApi: EtherscanAPIConfig, guid: string) {
    const checkProxyVerificationParams = {
      module: "contract",
      action: "checkproxyverification",
      apikey: etherscanApi.key,
      guid: guid,
    };
    return await callEtherscanApi(etherscanApi, checkProxyVerificationParams);
  }
}
