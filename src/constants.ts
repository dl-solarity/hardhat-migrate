export const pluginName = "@solarity/hardhat-migrate";
export const TASK_MIGRATE = "migrate";
export const TASK_MIGRATE_VERIFY = "migrate:verify";

export const SEND_NATIVE_TX_NAME = "send-native-tx";

export const UNKNOWN_CONTRACT_NAME = "unknown-contract";

export const UNKNOWN_TRANSACTION_NAME = "unknown-transaction";

/**
 * The slots used to determine whether a contract is a proxy.
 * If a slot is not empty, the verifier will attempt to link the proxy
 * to an implementation address retrieved from the slot.
 */
export const DEFAULT_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const BEACON_IMPLEMENTATION_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
