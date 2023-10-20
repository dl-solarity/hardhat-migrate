require("../../../src");

module.exports = {
  migrate: {
    from: 1,
    to: 5,
    only: 2,
    skip: 1,
    verify: true,
    attempts: 2,
    txConfirmations: 2,
    verifyConfirmations: 5,
    pathToMigrations: "./deploy/",
    skipVerificationErrors: ["already verified"],
  },
};
