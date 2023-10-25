require("../../../src");

module.exports = {
  migrate: {
    wait: 0,
    pathToMigrations: "/deploy",
    verifyConfig: {
      parallel: 0,
      attempts: 0,
    },
  },
};
