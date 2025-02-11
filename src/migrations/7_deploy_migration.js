const DoctorForm = artifacts.require("DoctorForm");

module.exports = function(deployer) {
  deployer.deploy(DoctorForm);
};