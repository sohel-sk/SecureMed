import React, { useState, useEffect } from "react";
import DoctorForm from "../build/contracts/DoctorForm.json"; // Adjust the path as needed
import UploadEhr from "../build/contracts/UploadEhr.json";
import Web3 from "web3"; // Import Web3 here
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "../big_css/CreateEHR.css";
import { create } from 'ipfs-http-client';
import NavBar_Logout from "./NavBar_Logout";

const ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });

const DoctorConsultancy = () => {
  const navigate = useNavigate();
  const { hhNumber } = useParams(); // Retrieve account address from URL
  const [web3Instance, setWeb3Instance] = useState(null);
  const [recId, setRecId] = useState("EHR" + uuidv4());
  const [formData, setFormData] = useState({
    patientName: "",
    doctorAddress: "",
    gender: "",
    diagnosis: "",
    prescription: "",
  });
  const [errors, setErrors] = useState({
    patientName: "",
    doctorAddress: "",
    gender: "",
    diagnosis: "",
    prescription: "",
  });

  useEffect(() => {
    connectToMetaMask();
  }, []);

  const connectToMetaMask = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.enable(); // Request account access
        setWeb3Instance(web3Instance);
      } else {
        console.error("MetaMask not detected. Please install MetaMask.");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error message when user starts typing
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate form fields
    let formValid = true;
    const newErrors = { ...errors };

    if (formData.patientName.trim() === "") {
      newErrors.patientName = "Patient Name is required";
      formValid = false;
    }
    if (formData.doctorAddress.trim() === "") {
      newErrors.doctorAddress = "Doctor Address is required";
      formValid = false;
    }
    if (formData.gender.trim() === "") {
      newErrors.gender = "Gender is required";
      formValid = false;
    }
    if (formData.diagnosis.trim() === "") {
      newErrors.diagnosis = "Diagnosis is required";
      formValid = false;
    }
    if (formData.prescription.trim() === "") {
      newErrors.prescription = "Prescription is required";
      formValid = false;
    }

    setErrors(newErrors);

    if (formValid) {
      try {
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = DoctorForm.networks[networkId];
        if (!deployedNetwork) {
          throw new Error("Contract not deployed to this network");
        }

        const accounts = await web3Instance.eth.getAccounts();
        const contract = new web3Instance.eth.Contract(
          DoctorForm.abi,
          deployedNetwork.address
        );
        await contract.methods
          .createEHR(
            recId,
            formData.patientName,
            formData.doctorAddress,
            formData.gender,
            formData.diagnosis,
            formData.prescription
          )
          .send({ from: formData.doctorAddress });

        console.log("EHR created successfully.");
        // Reset the form fields
        setFormData({
          patientName: "",
          doctorAddress: "",
          gender: "",
          diagnosis: "",
          prescription: "",
        });
        const newRecId = "EHR" + uuidv4();
        setRecId(newRecId);
        navigate(-1);
      } catch (error) {
        console.error("EHR creation failed:", error);
      }
    }
  };

  const cancelOperation = async () => {
    try {
      navigate(-1);
    } catch (error) {
      console.error("Error checking permission:", error);
    }
  };

  return (
    <div>
      <NavBar_Logout></NavBar_Logout>
      <div className="createehr min-h-screen flex items-center justify-center p-4 bg-gray-100 font-mono text-gray-900">
        <div className="w-full max-w-2xl">
          <h2 className="text-3xl  mb-6 font-bold text-center">
            Consultancy
          </h2>
          <form
            className="bg-gray-100 p-6 rounded-lg shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="block " htmlFor="recordId">
                Record Id :
              </label>
              <span className="mt-2 p-2  font-bold">{recId}</span>
            </div>

            <div className="mb-4">
              <label className="block font-bold " htmlFor="patientName">
                Patient Name:
              </label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              />
              {errors.patientName && (
                <p className="text-red-500">{errors.patientName}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                className="block font-bold  "
                htmlFor="doctorAddress"
              >
                Doctor Wallet Address:
              </label>
              <input
                type="text"
                id="doctorAddress"
                name="doctorAddress"
                value={formData.doctorAddress}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              />
              {errors.doctorAddress && (
                <p className="text-red-500">{errors.doctorAddress}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold  " htmlFor="gender">
                Gender:
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              >
                <option value="">Select Gender</option>
                <option value="male">Male

                </option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
              {errors.gender && (
                <p className="text-red-500">{errors.gender}</p>
              )}
            </div>
            <div className="mb-4">
          <label className="block font-bold  " htmlFor="diagnosis">
            Diagnosis:
          </label>
          <textarea
            type="textarea"
            id="diagnosis"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleInputChange}
            className="mt-2 p-2 w-full   h-24 bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
          ></textarea>
          {errors.diagnosis && (
            <p className="text-red-500">{errors.diagnosis}</p>
          )}
        </div>

        <div className="mb-4">
          <label
            className="block font-bold  "
            htmlFor="prescription"
          >
            Prescription:
          </label>
          <textarea
            type="text"
            id="prescription"
            name="prescription"
            value={formData.prescription}
            onChange={handleInputChange}
            className="mt-2 p-2 w-full h-24   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
          ></textarea>
          {errors.prescription && (
            <p className="text-red-500">{errors.prescription}</p>
          )}
        </div>

        <div className="col-span-full">
          <center>
            <button
              type="submit"
              className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
            >
              Create Record
            </button>
          </center>
        </div>
      </form>
      <center>
        <button
          onClick={cancelOperation}
          className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
        >
          Cancel
        </button>
      </center>
    </div>
  </div>
</div>
);
};

export default DoctorConsultancy;