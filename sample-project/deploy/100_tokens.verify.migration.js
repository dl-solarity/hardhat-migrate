// First you have to import all the contracts and external libraries that you want to verify
const ERC20 = artifacts.require("ERC20Mock");
const TokenBalance = artifacts.require("TokenBalance");

// Verification tabel is needed to verify more than one contract in once.
const verificationTabel = [
  {
    instance: ERC20,
    address: "0xbf966abAA2691C42344fd6D6e907B5d43814a76B",
    args: ["Token1", "SWT1", 18],
  },
  {
    instance: TokenBalance,
    address: "0xCBa3Dba5CA9f46d484A231c888DF7d941e05C6ba",
    args: [],
  },
];

/**
 * This anonymous function is used by the verifier instance to perform a sequence of steps defined by the user.
 * @param verifier instance of the Verifier class that implements verification functionality.
 * @returns {Promise<void>} asynchronous function to perform the migration, which will be called by the plugin.
 */
module.exports = async (verifier) => {
  // To verify multiple instances at one, call next function.
  await verifier.batchVerify(verificationTabel);

  // The same operation, but using verify function for single contract
  // const tokenBalance = await TokenBalance.at("0xBfDf22f5b3Aba8Dec8492B02b1225BFAcef82C5B");
  // await verifier.verify(tokenBalance);
  //
  // const erc20 = await ERC20.at("0xd05e8e8c48BF56af13dfDE244dE19050FaCf9B35");
  // await verifier.verify(erc20, "Token1", "SWT1", 18);
};
