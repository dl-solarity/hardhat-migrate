import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { checkExclusion } from "../utils/exclude-error";

export class Verifier {
  constructor(
    private hre: HardhatRuntimeEnvironment | any,
    private attempts: number,
    private skipVerificationErrors: string[]
  ) {}

  async verify(...contractsWithArgs: any) {
    this.hre.config.contractSizer.runOnCompile = false;

    for (const element of contractsWithArgs) {
      let counter: number = 0;

      while (true) {
        try {
          await this.verificationTask(element);
          break;
        } catch (e: any) {
          const [isSkipped, msg] = checkExclusion(e.message, this.skipVerificationErrors);

          if (isSkipped) {
            console.log(`Contract at ${element[0].address} ${msg}.`);
            break;
          } else {
            console.log("Verification failed\n" + e.message);
            console.log("Attempt #" + (counter + 1) + "\n");
          }

          if (counter == this.attempts - 1) {
            throw new NomicLabsHardhatPluginError(pluginName, e.message);
          }
        }
        counter += 1;
      }
    }
  }

  async verificationTask(contractObject: any) {
    const contract = contractObject[0];
    const fileName = contract.constructor._hArtifact.sourceName;
    const contractName = contract.constructor._hArtifact.contractName;
    const args = contractObject.slice(1);

    await this.hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: args,
      contract: fileName + ":" + contractName,
      noCompile: true,
    });

    await this.hre.run("compile", {
      quiet: true,
      force: true,
    });
  }
}
