require("../../../../src");

module.exports = {
  migrate: {
    from: 1,
    to: 5,
    only: 2,
    skip: 1,
    verify: true,
    verificationAttempts: 2,
    confirmations: 5,
    pathToMigrations: "./deploy/",
    skipVerificationErrors: ["already verified"],
  },
};
