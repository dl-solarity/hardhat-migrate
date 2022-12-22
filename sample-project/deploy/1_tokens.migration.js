// First you have to import all the contracts and external libraries that you want to deploy
const ERC20 = artifacts.require("ERC20Mock");
const TokenBalance = artifacts.require("TokenBalance");

/**
 * This anonymous function is used by the deployer instance to perform a sequence of steps defined by the user.
 * @param deployer instance of the Deployer class that implements deployment and linking functionality.
 * @param logger instance of the Logger class that implements logging functionality.
 * @returns {Promise<void>} asynchronous function to perform the migration, which will be called by the plugin.
 */
module.exports = async (deployer, logger) => {
  // Firstly we need to deploy the external library
  const tokenBalance = await deployer.deploy(TokenBalance);
  // Secondly, link it to the contract metaclass that uses it
  await deployer.link(TokenBalance, ERC20);
  // Finally, deploy the token with the linked library.
  const token = await deployer.deploy(ERC20, "Token1", "SWT1", 18);

  // An example of the transaction that the user wants to execute exactly after deployment

  // Log the data about the transaction after its confirmation.
  logger.logTransaction(
    await token.mint(token.address, 100000000),
    `Mint token for itself`
  );

  // Log the contracts in an assembled table
  logger.logContracts(
    ["Token", token.address],
    ["TokenBalanceLib", tokenBalance.address]
  );
};
