import { join } from "path";
import { format } from "prettier";
import { existsSync, mkdirSync, writeFile, writeFileSync } from "fs";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Network, TransactionReceipt, TransactionResponse } from "ethers";

import { Reporter } from "./Reporter";

import { Stats } from "../Stats";

import { ContractFieldsToSave, MigrationMetadata, TransactionFieldsToSave } from "../../types/tools";

import { castAmount, catchError } from "../../utils";

export type NetworkInfo = {
  network: Network;
  explorer: string;
};

export type ReportState = {
  title: string;
  generalInfo: {
    title: string;
    migrationFiles: Set<string>;
    networks: Record<string, NetworkInfo>;
  };
  reportedContracts: Set<[name: string, address: string]>;
  detailedMigrationFiles: {
    migrationName: string;
    links: Set<string>;
    responses: Set<TransactionResponse>;
    receipts: Set<TransactionReceipt>;
  }[];
  stats: {
    totalContracts: number;
    totalTransactions: number;
    gasUsed: bigint;
    averageGasPrice: bigint;
    feePayed: bigint;
    nativeCurrencySent: bigint;
  };
  missingLibraries: Set<string>;
  recoveredContracts: Set<[name: string, address: string]>;
  recoveredTransactions: Set<[name: string, hash: string]>;
  verificationStats: {
    status: string;
    verifiedContracts: Set<[name: string, address: string]>;
    failedContracts: Set<[name: string, address: string]>;
    failedToSaveContracts: Set<string>;
    alreadyVerifiedContracts: Set<[name: string, address: string]>;
    proxyLinkingSuccess: Set<[name: string, address: string]>;
    proxyLinkingFailure: Set<[name: string, address: string]>;
  };
  collisions: {
    contracts: Set<{
      prevMigrationNumber: number;
      prevContractAddress: string;
      newMigrationNumber: number;
      newContractAddress: string;
    }>;
    transactions: Set<{
      prevMigrationNumber: number;
      prevMethodName: string;
      newMigrationNumber: number;
      newMethodName: string;
    }>;
    unknown: Set<{
      prevMigrationNumber: number;
      prevContractAddress: string;
      prevMethodName: string;
      newMigrationNumber: number;
      newContractAddress: string;
      newMethodName: string;
    }>;
  };
  allContracts: Set<[name: string, address: string]>;
  allTransactions: Set<[name: string, hash: string]>;
};

/**
 * Class that manages the storage of the reported operation.
 *
 * Produces reports, metrics and logs in a file format.
 */
@catchError
export class ReporterStorage {
  private _currentReportID: string | null = null;

  private readonly _state: ReportState;

  private _currentlyDeployingInstance: string = "";

  private _defaultVerificationState: string = "Nothing to verify";

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._state = {
      title: "Migration Report",
      generalInfo: {
        title: "General Information",
        migrationFiles: new Set(),
        networks: {},
      },
      reportedContracts: new Set(),
      detailedMigrationFiles: [],
      stats: {
        totalContracts: 0,
        totalTransactions: 0,
        gasUsed: 0n,
        averageGasPrice: 0n,
        feePayed: 0n,
        nativeCurrencySent: 0n,
      },
      missingLibraries: new Set(),
      recoveredContracts: new Set(),
      recoveredTransactions: new Set(),
      verificationStats: {
        status: this._defaultVerificationState,
        verifiedContracts: new Set(),
        failedContracts: new Set(),
        failedToSaveContracts: new Set(),
        alreadyVerifiedContracts: new Set(),
        proxyLinkingSuccess: new Set(),
        proxyLinkingFailure: new Set(),
      },
      collisions: {
        contracts: new Set(),
        transactions: new Set(),
        unknown: new Set(),
      },
      allContracts: new Set(),
      allTransactions: new Set(),
    };
  }

  public storeMigrationBegin() {
    this._commitReport();
  }

  public storeMigrationFileBegin(migrationName: string) {
    this._state.detailedMigrationFiles[Stats.currentMigration] = {
      migrationName,
      links: new Set(),
      responses: new Set(),
      receipts: new Set(),
    };
  }

  public storeTransactionResponseHeader(
    transactionResponse: TransactionResponse,
    instanceName: string,
    txLink: string,
  ) {
    if (!this._state.detailedMigrationFiles[Stats.currentMigration]) {
      Reporter!.addWarning(
        `Direct deploy without migration file. Cannot process detailed migration file data for ${instanceName} and ${txLink}`,
      );

      return;
    }

    this._state.detailedMigrationFiles[Stats.currentMigration].links.add(txLink);
    this._state.detailedMigrationFiles[Stats.currentMigration].responses.add(transactionResponse);

    this._currentlyDeployingInstance = instanceName;

    this._commitReport();
  }

  public storeTransactionReceipt(transactionReceipt: TransactionReceipt, value: bigint) {
    if (!this._state.detailedMigrationFiles[Stats.currentMigration]) {
      Reporter!.addWarning(
        `Direct deploy without migration file. Cannot process detailed migration file data for ${transactionReceipt.hash}`,
      );

      return;
    }

    this._state.detailedMigrationFiles[Stats.currentMigration].receipts.add(transactionReceipt);

    if (transactionReceipt.contractAddress) {
      this._state.stats.totalContracts += 1;

      this._state.allContracts.add([this._currentlyDeployingInstance, transactionReceipt.contractAddress]);
    } else {
      this._state.stats.totalTransactions += 1;

      this._state.allTransactions.add([this._currentlyDeployingInstance, transactionReceipt.hash]);
    }

    this._state.stats.gasUsed += BigInt(transactionReceipt.gasUsed);
    this._state.stats.averageGasPrice =
      (BigInt(transactionReceipt.gasPrice) + this._state.stats.averageGasPrice) /
      BigInt(this._state.stats.totalTransactions + this._state.stats.totalContracts);
    this._state.stats.feePayed += BigInt(transactionReceipt.fee);
    this._state.stats.nativeCurrencySent += BigInt(value);

    this._commitReport();
  }

  public storeReportedContracts(contracts: [string, string][]) {
    for (const contract of contracts) {
      this._state.reportedContracts.add(contract);
    }

    this._commitReport();
  }

  public storeDeploymentOfMissingLibrary(libraryName: string) {
    this._state.missingLibraries.add(libraryName);

    this._commitReport();
  }

  public storeContractRecovery(contractName: string, contractAddress: string) {
    this._state.recoveredContracts.add([contractName, contractAddress]);

    this._commitReport();
  }

  public storeTransactionRecovery(methodString: string, savedTx: TransactionFieldsToSave) {
    const receipt: any = savedTx.receipt;
    this._state.recoveredTransactions.add([methodString, receipt.hash ? receipt.hash : "N/A"]);

    this._commitReport();
  }

  public storeNothingToVerify() {
    this._commitReport();
  }

  public storeVerificationSuccess(contractName: string, contractAddress: string) {
    if (this._state.verificationStats.status === this._defaultVerificationState) {
      this._state.verificationStats.status = "Verification successful";
    }

    this._state.verificationStats.verifiedContracts.add([contractName, contractAddress]);

    this._commitReport();
  }

  public storeAlreadyVerified(contractName: string, contractAddress: string) {
    if (this._state.verificationStats.status === this._defaultVerificationState) {
      this._state.verificationStats.status = "Verification successful with already verified contracts";
    }

    this._state.verificationStats.alreadyVerifiedContracts.add([contractName, contractAddress]);

    this._commitReport();
  }

  public storeVerificationFailure(contractName: string, contractAddress: string) {
    this._state.verificationStats.status = "Verification failed";

    this._state.verificationStats.failedContracts.add([contractName, contractAddress]);

    this._commitReport();
  }

  public storeVerificationSaveFailure(contractName: string) {
    this._state.verificationStats.status = "Verification failed";

    this._state.verificationStats.failedToSaveContracts.add(contractName);

    this._commitReport();
  }

  public storeTransactionCollision(oldData: TransactionFieldsToSave, dataToSave: TransactionFieldsToSave) {
    this._state.collisions.transactions.add({
      prevMigrationNumber: oldData.metadata.migrationNumber,
      prevMethodName: oldData.metadata.methodName || "N/A",
      newMigrationNumber: dataToSave.metadata.migrationNumber,
      newMethodName: dataToSave.metadata.methodName || "N/A",
    });

    this._commitReport();
  }

  public storeUnknownCollision(
    metadata: MigrationMetadata,
    dataToSave: TransactionFieldsToSave | ContractFieldsToSave,
  ) {
    this._state.collisions.unknown.add({
      prevMigrationNumber: metadata.migrationNumber,
      prevContractAddress: metadata.contractName || "N/A",
      prevMethodName: metadata.methodName || "N/A",
      newMigrationNumber: dataToSave.metadata.migrationNumber,
      newContractAddress: dataToSave.metadata.contractName || "N/A",
      newMethodName: dataToSave.metadata.methodName || "N/A",
    });

    this._commitReport();
  }

  public storeContractCollision(oldData: ContractFieldsToSave, dataToSave: ContractFieldsToSave) {
    this._state.collisions.contracts.add({
      prevMigrationNumber: oldData.metadata.migrationNumber,
      prevContractAddress: oldData.metadata.contractName || "N/A",
      newMigrationNumber: dataToSave.metadata.migrationNumber,
      newContractAddress: dataToSave.metadata.contractName || "N/A",
    });

    this._commitReport();
  }

  public storeMigrationFiles(migrationFiles: string[]) {
    for (const migrationFile of migrationFiles) {
      this._state.generalInfo.migrationFiles.add(migrationFile);
    }

    this._commitReport();
  }

  public storeChainInfo(network: NetworkInfo) {
    this._state.generalInfo.networks[network.network.name] = network;

    this._commitReport();
  }

  public storeSuccessfulProxyLinking(contractName: string, contractAddress: string) {
    this._state.verificationStats.proxyLinkingSuccess.add([contractName, contractAddress]);

    this._commitReport();
  }

  public storeFailedProxyLinking(contractName: string, contractAddress: string) {
    this._state.verificationStats.proxyLinkingFailure.add([contractName, contractAddress]);

    this._commitReport();
  }

  public completeReport() {
    this._commitReport();
  }

  private _commitReport() {
    const reportID = this._getReportID();

    const pathToReportDir = join(this._hre.config.paths.root, this._hre.config.migrate.paths.reportPath);

    if (!existsSync(pathToReportDir)) {
      mkdirSync(pathToReportDir, { recursive: true });
    }

    this._getReportContent().then((content) => {
      writeFile(join(pathToReportDir, reportID), content, { flag: "w" }, (err) => {
        if (err) {
          console.error(`Error writing report to ${pathToReportDir}`);
          console.error(err);
        }
      });
    });
  }

  public async finishReport() {
    const reportID = this._getReportID();

    const pathToReportDir = join(this._hre.config.paths.root, this._hre.config.migrate.paths.reportPath);

    if (!existsSync(pathToReportDir)) {
      mkdirSync(pathToReportDir, { recursive: true });
    }

    const content: string = await this._getReportContent();
    writeFileSync(join(pathToReportDir, reportID), content, { flag: "w" });
  }

  private _getReportID() {
    if (this._currentReportID !== null) {
      return this._currentReportID;
    }

    this._state.title = this._getReportName();
    this._currentReportID = this._getReportName();

    return this._currentReportID;
  }

  private _getReportName() {
    const date = new Date(Date.now()).toISOString();
    const extension = this._hre.config.migrate.paths.reportFormat === "json" ? "json" : "md";

    return `Migration Report ${date}.${extension}`;
  }

  private _getReportContent(): Promise<string> {
    const reportFormat = this._hre.config.migrate.paths.reportFormat;

    if (reportFormat === "json") {
      return Promise.resolve(
        JSON.stringify(
          this._state,
          (_, value) => {
            if (typeof value === "bigint") {
              return value.toString();
            }

            if (value instanceof Set) {
              return Array.from(value);
            }

            if (value instanceof Map) {
              return Object.fromEntries(value);
            }

            return value;
          },
          2,
        ),
      );
    } else {
      return this._getMarkdownReportContent();
    }
  }

  private _getMarkdownReportContent(): Promise<string> {
    const { title, generalInfo, reportedContracts } = this._state;

    const actualState: any[] = [];

    actualState.push({ h1: title });
    actualState.push({ h2: generalInfo.title });

    actualState.push({ h3: "Migration Files" });
    actualState.push({ ul: Array.from(generalInfo.migrationFiles) });

    actualState.push({ h3: "Networks" });
    actualState.push({
      ul: Object.values(generalInfo.networks).map((network) => {
        const name = network.network.name;
        const chainId = network.network.chainId;
        const explorer = network.explorer;

        return `${name} - Chain ID: ${chainId}. Explorer: ${explorer}`;
      }),
    });

    if (reportedContracts.size > 0) {
      actualState.push({ h2: "Reported Contracts" });
      actualState.push({ table: { headers: ["Name", "Address"], rows: Array.from(reportedContracts) } });
    }

    actualState.push({ h2: "Detailed Migration Files" });

    for (const migrationFile of this._state.detailedMigrationFiles) {
      if (!migrationFile) {
        continue;
      }

      actualState.push({ h3: migrationFile.migrationName });
      actualState.push({ ul: Array.from(migrationFile.links) });
    }

    actualState.push({ h2: "Stats" });
    actualState.push({
      table: {
        headers: [
          "Total Contracts",
          "Total Transactions",
          "Gas Used",
          "Average Gas Price",
          "Fee Payed",
          "Native Currency Sent",
        ],
        rows: [
          [
            this._state.stats.totalContracts,
            this._state.stats.totalTransactions,
            String(this._state.stats.gasUsed),
            castAmount(this._state.stats.averageGasPrice),
            castAmount(this._state.stats.feePayed),
            castAmount(this._state.stats.nativeCurrencySent),
          ],
        ],
      },
    });

    actualState.push({
      p: ["Total Cost: ", castAmount(this._state.stats.feePayed + this._state.stats.nativeCurrencySent)],
    });

    if (this._state.missingLibraries.size > 0) {
      actualState.push({ h2: "Missing Libraries" });
      actualState.push({ ul: Array.from(this._state.missingLibraries) });
    }

    if (this._state.recoveredContracts.size > 0) {
      actualState.push({ h2: "Recovered Contracts" });
      actualState.push({ table: { headers: ["Name", "Address"], rows: Array.from(this._state.recoveredContracts) } });
    }

    if (this._state.recoveredTransactions.size > 0) {
      actualState.push({ h2: "Recovered Transactions" });
      actualState.push({ table: { headers: ["Name", "Hash"], rows: Array.from(this._state.recoveredTransactions) } });
    }

    if (this._state.verificationStats.status !== this._defaultVerificationState) {
      actualState.push({ h2: `Verification Stats. ${this._state.verificationStats.status}` });

      if (this._state.verificationStats.verifiedContracts.size > 0) {
        actualState.push({ h3: "Verified Contracts" });
        actualState.push({
          table: { headers: ["Name", "Address"], rows: Array.from(this._state.verificationStats.verifiedContracts) },
        });
      }

      if (this._state.verificationStats.alreadyVerifiedContracts.size > 0) {
        actualState.push({ h3: "Already Verified Contracts" });
        actualState.push({
          table: {
            headers: ["Name", "Address"],
            rows: Array.from(this._state.verificationStats.alreadyVerifiedContracts),
          },
        });
      }

      if (this._state.verificationStats.failedContracts.size > 0) {
        actualState.push({ h3: "Failed Contracts" });
        actualState.push({
          table: { headers: ["Name", "Address"], rows: Array.from(this._state.verificationStats.failedContracts) },
        });
      }

      if (this._state.verificationStats.failedToSaveContracts.size > 0) {
        actualState.push({ h3: "Failed to Save Contracts" });
        actualState.push({ ul: Array.from(this._state.verificationStats.failedToSaveContracts) });
      }

      if (this._state.verificationStats.proxyLinkingSuccess.size > 0) {
        actualState.push({ h3: "Proxy Linking Success" });
        actualState.push({
          table: { headers: ["Name", "Address"], rows: Array.from(this._state.verificationStats.proxyLinkingSuccess) },
        });
      }

      if (this._state.verificationStats.proxyLinkingFailure.size > 0) {
        actualState.push({ h3: "Proxy Linking Failure" });
        actualState.push({
          table: { headers: ["Name", "Address"], rows: Array.from(this._state.verificationStats.proxyLinkingFailure) },
        });
      }
    }

    if (
      this._state.collisions.contracts.size > 0 ||
      this._state.collisions.transactions.size > 0 ||
      this._state.collisions.unknown.size > 0
    ) {
      actualState.push({ h2: "Collisions" });

      if (this._state.collisions.contracts.size > 0) {
        actualState.push({ h3: "Contracts" });
        actualState.push({
          table: {
            headers: ["Prev Migration Number", "Prev Contract Address", "New Migration Number", "New Contract Address"],
            rows: Array.from(this._state.collisions.contracts).map((contract) => [
              contract.prevMigrationNumber,
              contract.prevContractAddress,
              contract.newMigrationNumber,
              contract.newContractAddress,
            ]),
          },
        });
      }

      if (this._state.collisions.transactions.size > 0) {
        actualState.push({ h3: "Transactions" });
        actualState.push({
          table: {
            headers: ["Prev Migration Number", "Prev Method Name", "New Migration Number", "New Method Name"],
            rows: Array.from(this._state.collisions.transactions).map((transaction) => [
              transaction.prevMigrationNumber,
              transaction.prevMethodName,
              transaction.newMigrationNumber,
              transaction.newMethodName,
            ]),
          },
        });
      }

      if (this._state.collisions.unknown.size > 0) {
        actualState.push({ h3: "Unknown" });
        actualState.push({
          table: {
            headers: [
              "Prev Migration Number",
              "Prev Contract Address",
              "Prev Method Name",
              "New Migration Number",
              "New Contract Address",
              "New Method Name",
            ],
            rows: Array.from(this._state.collisions.unknown).map((unknown) => [
              unknown.prevMigrationNumber,
              unknown.prevContractAddress,
              unknown.prevMethodName,
              unknown.newMigrationNumber,
              unknown.newContractAddress,
              unknown.newMethodName,
            ]),
          },
        });
      }
    }

    if (this._state.allContracts.size > 0) {
      actualState.push({ h2: "All Contracts" });
      actualState.push({ table: { headers: ["Name", "Address"], rows: Array.from(this._state.allContracts) } });
    }

    if (this._state.allTransactions.size > 0) {
      actualState.push({ h2: "All Transactions" });
      actualState.push({ table: { headers: ["Name", "Hash"], rows: Array.from(this._state.allTransactions) } });
    }

    return format(require("json2md")(actualState), {
      parser: "markdown",
      printWidth: 80,
      proseWrap: "always",
    });
  }
}
