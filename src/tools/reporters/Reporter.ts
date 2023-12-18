/* eslint-disable no-console */
import ora from "ora";

import { Network, TransactionResponse, formatEther, formatUnits, TransactionReceipt, id } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { networkManager } from "../network/NetworkManager";

import { catchError, underline } from "../../utils";

import { MigrateConfig } from "../../types/migrations";
import { ChainRecord, CustomChainRecord, predefinedChains } from "../../types/verifier";
import { ContractFieldsToSave, MigrationMetadata, TransactionFieldsToSave } from "../../types/tools";

@catchError
class Reporter {
  private _hre: HardhatRuntimeEnvironment = {} as any;
  private _config: MigrateConfig = {} as any;
  private _network: Network = {} as any;

  private _isSpinnerActive: boolean = false;
  private _spinnerMessageIfActive: string | null = null;

  private _nativeSymbol: string = "";
  private _explorerUrl: string = "";

  private _warningsToPrint: Map<string, string> = new Map();

  public async init(hre: HardhatRuntimeEnvironment) {
    this._hre = hre;
    this._config = hre.config.migrate;

    this._network = await this._getNetwork();
    this._nativeSymbol = await this._getNativeSymbol();
    this._explorerUrl = (await this._getExplorerUrl()) + "/tx/";
  }

  public reportMigrationBegin(files: string[]) {
    this._reportMigrationFiles(files);

    this._reportChainInfo();

    console.log("\nStarting migration...\n");
  }

  public reportMigrationFileBegin(file: string) {
    console.log(`\n${underline(`Running ${file}...`)}`);
  }

  public async reportTransactionResponseHeader(tx: TransactionResponse, instanceName: string) {
    console.log("\n" + underline(this._parseTransactionTitle(tx, instanceName)));

    console.log(`> explorer: ${this._getExplorerLink(tx.hash)}`);
  }

  public async startTxReporting(tx: TransactionResponse) {
    const timeStart = Date.now();
    const blockStart = await networkManager!.provider.getBlockNumber();

    const formatPendingTimeTask = async () => this._formatPendingTime(tx, timeStart, blockStart);

    const spinner = ora(await formatPendingTimeTask()).start();

    const setSpinnerText = async () => {
      if (!this._isSpinnerActive) return;

      spinner.text = await formatPendingTimeTask();

      setTimeout(setSpinnerText, this._config.transactionStatusCheckInterval);
    };

    this._isSpinnerActive = true;

    await setSpinnerText();

    return spinner;
  }

  public stopTxReporting(spinner: ora.Ora) {
    this._isSpinnerActive = false;

    this._spinnerMessageIfActive = null;

    spinner.stop();
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

    output += `> value: ${this._castAmount((await receipt.getTransaction()).value, nativeSymbol)}\n`;

    output += `> balance: ${this._castAmount(await receipt.provider.getBalance(receipt.from), nativeSymbol)}\n`;

    output += `> gasUsed: ${receipt.gasUsed}\n`;

    output += `> gasPrice: ${this._castAmount(receipt.gasPrice, nativeSymbol)}\n`;

    output += `> fee: ${this._castAmount(receipt.fee, nativeSymbol)}\n`;

    console.log(output);
  }

  public summary(totalTransactions: bigint, totalCost: bigint) {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${totalTransactions}\n` +
      `> ${"Final cost:".padEnd(20)} ${this._castAmount(totalCost, this._nativeSymbol)}\n`;

    console.log(`\n${output}`);

    this.reportWarnings();
  }

  public notifyDeploymentInsteadOfRecovery(contractName: string): void {
    const output = `\nCan't recover contract address for ${contractName}. Deploying instead...`;

    console.log(output);
  }

  public notifyDeploymentOfMissingLibrary(libraryName: string): void {
    const output = `\nDeploying missing library ${libraryName}...`;

    console.log(output);
  }

  public notifyTransactionSendingInsteadOfRecovery(contractMethod: string): void {
    const output = `\nCan't recover transaction for ${contractMethod}. Sending instead...`;

    console.log(output);
  }

  public notifyContractRecovery(contractName: string, contractAddress: string): void {
    const output = `\nContract address for ${contractName} has been recovered: ${contractAddress}`;

    console.log(output);
  }

  public notifyTransactionRecovery(methodString: string): void {
    const output = `\nTransaction ${methodString} has been recovered.`;

    console.log(output);
  }

  public reportVerificationBatchBegin() {
    console.log("\nStarting verification of all deployed contracts");
  }

  public reportNothingToVerify() {
    console.log(`\nNothing to verify. Selected network is ${this._network.name}`);
  }

  public reportSuccessfulVerification(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verified successfully.`;

    console.log(output);
  }

  public reportAlreadyVerified(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) already verified.`;

    console.log(output);
  }

  public reportVerificationError(contractAddress: string, contractName: string, message: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verification failed: ${message}`;

    console.log(output);
  }

  public reportVerificationFailedToSave(contractName: string) {
    const output = `\nFailed to save verification arguments for contract: ${contractName}`;

    console.log(output);
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
  }

  public reportWarnings() {
    if (this._warningsToPrint.size === 0) {
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
  }

  public resetSpinnerMessageIfActive() {
    this._spinnerMessageIfActive = null;
  }

  public reportNetworkError(retry: number, fnName: string, error: Error) {
    if (this._isSpinnerActive) {
      this._spinnerMessageIfActive = `Network error in '${fnName}': Reconnect attempt ${retry}...`;

      return;
    }

    const prefix = `\nNetwork error in ${fnName}:\n`;
    const postfix = `\n${error.message}`;

    console.log(prefix + postfix);
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
    if (this._spinnerMessageIfActive) {
      return this._spinnerMessageIfActive;
    }

    return `Confirmations: ${await tx.confirmations()}; Blocks: ${
      (await networkManager!.provider.getBlockNumber()) - blockStart
    }; Seconds: ${((Date.now() - startTime) / 1000).toFixed(0)}`;
  }

  private _getExplorerLink(txHash: string): string {
    return this._explorerUrl + txHash;
  }

  private _castAmount(value: bigint, nativeSymbol: string): string {
    if (value > 0n && value < 10n ** 12n) {
      return this._toGWei(value) + " GWei";
    }

    return formatEther(value) + ` ${nativeSymbol}`;
  }

  private _toGWei(value: bigint): string {
    return formatUnits(value, "gwei");
  }

  private _reportMigrationFiles(files: string[]) {
    console.log("\nMigration files:");

    files.forEach((file) => {
      console.log(`> ${file}`);
    });

    console.log("");
  }

  private _reportChainInfo() {
    console.log(`> ${"Network:".padEnd(20)} ${this._network.name}`);

    console.log(`> ${"Network id:".padEnd(20)} ${this._network.chainId}`);
  }

  private async _getNetwork(): Promise<Network> {
    try {
      return networkManager!.provider.getNetwork();
    } catch {
      return new Network("Local Ethereum", 1337);
    }
  }

  private async _getExplorerUrl(): Promise<string> {
    const chainId = Number(this._network.chainId);

    if (predefinedChains[chainId]) {
      const explorers = predefinedChains[chainId].explorers;

      return !explorers || explorers.length === 0 ? "" : explorers[0].url;
    }

    const customChain = await this._tryGetInfoFromHardhatConfig(chainId);

    if (customChain) {
      return customChain.urls.browserURL;
    }

    const chain = await this._getChainMetadataById(chainId);

    return chain.explorers[0].url;
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
    try {
      const chains = await this._tryGetAllRecords();

      const chain = chains.find((chain) => chain.chainId === chainId);

      if (chain) {
        predefinedChains[chainId] = chain;

        return chain;
      }

      return predefinedChains[1337];
    } catch {
      return predefinedChains[1337];
    }
  }

  private async _tryGetInfoFromHardhatConfig(chainId: number): Promise<CustomChainRecord | undefined> {
    const customChains: CustomChainRecord[] = this._hre.config.etherscan.customChains || [];

    return customChains.find((chain) => chain.chainId === chainId);
  }

  private async _tryGetAllRecords(): Promise<ChainRecord[]> {
    const url = "https://chainid.network/chains.json";
    const response = await networkManager!.axios.get(url);

    // Assuming the JSON response is an array of record objects
    return response.data as ChainRecord[];
  }
}

export let reporter: Reporter | null = null;

export async function initReporter(hre: HardhatRuntimeEnvironment) {
  if (reporter) {
    return;
  }

  reporter = new Reporter();
  await reporter.init(hre);
}
