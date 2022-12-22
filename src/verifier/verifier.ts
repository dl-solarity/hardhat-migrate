import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { checkExclusion } from "../utils/exclude-error";
import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

export class Verifier {
  constructor(
    private hre: HardhatRuntimeEnvironment | any,
    private attempts: number,
    private skipVerificationErrors: string[]
  ) {}

  async batchVerify(...contractsWithArgs: any) {
    console.log();

    this.hre.config.contractSizer.runOnCompile = false;

    for (const element of contractsWithArgs) {
      await this.verificationAttempt(element);
    }
  }

  async verify(contract: TruffleContract, ...args: any) {
    console.log();

    this.hre.config.contractSizer.runOnCompile = false;

    await this.verificationAttempt(contract, ...args);
  }

  async verificationAttempt(contract: TruffleContract, ...args: any) {
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

  async verificationTask(contract: TruffleContract, ...args: any) {
    const fileName = contract.constructor._hArtifact.sourceName;
    const contractName = contract.constructor._hArtifact.contractName;

    await this.hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: args,
      contract: fileName + ":" + contractName,
      noCompile: true,
    });
  }
}
