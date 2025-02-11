const DiagnosticForm = artifacts.require("DiagnosticForm");

module.exports = function(deployer) {
  deployer.deploy(DiagnosticForm);
};