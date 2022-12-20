// First you have to import all the contracts and external libraries that you want to deploy
const ERC20 = artifacts.require("ERC20Mock");
const TokenBalance = artifacts.require("TokenBalance");

// logTransaction - logs data about the transaction after its confirmation.
// logContracts - function for outputting contract addresses at the end of migration.
const { logTransaction, logContracts } = require("../../dist/src");

/**
 * This anonymous function is used by the deployer instance to perform a sequence of steps.
 * defined by the user.
 * @param deployer instance of the Deployer class that implements deployment and linking functionality.
 * @returns {Promise<void>} asynchronous function to perform the migration, which will be done in Deployer.
 */
module.exports = async (deployer) => {
  // First we need to deploy the external library
  await deployer.deploy(TokenBalance);
  // Second, link it to the contract metaclass that uses it
  await deployer.link(TokenBalance, ERC20);
  // Finally, you can deploy the token with the linked library.
  const token = await deployer.deploy(ERC20, "Token1", "SWT1", 18);

  // An example of the transaction that the user wants to execute exactly after deployment
  logTransaction(
    await token.mint(token.address, 100000000),
    `Mint token for itself`
  );

  logContracts(["Token", token.address]);
};
