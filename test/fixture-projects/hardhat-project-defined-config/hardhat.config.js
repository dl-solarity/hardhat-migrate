require("../../../src");

module.exports = {
  migrate: {
    from: 1,
    to: 5,
    only: 2,
    skip: 1,
    verify: true,
    attempts: 2,
    wait: 2,
    pathToMigrations: "./deploy/",
    verifyConfig: {
      parallel: 4,
      attempts: 5,
    },
  },
};
