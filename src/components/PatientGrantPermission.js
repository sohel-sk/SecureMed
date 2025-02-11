import React, { useState, useEffect } from "react";
import UploadEhr from "../build/contracts/UploadEhr.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "../CSS/PatientWritePermission.css";
import "../big_css/CreateEHR.css";
import NavBar_Logout from "./NavBar_Logout";


const PatientGrantPermission = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [doctorNumber, setDoctorNumber] = useState("");
  const [doctorNumberError, setDoctorNumberError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks[networkId];
          const patientContract = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork && deployedNetwork.address,
          );

          const result = await patientContract.methods.getPatientDetails(hhNumber).call();
          setPatientDetails(result);
        } else {
          console.log('Please install MetaMask extension');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    init();
  }, [hhNumber]);


  const handleGiveAccess = async (e) => {

    try {
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = DoctorRegistration.networks[networkId];
      if (!deployedNetwork) {
        throw new Error("Contract not deployed to this network");
      }

      const patientList = new web3.eth.Contract(
        DoctorRegistration.abi,
        deployedNetwork.address
      );

      const isdoctorRegistered = await patientList.methods.isRegisteredDoctor(doctorNumber).call();
      if (isdoctorRegistered)
      {
        const ispermissionGranted = await patientList.methods.isPermissionGranted(hhNumber, doctorNumber).call();
        if (!ispermissionGranted) {
          await patientList.methods
            .grantPermission(
              hhNumber,
              doctorNumber,
              patientDetails.name
            )
            .send({ from: patientDetails.walletAddress });
        } else {
          alert("Access is already given!");
          return;
        }
      }
      else
      {
        alert("Doctor does not exists!");
        return;
      }

      navigate("/patient/" + hhNumber);
    } catch (error) {
      console.error("EHR creation failed:", error);
    }

  };

  const handlehhNumberChange = (e) => {
    const inputhhNumber = e.target.value;
    const phoneRegex = /^\d{6}$/;
    if (phoneRegex.test(inputhhNumber)) {
      setDoctorNumber(inputhhNumber);
      setDoctorNumberError("");
    } else {
      setDoctorNumber(inputhhNumber);
      setDoctorNumberError("Please enter a 6-digit HH Number.");
    }
  };

  const cancelOperation = () => {
    navigate("/patient/" + hhNumber);
  };
  
  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-100 p-4 sm:p-10 font-mono text-gray-900 h-screen flex flex-col justify-center items-center">
        <div className="w-full max-w-6xl p-24 rounded-lg shadow-lg flex flex-col justify-center items-center">
          <form>
          <center>
            {patientDetails && (
            <div>  
              <h1 className="text-3xl sm:text-4xl font-bold mb-6">
                Grant View Permission to the Doctor
              </h1>
            </div>
              )}
            <br/>
          </center>
          <div className="flex flex-col w-full mb-4">
            <label className="mb-2 text-2xl font-bold">Doctor HH Number :</label>
              <input
              id="DNumber"
              name="DNumber"
              type="text"
              value={doctorNumber}
              placeholder="HH Number"
              onChange={handlehhNumberChange}
              className="p-2 w-full text-gray-900 bg-gray-100 border border-gray-600 rounded-md hover:bg-gray-200 transition duration-200"
              />
            {doctorNumberError && (
              <p className="text-red-500 text-sm mt-1">{doctorNumberError}</p>
            )}
            </div>
            <br/>
          <center>
              <div className="col-span-full">
                <button
                  type="button"
                  onClick={handleGiveAccess}
                  className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
                >
                  Give Access
                </button> 
                <button
                  onClick={cancelOperation}
                  className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
                >
                  Cancel
                </button>     
            </div>
            </center>
            </form> 
        </div>
      </div>
    </div>
  );
};

export default PatientGrantPermission;
