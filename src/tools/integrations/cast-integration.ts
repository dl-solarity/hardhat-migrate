import { exec } from "child_process";
import { promisify } from "util";

import { Transaction } from "ethers";

import { MigrateError } from "../../errors";

const execAsync = promisify(exec);

/**
 * Options for Cast wallet commands
 */
export interface CastWalletOptions {
  /** The sender account (e.g. address) */
  from?: string;
  /** Open an interactive prompt to enter your private key */
  interactive?: boolean;
  /** Use a provided raw private key */
  privateKey?: string;
  /** Use a mnemonic phrase (or path to one) */
  mnemonic?: string;
  /** Use a BIP39 passphrase for the mnemonic */
  mnemonicPassphrase?: string;
  /** The derivation path for the mnemonic */
  mnemonicDerivationPath?: string;
  /** The mnemonic index (default 0) */
  mnemonicIndex?: number;
  /** Use a keystore file or directory */
  keystore?: string;
  /** The account name (when using the default keystore directory) */
  account?: string;
  /** Keystore password */
  password?: string;
  /** File path to the keystore password */
  passwordFile?: string;
  /** Use a Ledger hardware wallet */
  ledger?: boolean;
  /** Use a Trezor hardware wallet */
  trezor?: boolean;
  /** Use AWS KMS */
  aws?: boolean;
  /** Log color: "auto", "always", or "never" */
  color?: "auto" | "always" | "never";
  /** Format log messages as JSON */
  json?: boolean;
  /** Suppress log messages */
  quiet?: boolean;
  /** Increase verbosity (repeat flag `-v` as needed) */
  verbosity?: number;
  /** Number of threads to use */
  threads?: number;
}

/**
 * Options specific to the sign command
 */
export interface CastSignOptions extends CastWalletOptions {
  /** Treat the message as JSON typed data */
  data?: boolean;
  /** When using typed data, treat the message as a file containing JSON */
  fromFile?: boolean;
  /** Do not hash the input; sign the provided 32-byte hash directly */
  noHash?: boolean;
}

export async function getCastVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync("cast -V");
    return stdout.trim();
  } catch (error: any) {
    throw new MigrateError(`Error executing cast -V: ${error.message}. Is cast installed?`);
  }
}

export async function getSignedTxViaCast(tx: Transaction, castOpts: CastSignOptions = {}): Promise<string> {
  tx.signature = await signMessage(tx.unsignedHash, {
    noHash: true,
    ...castOpts,
  });

  return tx.serialized;
}

function normalizeNameForEnv(name: string) {
  return `PASSWORD_${name.replace(/[-_]/g, "_").toUpperCase()}`;
}

/**
 * Get the Ethereum address associated with the Cast wallet configuration
 *
 * @param options Cast wallet options
 * @returns The Ethereum address
 */
export async function getCastWalletAddress(options: CastWalletOptions = {}): Promise<string> {
  const args = ["wallet", "address"];

  appendWalletOptions(args, options);

  const command = `cast ${args.join(" ")}`;

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && stderr.trim()) {
      console.error("cast stderr:", stderr);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new MigrateError(`Error getting address from Cast wallet: ${error.message}`);
  }
}

/**
 * Sign a message (or data/transaction hash) using Foundry's cast wallet sign command.
 *
 * @param message The message (or hash) to sign.
 * @param options Additional options mapping to cast's flags.
 * @returns The signature string from cast.
 */
export async function signMessage(message: string, options: CastSignOptions = {}): Promise<string> {
  const args = ["wallet", "sign"];

  // Process signing-specific flags
  if (options.data) args.push("--data");
  if (options.fromFile) args.push("--from-file");
  if (options.noHash) args.push("--no-hash");

  // Add wallet options
  appendWalletOptions(args, options);

  // Add the message to sign
  args.push(message);

  const command = `cast ${args.join(" ")}`;

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && stderr.trim()) {
      console.error("cast stderr:", stderr);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new MigrateError(`Error executing cast sign command: ${error.message}`);
  }
}

/**
 * Helper function to append common wallet options to a command args array
 */
function appendWalletOptions(args: string[], options: CastWalletOptions): void {
  if (options.account) {
    const possiblePassword = process.env[normalizeNameForEnv(options.account)];

    if (possiblePassword) {
      options.password = possiblePassword;
      delete options.passwordFile;
    }
  }

  if (options.from) {
    args.push("--from", options.from);
  }
  if (options.interactive) args.push("--interactive");
  if (options.privateKey) {
    args.push("--private-key", options.privateKey);
  }
  if (options.mnemonic) {
    args.push("--mnemonic", options.mnemonic);
  }
  if (options.mnemonicPassphrase) {
    args.push("--mnemonic-passphrase", options.mnemonicPassphrase);
  }
  if (options.mnemonicDerivationPath) {
    args.push("--mnemonic-derivation-path", options.mnemonicDerivationPath);
  }
  if (typeof options.mnemonicIndex === "number") {
    args.push("--mnemonic-index", options.mnemonicIndex.toString());
  }
  if (options.keystore) {
    args.push("--keystore", options.keystore);
  }
  if (options.account) {
    args.push("--account", options.account);
  }
  if (options.password) {
    args.push("--password", options.password);
  }
  if (options.passwordFile) {
    args.push("--password-file", options.passwordFile);
  }
  if (options.ledger) args.push("--ledger");
  if (options.trezor) args.push("--trezor");
  if (options.aws) args.push("--aws");
  if (options.color) {
    args.push("--color", options.color);
  }
  if (options.json) args.push("--json");
  if (options.quiet) args.push("--quiet");
  if (options.verbosity && options.verbosity > 0) {
    args.push("-" + "v".repeat(options.verbosity));
  }
  if (typeof options.threads === "number") {
    args.push("--threads", options.threads.toString());
  }
}
