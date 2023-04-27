const Web3 = require("web3");
const TruffleDeployer = require("@truffle/deployer");
const TruffleReporter = require("@truffle/reporters").migrationsV5;

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import { Verifier } from "../verifier/verifier";
import { pluginName } from "../constants";
import { Logger } from "../logger/logger";

export class Deployer {
  private reporter: any;
  private deployer: any;
  private verifier: Verifier | undefined;

  constructor(private hre: HardhatRuntimeEnvironment, private skipVerificationErrors: string[]) {}

  async startMigration(logger: Logger, verify: boolean, confirmations: number, attempts: number) {
    try {
      const web3 = new Web3(this.hre.network.provider);
      const chainId = await web3.eth.getChainId();
      const networkType = await web3.eth.net.getNetworkType();

      this.reporter = new TruffleReporter();
      this.deployer = new TruffleDeployer({
        logger: logger,
        confirmations: confirmations,
        provider: web3.currentProvider,
        networks: { chainId: networkType },
        network: "",
        network_id: chainId,
      });

      if (verify) {
        this.verifier = new Verifier(this.hre, attempts, this.skipVerificationErrors);
      }

      this.reporter.confirmations = confirmations;
      this.reporter.setMigration({ dryRun: false });
      this.reporter.setDeployer(this.deployer);

      this.reporter.listen();
      this.deployer.start();

      this.reporter.preMigrate({
        isFirst: true,
        file: "Contracts:",
        network: networkType,
        networkId: chainId,
        blockLimit: (await web3.eth.getBlock("latest")).gasLimit,
      });
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  async link(Library: any, ...Contracts: any) {
    try {
      const library = Library.contractName ? await Library.deployed() : Library;

      for (const Contract of Contracts) {
        this.reporter.linking({
          libraryName: Library.contractName,
          libraryAddress: Library.address,
          contractName: Contract.contractName,
          contractAddress: Contract.contractAddress,
        });

        await Contract.link(library);
      }
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  async deploy(Instance: any, ...args: any) {
    let instance;

    try {
      instance = await this.deployer.deploy(Instance, ...args);

      Instance.setAsDeployed(instance);

      if (this.verifier) {
        await this.verifier.verifySingle(instance, ...args);
      }

      return instance;
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  async deployProxy(Instance: any, implementationAddress: string, ...args: any) {
    let instance;

    try {
      instance = await this.deployer.deploy(Instance, ...args);

      Instance.setAsDeployed(instance);

      if (this.verifier) {
        await this.verifier.verifyProxy(instance.address, implementationAddress);
      }

      return instance;
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  async finishMigration(logger: Logger) {
    try {
      this.reporter.postMigrate({
        isLast: true,
      });
      logger.summary();

      this.deployer.finish();
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }
}
