/* eslint-disable no-console */
import ora from "ora";
import axios from "axios";

import { Network, TransactionReceipt, TransactionResponse, formatEther, formatUnits } from "ethers";

import { Provider } from "../Provider";

import { MigrateError } from "../../errors";

import { catchError, underline } from "../../utils";

import { MigrateConfig } from "../../types/migrations";
import { ChainRecord, predefinedChains } from "../../types/verifier";
import { ContractFieldsToSave, MigrationMetadata, TransactionFieldsToSave } from "../../types/tools";

@catchError
export class Reporter {
  private static _config: MigrateConfig;
  private static _network: Network;
  private static _nativeSymbol: string;
  private static _explorerUrl: string;

  private static totalCost: bigint = 0n;
  private static totalTransactions: number = 0;

  private static _warningsToPrint: string[] = [];

  public static async init(config: MigrateConfig) {
    this._config = config;

    this._network = await this._getNetwork();

    this._nativeSymbol = await this._getNativeSymbol();
    this._explorerUrl = (await this._getExplorerUrl()) + "/tx/";
  }

  public static reportMigrationBegin(files: string[]) {
    this._reportMigrationFiles(files);

    this._reportChainInfo();

    console.log("\nStarting migration...\n");
  }

  public static reportMigrationFileBegin(file: string) {
    console.log(`\n${underline(`Running ${file}...`)}`);
  }

  public static summary() {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${this.totalTransactions}\n` +
      `> ${"Final cost:".padEnd(20)} ${this.castAmount(this.totalCost, this._nativeSymbol)}\n`;

    console.log(`\n${output}`);

    this.reportWarnings();
  }

  public static async reportTransactionByHash(txHash: string, instanceName: string) {
    const tx = await Provider.provider.getTransaction(txHash);

    if (!tx) {
      throw new MigrateError("Transaction not found.");
    }

    await this.reportTransaction(tx, instanceName);
  }

  public static async reportTransaction(tx: TransactionResponse, instanceName: string) {
    const timeStart = Date.now();
    const blockStart = await Provider.provider.getBlockNumber();

    console.log("\n" + underline(this._parseTransactionTitle(tx, instanceName)));

    console.log(`> explorer: ${this._getExplorerLink(tx.hash)}`);

    const formatPendingTimeTask = async () => this._formatPendingTime(tx, timeStart, blockStart);

    const spinner = ora(await formatPendingTimeTask()).start();

    // TODO: make 1000 configurable
    const spinnerInterval = setInterval(async () => (spinner.text = await formatPendingTimeTask()), 1000);

    let receipt: TransactionReceipt;
    try {
      // We will wait for both contract deployment and common transactions
      receipt = (await tx.wait(this._config.wait))!;
    } catch (e: any) {
      throw new MigrateError(`Transaction failed: ${e.message}`);
    } finally {
      clearInterval(spinnerInterval);

      spinner.stop();
    }

    await this._printTransaction(receipt);

    this.totalCost += receipt.fee + tx.value ?? 0n;
    this.totalTransactions++;
  }

  public static notifyDeploymentInsteadOfRecovery(contractName: string): void {
    const output = `\nCan't recover contract address for ${contractName}. Deploying instead...`;

    console.log(output);
  }

  public static notifyDeploymentOfMissingLibrary(libraryName: string): void {
    const output = `\nDeploying missing library ${libraryName}...`;

    console.log(output);
  }

  public static notifyTransactionSendingInsteadOfRecovery(contractMethod: string): void {
    const output = `\nCan't recover transaction for ${contractMethod}. Sending instead...`;

    console.log(output);
  }

  public static notifyContractRecovery(contractName: string, contractAddress: string): void {
    const output = `\nContract address for ${contractName} has been recovered: ${contractAddress}`;

    console.log(output);
  }

  public static notifyTransactionRecovery(methodString: string): void {
    const output = `\nTransaction ${methodString} has been recovered.`;

    console.log(output);
  }

  public static reportVerificationBatchBegin() {
    console.log("\nStarting verification of all deployed contracts");
  }

  public static reportNothingToVerify() {
    console.log(`\nNothing to verify. Selected network is ${this._network.name}`);
  }

  public static reportSuccessfulVerification(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verified successfully.`;

    console.log(output);
  }

  public static reportAlreadyVerified(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) already verified.`;

    console.log(output);
  }

  public static reportVerificationError(contractAddress: string, contractName: string, message: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verification failed: ${message}`;

    console.log(output);
  }

  public static reportVerificationFailedToSave(contractName: string) {
    const output = `\nFailed to save verification arguments for contract: ${contractName}`;

    console.log(output);
  }

  public static notifyContractCollision(oldData: ContractFieldsToSave, dataToSave: ContractFieldsToSave) {
    let output = `\nContract collision detected!`;
    output += `\n> Contract: ${oldData.contractName || dataToSave.contractName}`;
    output += `\n> Previous Collision Details: `;
    output += `\n\t- Migration Number: ${oldData.metadata.migrationNumber}`;
    output += `\n\t- Contract Address: ${oldData.contractAddress}`;
    output += `\n> New Collision Details: `;
    output += `\n\t- Migration Number: ${dataToSave.metadata.migrationNumber}`;
    output += `\n\t- Contract Address: ${dataToSave.contractAddress}`;

    console.log(output);

    this._warningsToPrint.push(output);
  }

  public static notifyTransactionCollision(oldData: TransactionFieldsToSave, dataToSave: TransactionFieldsToSave) {
    let output = `\nTransaction collision detected!`;
    output += `\n> Previous Collision Details: `;
    output += `\n\t- Migration Number: ${oldData.metadata.migrationNumber}`;
    output += `\n\t- Method Name: ${oldData.metadata.methodName || "N/A"}`;
    output += `\n> New Collision Details: `;
    output += `\n\t- Migration Number: ${dataToSave.metadata.migrationNumber}`;
    output += `\n\t- Method Name: ${dataToSave.metadata.methodName || "N/A"}`;

    console.log(output);

    this._warningsToPrint.push(output);
  }

  public static notifyUnknownCollision(
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

    console.log(output);

    this._warningsToPrint.push(output);
  }

  public static reportContracts(...contracts: [string, string][]): void {
    const table: { Contract: string; Address: string }[] = contracts.map(([contract, address]) => ({
      Contract: contract,
      Address: address,
    }));
    console.log();
    console.table(table);
    console.log();
  }

  public static reportWarnings() {
    if (this._warningsToPrint.length === 0) {
      return;
    }

    console.log("\nWarnings:");

    this._warningsToPrint.forEach((warning) => {
      console.log(warning);
    });

    console.log(
      "\n\nDue to the detected collision, there's a high likelihood that migration recovery using '--continue' may not function as expected.\n" +
        "To mitigate this, consider specifying a unique name for the contract during deployment.\n" +
        "Example:\n" +
        'await deployer.deploy(ERC1967Proxy, [contractsRegistry.address, "0x"], { name: "ERC1967Proxy" });\n' +
        "                                                                        ----------------------     \n",
    );

    console.log("");
  }

  private static _parseTransactionTitle(tx: TransactionResponse, instanceName: string): string {
    if (tx.to === null) {
      if (instanceName.split(":").length == 1) {
        return `Deploying ${instanceName}`;
      }

      return `Deploying${instanceName ? " " + instanceName.split(":")[1] : ""}`;
    }

    return `Transaction: ${instanceName}`;
  }

  private static async _formatPendingTime(
    tx: TransactionResponse,
    startTime: number,
    blockStart: number,
  ): Promise<string> {
    return `Confirmations: ${await tx.confirmations()}; Blocks: ${
      (await Provider.provider.getBlockNumber()) - blockStart
    }; Seconds: ${((Date.now() - startTime) / 1000).toFixed(0)}`;
  }

  private static _getExplorerLink(txHash: string): string {
    return this._explorerUrl + txHash;
  }

  private static async _printTransaction(tx: TransactionReceipt) {
    let output = "";

    if (tx.contractAddress) {
      output += `> contractAddress: ${tx.contractAddress}\n`;
    }

    const nativeSymbol = this._nativeSymbol;

    output += `> blockNumber: ${tx.blockNumber}\n`;

    output += `> blockTimestamp: ${(await tx.getBlock()).timestamp}\n`;

    output += `> account: ${tx.from}\n`;

    output += `> value: ${this.castAmount((await tx.getTransaction()).value, nativeSymbol)}\n`;

    output += `> balance: ${this.castAmount(await tx.provider.getBalance(tx.from), nativeSymbol)}\n`;

    output += `> gasUsed: ${tx.gasUsed}\n`;

    output += `> gasPrice: ${this.castAmount(tx.gasPrice, nativeSymbol)}\n`;

    output += `> fee: ${this.castAmount(tx.fee, nativeSymbol)}\n`;

    console.log(output);
  }

  public static castAmount(value: bigint, nativeSymbol: string): string {
    if (value > 0n && value < 10n ** 12n) {
      return this._toGWei(value) + " GWei";
    }

    return formatEther(value) + ` ${nativeSymbol}`;
  }

  private static _toGWei(value: bigint): string {
    return formatUnits(value, "gwei");
  }

  private static _reportMigrationFiles(files: string[]) {
    console.log("\nMigration files:");

    files.forEach((file) => {
      console.log(`> ${file}`);
    });

    console.log("");
  }

  private static _reportChainInfo() {
    console.log(`> ${"Network:".padEnd(20)} ${this._network.name}`);

    console.log(`> ${"Network id:".padEnd(20)} ${this._network.chainId}`);
  }

  private static async _getNetwork(): Promise<Network> {
    try {
      return Provider.provider.getNetwork();
    } catch {
      return new Network("Local Ethereum", 1337);
    }
  }

  private static async _getExplorerUrl(): Promise<string> {
    const chainId = Number(this._network.chainId);

    if (predefinedChains[chainId]) {
      const explorers = predefinedChains[chainId].explorers;

      return !explorers || explorers.length === 0 ? "" : explorers[0].url;
    }

    const chain = await this._getChainMetadataById(chainId);

    return chain.explorers[0].url;
  }

  private static async _getNativeSymbol(): Promise<string> {
    const chainId = Number(this._network.chainId);

    if (predefinedChains[chainId]) {
      return predefinedChains[chainId].nativeCurrency.symbol;
    }

    const chain = await this._getChainMetadataById(chainId);

    return chain.nativeCurrency.symbol;
  }

  private static async _getChainMetadataById(chainId: number): Promise<ChainRecord> {
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

  private static async _tryGetAllRecords(): Promise<ChainRecord[]> {
    const url = "https://chainid.network/chains.json";
    const response = await axios.get(url);

    // Assuming the JSON response is an array of record objects
    return response.data as ChainRecord[];
  }
}
