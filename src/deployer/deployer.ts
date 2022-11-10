const TruffleDeployer = require("@truffle/deployer");
const TruffleReporter = require("@truffle/reporters").migrationsV5;
import { Verifier } from "../verifier/verifier";

const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider);

export class Deployer {
    private reporter: any;
    private deployer: any;
    private verifier: Verifier | undefined;

    async startMigration(verify: boolean, confirmations: number = 0) {
        try {
            let chainId = await web3.eth.getChainId();
            let networkType = await web3.eth.net.getNetworkType();

            this.reporter = new TruffleReporter();
            this.deployer = new TruffleDeployer({
                logger: console,
                confirmations: confirmations,
                provider: web3.currentProvider,
                networks: {chainId: networkType},
                network: "",
                network_id: chainId,
            });

            if (verify) {
                this.verifier = new Verifier();
            }

            this.reporter.confirmations = confirmations;
            this.reporter.setMigration({dryRun: false});
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
            console.log(e.message);
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
            console.log(e.message);
        }
    }

    async deploy(Instance: any, ...args: any) {
        try {
            const instance = await this.deployer.deploy(Instance, ...args);

            Instance.setAsDeployed(instance);

            if (this.verifier) {
                await this.verifier.verify([instance, ...args]);
            }

            return instance;
        } catch (e: any) {
            console.log(e.message);
        }
    }

    async finishMigration() {
        try {
            this.reporter.postMigrate({
                isLast: true,
            });

            this.deployer.finish();
        } catch (e: any) {
            console.log(e.message);
        }
    }
}
