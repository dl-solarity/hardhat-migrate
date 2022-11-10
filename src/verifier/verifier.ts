import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";

export class Verifier {
  readonly _hre: HardhatRuntimeEnvironment | any;

  constructor(hre_: HardhatRuntimeEnvironment) {
    this._hre = hre_;
  }

  async verify(...contractsWithArgs: any) {
    this._hre.config.contractSizer.runOnCompile = false;

    for (const element of contractsWithArgs) {
      const contract = element[0];
      const fileName = contract.constructor._hArtifact.sourceName;
      const contractName = contract.constructor._hArtifact.contractName;
      const args = element.slice(1);

      try {
        await this._hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: args,
          contract: fileName + ":" + contractName,
        });

        await this._hre.run("compile", {
          quiet: true,
        });
      } catch (e: any) {
        throw new NomicLabsHardhatPluginError(pluginName, e.message);
      }
    }
  }
}
