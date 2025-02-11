import React, { useState, useEffect } from "react";
import DiagnosticForm from "../build/contracts/DiagnosticForm.json";
import UploadEhr from "../build/contracts/UploadEhr.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "../big_css/CreateEHR.css";
import { create } from 'ipfs-http-client';
import NavBar_Logout from "./NavBar_Logout";

const ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });

const DiagnosticUpload = () => {
  const navigate = useNavigate();
  const { hhNumber } = useParams();
  const [web3Instance, setWeb3Instance] = useState(null);
  const [recId, setRecId] = useState("EHR" + uuidv4());
  const [formData, setFormData] = useState({
    patientName: "",
    doctorName: "",
    patientAddress: "",
    diagnosticAddress: "",
    age: "",
    gender: "",
    bg: ""
  });

  const [errors, setErrors] = useState({
    patientName: "",
    doctorName: "",
    patientAddress: "",
    diagnosticAddress: "",
    age: "",
    gender: "",
    bg: "",
    file: ""
  });

  const [file, setFile] = useState(null);
  const [cid, setCid] = useState(null);
  const [retrievedFileURL, setRetrievedFileURL] = useState(null);
  const fileInput = React.useRef(null);

  useEffect(() => {
    connectToMetaMask();
  }, []);

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
    setErrors((prevErrors) => ({
      ...prevErrors,
      file: ""
    }));
  };

  const connectToMetaMask = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.enable();
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
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let formValid = true;
    const newErrors = { ...errors };

    if (formData.patientName.trim() === "") {
      newErrors.patientName = "Patient Name is required";
      formValid = false;
    }
    if (formData.doctorName.trim() === "") {
      newErrors.doctorName = "Doctor Name is required";
      formValid = false;
    }
    if (formData.patientAddress.trim() === "") {
      newErrors.patientAddress = "Patient Address is required";
      formValid = false;
    }
    if (formData.diagnosticAddress.trim() === "") {
      newErrors.diagnosticAddress = "Diagnostic Address is required";
      formValid = false;
    }
    if (formData.age.trim() === "") {
      newErrors.age = "Age is required";
      formValid = false;
    }
    if (formData.gender.trim() === "") {
      newErrors.gender = "Gender is required";
      formValid = false;
    }
    if (formData.bg.trim() === "") {
      newErrors.bg = "Blood Group is required";
      formValid = false;
    }
    if (!file) {
      newErrors.file = "File upload is required";
      formValid = false;
    }

    setErrors(newErrors);

    if (formValid) {
      try {
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = DiagnosticForm.networks[networkId];
        if (!deployedNetwork) {
          throw new Error("Contract not deployed to this network");
        }

        const report = await ipfs.add(file);

        setCid(report.path);
        alert("File uploaded successfully with CID: " + report.path);

        const contract = new web3Instance.eth.Contract(
          DiagnosticForm.abi,
          deployedNetwork.address
        );
        await contract.methods
          .createEHR(
            recId,
            formData.doctorName,
            formData.patientName,
            parseInt(formData.age),
            formData.gender,
            formData.bg,
            formData.diagnosticAddress,
            formData.patientAddress,
            report.path
          )
          .send({ from: formData.diagnosticAddress });

        alert("EHR created successfully.");
        const newRecId = "EHR" + uuidv4();
        setRecId(newRecId);
      } catch (error) {
        console.error("EHR creation failed:", error);
      }
    }
  };

  const cancelOperation = async () => {
    try {
      navigate("/diagnostic/" + hhNumber);
    } catch (error) {
      console.error("Error checking permission:", error);
    }
  };

  const uploadEhr = async (e) => {
    e.preventDefault();
    try {
      const networkId = await web3Instance.eth.net.getId();
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

      const ehrContract = new web3Instance.eth.Contract(
        UploadEhr.abi,
        deployedNetwork.address
      );
      await ehrContract.methods
        .addRecord(
          timestamp,
          report.path
        )
        .send({ from: formData.patientAddress });
      setFile(null);
      fileInput.current.value = "";
      navigate("/diagnostic/" + hhNumber);
    } catch (error) {
      console.error("EHR creation failed:", error);
    }
  };

  return (
    <div>
      <NavBar_Logout></NavBar_Logout>
      <div className="createehr min-h-screen flex items-center justify-center p-4 bg-gray-100 font-mono text-gray-900">
        <div className="w-full max-w-2xl">
          <h2 className="text-3xl  mb-6 font-bold text-center">
            Create Lab Report
          </h2>
          <form
            className="bg-gray-100 p-6 rounded-lg shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="block  " htmlFor="recordId">
                Record Id :
              </label>
              <span className="mt-2 p-2   font-bold">{recId}</span>
            </div>

            <div className="mb-4">
              <label className="block font-bold  " htmlFor="doctorName">
                Doctor Name:
              </label>
              <input
                type="text"
                id="doctorName"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              />
              {errors.doctorName && (
                <p className="text-red-500">{errors.doctorName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold  " htmlFor="patientName">
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
              <label className="block font-bold  " htmlFor="age">
                Age:
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              />
              {errors.age && (
                <p className="text-red-500">{errors.age}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold  " htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500">{errors.gender}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold  " htmlFor="bg">
                Blood Group
              </label>
              <select
                id="bg"
                name="bg"
                value={formData.bg}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              {errors.bg && (
                <p className="text-red-500">{errors.bg}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                className="block font-bold  "
                htmlFor="patientAddress"
              >
                Patient Wallet Address:
              </label>
              <input
                type="text"
                id="patientAddress"
                name="patientAddress"
                value={formData.patientAddress}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              />
              {errors.patientAddress && (
                <p className="text-red-500">{errors.patientAddress}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                className="block font-bold  "
                htmlFor="diagnosticAddress"
              >
                Diagnostic Wallet Address:
              </label>
              <input
                type="text"
                id="diagnosticAddress"
                name="diagnosticAddress"
                value={formData.diagnosticAddress}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              />
              {errors.diagnosticAddress && (
                <p className="text-red-500">{errors.diagnosticAddress}</p>
              )}
            </div>

            <div className="mb-4 col-span-full">
              <h2 className=" ">Upload Final Report</h2>
              <input
                type="file"
                onChange={onFileChange}
                ref={fileInput}
                className="mt-2 p-2   bg-gray-100 border border-gray-600 rounded-md  hover:bg-gray-200 transition duration-200"
              />
              {errors.file && (
                <p className="text-red-500">{errors.file}</p>
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
                <button
                  onClick={uploadEhr}
                  className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
                >
                  Upload Report
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

export default DiagnosticUpload;
