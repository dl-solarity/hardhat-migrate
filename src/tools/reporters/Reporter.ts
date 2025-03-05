/* eslint-disable no-console */
import ora, { Ora } from "ora";

import { Network, TransactionResponse, TransactionReceipt, id } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ReporterStorage } from "./ReporterStorage";

import { networkManager } from "../network/NetworkManager";

import { castAmount, catchError, underline } from "../../utils";

import { MigrateConfig } from "../../types/migrations";
import { ChainRecord, CustomChainRecord, predefinedChains } from "../../types/verifier";
import { ContractFieldsToSave, MigrationMetadata, TransactionFieldsToSave } from "../../types/tools";

/**
 * Global error handling for network-related issues is conducted within the NetworkManager class
 */
@catchError
class BaseReporter {
  private _hre: HardhatRuntimeEnvironment = {} as any;
  private _config: MigrateConfig = {} as any;
  private _network: Network = {} as any;

  private _spinner: Ora | null = null;
  private _spinnerMessage: string | null = null;
  private _spinnerInterval: NodeJS.Timeout | null = null;
  private _spinnerState: string[] = [];

  private _nativeSymbol: string = "";
  private _explorerUrl: string = "";
  private _txExplorerUrl: string = "";

  private _warningsToPrint: Map<string, string> = new Map();

  private _storage: ReporterStorage | null = null;

  public async init(hre: HardhatRuntimeEnvironment) {
    this._hre = hre;
    this._config = hre.config.migrate;

    this._network = await this._getNetwork();
    this._nativeSymbol = await this._getNativeSymbol();
    this._explorerUrl = await this.getExplorerUrl();

    try {
      this._txExplorerUrl = this._explorerUrl !== "" ? new URL("tx/", this._explorerUrl).toString() : "";
    } catch {
      this._txExplorerUrl = "";
    }

    this._storage = new ReporterStorage(hre);
  }

  public notifyStorageAboutContracts(contracts: [name: string, address: string][]) {
    this._storage!.storeReportedContracts(contracts);
  }

  public reportMigrationBegin(files: string[]) {
    this._reportMigrationFiles(files);

    this._reportChainInfo();

    console.log("\nStarting migration...\n");

    this._storage!.storeMigrationBegin();
  }

  public reportMigrationFileBegin(file: string) {
    console.log(`\n${underline(`Running ${file}...`)}`);

    this._storage!.storeMigrationFileBegin(file);
  }

  public reportTransactionResponseHeader(tx: TransactionResponse, instanceName: string) {
    console.log("\n" + underline(this._parseTransactionTitle(tx, instanceName)));

    const txLink = this._getExplorerLink(tx.hash);

    console.log(`> explorer: ${txLink}`);

    this._storage!.storeTransactionResponseHeader(tx, instanceName, txLink);
  }

  public async startTxReporting(tx: TransactionResponse) {
    if (this._hre.config.migrate.execution.withoutCLIReporting) {
      return;
    }

    const timeStart = Date.now();
    const blockStart = await networkManager!.provider.getBlockNumber();

    const formatPendingTimeTask = async () => this._formatPendingTime(tx, timeStart, blockStart);

    return this.startSpinner("tx-report", formatPendingTimeTask);
  }

  public async startSpinner(id: string, getSpinnerText: (args?: any) => string | Promise<string>) {
    if (this._spinnerState.includes(id)) return;

    if (this._spinnerState.length === 0) {
      this._spinner = ora(await getSpinnerText()).start();

      this._spinnerInterval = setInterval(async () => {
        if (!this._spinner) {
          clearInterval(this._spinnerInterval!);

          return;
        }

        this._spinner.text = await getSpinnerText();
      }, this._config.execution.transactionStatusCheckInterval);
    }

    this._spinnerState.push(id);
  }

  public stopSpinner() {
    if (!this._spinner) return;

    this._spinnerMessage = null;
    this._spinnerState.pop();

    if (this._spinnerState.length === 0) {
      clearInterval(this._spinnerInterval!);

      this._spinner.stop();
      this._spinner = null;
    }
  }

  public async reportTransactionReceipt(receipt: TransactionReceipt) {
    let output = "";

    if (receipt.contractAddress) {
      output += `> contractAddress: ${receipt.contractAddress}\n`;
    }

    const nativeSymbol = this._nativeSymbol;

    output += `> blockNumber: ${receipt.blockNumber}\n`;

    output += `> blockTimestamp: ${(await receipt.getBlock()).timestamp}\n`;

    output += `> account: ${receipt.from}\n`;

    const value = (await receipt.getTransaction()).value;
    output += `> value: ${castAmount(value, nativeSymbol)}\n`;

    output += `> balance: ${castAmount(await receipt.provider.getBalance(receipt.from), nativeSymbol)}\n`;

    output += `> gasUsed: ${receipt.gasUsed}\n`;

    output += `> gasPrice: ${castAmount(receipt.gasPrice, nativeSymbol)}\n`;

    output += `> fee: ${castAmount(receipt.fee, nativeSymbol)}\n`;

    console.log(output);

    this._storage!.storeTransactionReceipt(receipt, value);
  }

  public summary(totalTransactions: bigint, totalCost: bigint) {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${totalTransactions}\n` +
      `> ${"Final cost:".padEnd(20)} ${castAmount(totalCost, this._nativeSymbol)}\n`;

    console.log(`\n${output}`);

    this.reportWarnings();

    this._storage!.completeReport();
  }

  public notifyDeploymentInsteadOfRecovery(contractName: string): void {
    const output = `\nCan't recover contract address for ${contractName}. Deploying instead...`;

    console.log(output);
  }

  public notifyDeploymentOfMissingLibrary(libraryName: string): void {
    const output = `\nDeploying missing library ${libraryName}...`;

    console.log(output);

    this._storage!.storeDeploymentOfMissingLibrary(libraryName);
  }

  public notifyTransactionSendingInsteadOfRecovery(contractMethod: string): void {
    const output = `\nCan't recover transaction for ${contractMethod}. Sending instead...`;

    console.log(output);
  }

  public notifyContractRecovery(contractName: string, contractAddress: string): void {
    const output = `\nContract address for ${contractName} has been recovered: ${contractAddress}`;

    console.log(output);

    this._storage!.storeContractRecovery(contractName, contractAddress);
  }

  public notifyTransactionRecovery(methodString: string, savedTx: TransactionFieldsToSave): void {
    const output = `\nTransaction ${methodString} has been recovered.`;

    console.log(output);

    this._storage!.storeTransactionRecovery(methodString, savedTx);
  }

  public reportVerificationBatchBegin() {
    console.log("\nStarting verification of all deployed contracts");
  }

  public reportNothingToVerify() {
    console.log(`\nNothing to verify. Selected network is ${this._network.name}`);

    this._storage!.storeNothingToVerify();
  }

  public reportSuccessfulVerification(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verified successfully.`;

    console.log(output);

    this._storage!.storeVerificationSuccess(contractName, contractAddress);
  }

  public reportAlreadyVerified(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) already verified.`;

    console.log(output);

    this._storage!.storeAlreadyVerified(contractName, contractAddress);
  }

  public reportVerificationError(contractAddress: string, contractName: string, message: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verification failed: ${message}`;

    console.log(output);

    this._storage!.storeVerificationFailure(contractName, contractAddress);
  }

  public reportVerificationFailedToSave(contractName: string) {
    const output = `\nFailed to save verification arguments for contract: ${contractName}`;

    console.log(output);

    this._storage!.storeVerificationSaveFailure(contractName);
  }

  public notifyContractCollisionByName(oldData: ContractFieldsToSave, dataToSave: ContractFieldsToSave) {
    const output = `\nContract collision by Contract Name detected!`;
    this._printContractCollision(output, oldData, dataToSave);
  }

  public notifyContractCollisionByKeyFields(oldData: ContractFieldsToSave, dataToSave: ContractFieldsToSave) {
    let output = `\nContract collision by key fields detected!`;
    output += `\nKey fields are bytecode, from, chainId, value and contract name`;
    this._printContractCollision(output, oldData, dataToSave);
  }

  public notifyTransactionCollision(oldData: TransactionFieldsToSave, dataToSave: TransactionFieldsToSave) {
    let output = `\nTransaction collision detected!`;
    output += `\n> Previous Collision Details: `;
    output += `\n\t- Migration Number: ${oldData.metadata.migrationNumber}`;
    output += `\n\t- Method Name: ${oldData.metadata.methodName || "N/A"}`;
    output += `\n> New Collision Details: `;
    output += `\n\t- Migration Number: ${dataToSave.metadata.migrationNumber}`;
    output += `\n\t- Method Name: ${dataToSave.metadata.methodName || "N/A"}`;

    const key = id(output);

    if (!this._warningsToPrint.has(key)) {
      console.log(output);
    }

    this._warningsToPrint.set(key, output);

    this._storage!.storeTransactionCollision(oldData, dataToSave);
  }

  public addWarning(warning: string) {
    this._warningsToPrint.set(id(warning), warning);
  }

  public notifyUnknownCollision(
    metadata: MigrationMetadata,
    dataToSave: TransactionFieldsToSave | ContractFieldsToSave,
  ) {
    let output = `\nUnknown collision detected!`;
    output += `\n> Previous Collision Details: `;
    output += `\n\t- Migration Number: ${metadata.migrationNumber}`;
    output += `\n\t- Method Name: ${metadata.methodName || "N/A"}`;
    output += `\n\t- Contract Name: ${metadata.contractName || "N/A"}`;
    output += `\n> New Collision Details: `;
    output += `\n\t- Migration Number: ${dataToSave.metadata.migrationNumber}`;
    output += `\n\t- Method Name: ${dataToSave.metadata.methodName || "N/A"}`;
    output += `\n\t- Contract Name: ${dataToSave.metadata.contractName || "N/A"}`;

    const key = id(output);

    if (!this._warningsToPrint.has(key)) {
      console.log(output);
    }

    this._warningsToPrint.set(key, output);

    this._storage!.storeUnknownCollision(metadata, dataToSave);
  }

  public reportWarnings() {
    if (this.getWarningsCount() === 0) {
      return;
    }

    console.log("\nWarnings:");

    this._warningsToPrint.forEach((warning) => {
      console.log(warning);
    });

    console.log(
      "\n\nDue to the detected collision(s), there's a high likelihood that migration recovery using '--continue' may not function as expected.\n" +
        "To mitigate this, consider specifying a unique name for the contract during deployment.\n",
    );

    console.log("");
  }

  public getWarningsCount(): number {
    return this._warningsToPrint.size;
  }

  private _printContractCollision(output: string, oldData: ContractFieldsToSave, dataToSave: ContractFieldsToSave) {
    output += `\n> Contract: ${oldData.contractKeyData?.name || dataToSave.contractKeyData?.name}`;
    output += `\n> Previous Collision Details: `;
    output += `\n\t- Migration Number: ${oldData.metadata.migrationNumber}`;
    output += `\n\t- Contract Address: ${oldData.contractAddress}`;
    output += `\n> New Collision Details: `;
    output += `\n\t- Migration Number: ${dataToSave.metadata.migrationNumber}`;
    output += `\n\t- Contract Address: ${dataToSave.contractAddress}`;

    const key = id(`${oldData.contractAddress}-${dataToSave.contractAddress}`);

    if (!this._warningsToPrint.has(key)) {
      console.log(output);
    }

    this._warningsToPrint.set(key, output);

    this._storage!.storeContractCollision(oldData, dataToSave);
  }

  public async getExplorerUrl(): Promise<string> {
    const chainId = Number(this._network.chainId);

    const customChain = this._getInfoFromHardhatConfig(chainId);
    if (customChain) {
      return customChain.urls.browserURL;
    }

    if (
      predefinedChains[chainId] &&
      predefinedChains[chainId].explorers !== undefined &&
      predefinedChains[chainId].explorers.length > 0
    ) {
      return predefinedChains[chainId].explorers[0].url;
    }

    const chain = await this._getChainMetadataById(chainId);

    return chain.explorers[0].url;
  }

  public reportSuccessfulProxyLinking(proxyAddress: string, implementationAddress: string) {
    console.log(`Proxy ${proxyAddress} linked to implementation ${implementationAddress}`);

    this._storage!.storeSuccessfulProxyLinking(proxyAddress, implementationAddress);
  }

  public reportFailedProxyLinking(proxyAddress: string, implementationAddress: string, result: string) {
    console.log(`Failed to link proxy ${proxyAddress} to implementation ${implementationAddress}: ${result}`);

    this._storage!.storeFailedProxyLinking(proxyAddress, implementationAddress);
  }

  private _parseTransactionTitle(tx: TransactionResponse, instanceName: string): string {
    if (tx.to === null) {
      if (instanceName.split(":").length == 1) {
        return `Deploying ${instanceName}`;
      }

      return `Deploying${instanceName ? " " + instanceName.split(":")[1] : ""}`;
    }

    return `Transaction: ${instanceName}`;
  }

  private async _formatPendingTime(tx: TransactionResponse, startTime: number, blockStart: number): Promise<string> {
    if (this._spinnerMessage) {
      return this._spinnerMessage;
    }

    return `Confirmations: ${await tx.confirmations()}; Blocks: ${
      (await networkManager!.provider.getBlockNumber()) - blockStart
    }; Seconds: ${((Date.now() - startTime) / 1000).toFixed(0)}`;
  }

  private _getExplorerLink(txHash: string): string {
    try {
      return this._txExplorerUrl !== "" ? new URL(txHash, this._txExplorerUrl).toString() : `tx/${txHash}`;
    } catch {
      return `tx/${txHash}`;
    }
  }

  private _reportMigrationFiles(files: string[]) {
    console.log("\nMigration files:");

    files.forEach((file) => {
      console.log(`> ${file}`);
    });

    console.log("");

    this._storage!.storeMigrationFiles(files);
  }

  private _reportChainInfo() {
    console.log(`> ${"Network:".padEnd(20)} ${this._network.name}`);

    console.log(`> ${"Network id:".padEnd(20)} ${this._network.chainId}`);

    this._storage!.storeChainInfo({ network: this._network, explorer: this._explorerUrl });
  }

  private async _getNetwork(): Promise<Network> {
    try {
      return networkManager!.provider.getNetwork();
    } catch {
      return new Network("Local Ethereum", 1337);
    }
  }

  private async _getNativeSymbol(): Promise<string> {
    const chainId = Number(this._network.chainId);

    if (predefinedChains[chainId]) {
      return predefinedChains[chainId].nativeCurrency.symbol;
    }

    const chain = await this._getChainMetadataById(chainId);

    return chain.nativeCurrency.symbol;
  }

  private async _getChainMetadataById(chainId: number): Promise<ChainRecord> {
    let chain: ChainRecord;

    try {
      const chains = await this._tryGetAllRecords();

      chain = chains.find((chain) => chain.chainId === chainId) ?? predefinedChains[1337];
    } catch {
      chain = predefinedChains[1337];
    }

    if (chain.explorers === undefined || chain.explorers.length === 0) {
      chain.explorers = [
        {
          url: "",
          name: "",
        },
      ];
    }

    const hardhatChainInfo = this._getInfoFromHardhatConfig(chainId);

    if (hardhatChainInfo && chain.explorers.length > 0 && hardhatChainInfo.urls.browserURL !== chain.explorers[0].url) {
      chain.explorers[0].url = hardhatChainInfo.urls.browserURL;

      // Also we reset the Native Currency symbol as it may be different
      chain.nativeCurrency.symbol = predefinedChains[1337].nativeCurrency.symbol;
    }

    predefinedChains[chainId] = chain;

    return chain;
  }

  private _getInfoFromHardhatConfig(chainId: number): CustomChainRecord | undefined {
    let customChains: CustomChainRecord[] = [];

    if ((this._hre.config as any).etherscan && (this._hre.config as any).etherscan.customChains) {
      customChains = (this._hre.config as any).etherscan.customChains;
    }

    return customChains.find((chain) => chain.chainId === chainId);
  }

  private async _tryGetAllRecords(): Promise<ChainRecord[]> {
    const url = "https://chainid.network/chains.json";
    const response = await networkManager!.axios.get(url);

    // Assuming the JSON response is an array of record objects
    return response.data as ChainRecord[];
  }
}

export let Reporter: BaseReporter | null = null;

export async function createAndInitReporter(hre: HardhatRuntimeEnvironment) {
  if (Reporter) {
    return;
  }

  Reporter = new BaseReporter();

  await Reporter.init(hre);
}

/**
 * Used only in test environments to ensure test atomicity
 */
export function resetReporter() {
  Reporter = null;
}
