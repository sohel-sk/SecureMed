const PatientRecords = artifacts.require("UploadEhr");
module.exports = function(deployer) {
  deployer.deploy(PatientRecords);
};