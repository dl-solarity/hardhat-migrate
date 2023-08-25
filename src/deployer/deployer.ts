import { HardhatRuntimeEnvironment } from "hardhat/types";

export class Deployer {
  constructor(private hre: HardhatRuntimeEnvironment) {}

  async deploy() {
    console.log("Deploying...");
  }
}
