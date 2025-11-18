// File Location: frontend/src/pages/MachineDetails.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, ArrowLeft } from "lucide-react";

export default function MachineDetails() {
  const navigate = useNavigate();
  const machine = JSON.parse(localStorage.getItem("machine-info"));

  if (!machine) return navigate("/register-machine");

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-blue-600 font-medium mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <HardDrive className="w-6 h-6 text-blue-500" />
          Machine Details
        </h2>

        <div className="grid sm:grid-cols-2 gap-6 text-gray-700">
          <p><strong>Name:</strong> {machine.machineName}</p>
          <p><strong>Type:</strong> {machine.machineType}</p>
          <p><strong>Device ID:</strong> {machine.deviceId}</p>
          <p><strong>Status:</strong> Running</p>
        </div>

        <button className="mt-6 px-5 py-3 bg-red-500 text-white rounded-lg shadow hover:bg-red-600">
          Remove Machine
        </button>
      </div>
    </div>
  );
}
