import "ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";

import { MigrateConfig } from "./types/migrations";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: MigrateConfig;
  }

  interface HardhatUserConfig {
    migrate?: Partial<MigrateConfig>;
  }
}

declare module "ethers" {
  interface ContractTransaction {
    customData: any & { txName?: string };
  }
}

// To prevent an error where JSON.stringify() doesn't know how to serialize a BigInt,
// we need to add a toJSON method to BigInt's prototype.
// Refer to the MDN documentation for more details: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
