export class Verifier {
  async verify(...contractsWithArgs: any) {
    const hre = await import("hardhat");
    // @ts-ignore
    hre.config.contractSizer.runOnCompile = false;

    for (const element of contractsWithArgs) {
        const contract = element[0];
        const fileName = contract.constructor._hArtifact.sourceName;
        const contractName = contract.constructor._hArtifact.contractName;
        const args = element.slice(1);

      try {
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: args,
          contract: fileName + ":" + contractName,
        });

        await hre.run("compile", {
          quiet: true,
        });
      } catch (e: any) {
        console.log(e.message);
      }
    }
  }
}
