// File Location: frontend/src/pages/RegisterMachine.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterMachine() {
  const navigate = useNavigate();

  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("");
  const [deviceId, setDeviceId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Save machine info to localStorage (TEMP)
    // In next step we will move this to Firebase DB
    const machine = { machineName, machineType, deviceId };
    localStorage.setItem("machine-info", JSON.stringify(machine));

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Connect Your Machine
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Machine Name
            </label>
            <input
              type="text"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Ex: 3D Printer 01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Machine Type
            </label>
            <select
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              required
            >
              <option value="" disabled>Select a type</option>
              <option>3D Printer</option>
              <option>CNC Machine</option>
              <option>Lathe Machine</option>
              <option>Motor</option>
              <option>Pump</option>
              <option>Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Device ID (from ESP32 code)
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Ex: ESP32_ABC123"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold shadow-lg hover:opacity-90 transition"
          >
            Register Machine
          </button>
        </form>
      </div>
    </div>
  );
}
