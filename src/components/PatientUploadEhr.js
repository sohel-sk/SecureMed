import React, { useState, useEffect } from "react";
import UploadEhr from "../build/contracts/UploadEhr.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import { create } from 'ipfs-http-client';
import { v4 as uuidv4 } from "uuid";
import "../CSS/PatientWritePermission.css";
import "../big_css/CreateEHR.css";
import NavBar_Logout from "./NavBar_Logout";

const ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });

const PatientUploadEhr = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [file, setFile] = useState(null);
  const fileInput = React.useRef(null);

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

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = UploadEhr.networks[networkId];
      if (!deployedNetwork) {
        throw new Error("Contract not deployed to this network");
      }
      if (!file) {
        alert("File not uploaded");
        return;
      }

      const report = await ipfs.add(file);
      const timestamp = Date().toString();

      const ehrContract = new web3.eth.Contract(
        UploadEhr.abi,
        deployedNetwork.address
      );
      await ehrContract.methods
        .addRecord(
          timestamp,
          report.path
        )
        .send({ from: patientDetails.walletAddress });
      setFile(null);
      fileInput.current.value = "";
      navigate("/patient/" + hhNumber);
    } catch (error) {
      console.error("EHR creation failed:", error);
    }
  };

  const cancelOperation = () => {
    navigate("/patient/" + hhNumber);
  };
  
  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-100 p-4 sm:p-10 font-mono text-gray-900 h-screen flex flex-col justify-center items-center">
        <div className="w-full max-w-6xl  p-24 rounded-lg shadow-lg flex flex-col justify-center items-center">
          <center>
            <form onSubmit={handleSubmit}>
            {patientDetails && (
            <div>  
              <h1 className="text-3xl sm:text-4xl font-bold mb-6">
                Upload your Past Records
              </h1>
            </div>
            )}
              <div className="mb-4 col-span-full">
                <input
                  type="file"
                  onChange={onFileChange}
                  ref={fileInput}
                  className="mt-2 p-2  bg-gray-100 border border-gray-600 rounded-md hover:bg-gray-200 transition duration-200"
                />
              </div>
              <div className="col-span-full">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
                >
                  Submit
                </button> 
                <button
                  onClick={cancelOperation}
                  className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
                >
                  Cancel
                </button>     
              </div>
            </form> 
          </center>
        </div>
      </div>
    </div>
  );
};

export default PatientUploadEhr;
