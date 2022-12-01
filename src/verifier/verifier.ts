import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { checkExclusion } from "../utils/exclude-error";

export class Verifier {
  constructor(
    private hre: HardhatRuntimeEnvironment | any,
    private attempts: number,
    private excludedErrors: string[]
  ) {}

  async verify(...contractsWithArgs: any) {
    this.hre.config.contractSizer.runOnCompile = false;

    for (const element of contractsWithArgs) {
      let response: [boolean, string];
      let counter = 0;

      let isExcluded;
      do {
        response = await this.verificationTask(element);
        if (!response[0] && !isExcluded) {
          console.log("Verification failed, reason:\n" + response[1]);
          console.log("Attempt #" + (counter + 1) + "\n");
        }

        counter += 1;
        [isExcluded] = checkExclusion(response[1], this.excludedErrors);
      } while (!response[0] && counter < this.attempts && !isExcluded);

      if (!response[0]) {
        throw new NomicLabsHardhatPluginError(pluginName, response[1]);
      }
    }
  }

  async verificationTask(contractObject: any): Promise<[boolean, string]> {
    try {
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
      });
    } catch (e: any) {
      return [false, e.message];
    }
    return [true, ""];
  }
}
