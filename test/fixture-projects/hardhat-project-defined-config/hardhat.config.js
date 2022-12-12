require("../../../src/index");

const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  solidity: {
    version: "0.5.15",
  },
  migrate: {
    from: 1,
    to: 5,
    only: 2,
    skip: [1, 2],
    verify: true,
    verificationAttempts: 2,
    confirmations: 5,
    pathToMigrations: "./deploy/",
    skipVerificationErrors: ["already verified"],
  },
};
