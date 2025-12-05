import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, ArrowLeft, Code, X, CheckCircle } from "lucide-react";
import { db } from "../firebaseClient";
import { ref, onValue } from "firebase/database";
import ArduinoCodeGenerator from "../components/ArduinoCodeGenerator";
import { SENSOR_DEFINITIONS } from "../data/sensors";

export default function MachineDetails() {
  const navigate = useNavigate();
  const [showCode, setShowCode] = useState(false);
  const machine = JSON.parse(localStorage.getItem("machine-info"));

  if (!machine) return navigate("/dashboard");

  const [machineData, setMachineData] = useState(machine);

  useEffect(() => {
    if (!machine.deviceId) return;

    const deviceRef = ref(db, `devices/${machine.deviceId}/meta`);
    const unsub = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMachineData((prev) => ({ ...prev, ...data }));
      }
    });

    return () => unsub();
  }, [machine.deviceId]);

  const activeSensors = machineData.sensors
    ? Object.keys(machineData.sensors).filter(k => machineData.sensors[k] && SENSOR_DEFINITIONS[k])
    : [];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-blue-600 font-medium mb-6 hover:underline"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-500" />
            Machine Details
          </h2>
          <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Active
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 text-gray-700 mb-8 border-b border-gray-100 pb-8">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Machine Name</p>
            <p className="font-semibold text-lg text-gray-900">{machineData.machineName}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Machine Type</p>
            <p className="font-semibold text-lg text-gray-900">{machineData.machineType}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 col-span-2">
            <p className="text-sm text-gray-500 mb-1">Device ID</p>
            <p className="font-mono font-semibold text-lg text-gray-900 tracking-wider">{machineData.deviceId}</p>
          </div>
        </div>

        {/* Configured Sensors Section */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            Configured Sensors
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{activeSensors.length}</span>
          </h3>
          {activeSensors.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No sensors configured.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeSensors.map(key => {
                const s = SENSOR_DEFINITIONS[key];
                return (
                  <div key={key} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.label}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showCode ? (
          <div className="mt-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Arduino Code Configuration</h3>
              <button
                onClick={() => setShowCode(false)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                <X className="w-4 h-4" /> Close Generator
              </button>
            </div>
            <ArduinoCodeGenerator deviceId={machineData.deviceId} sensors={machineData.sensors} />
          </div>
        ) : (
          <div className="flex gap-4 mt-6 border-t pt-6">
            <button
              onClick={() => setShowCode(true)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
            >
              <Code className="w-5 h-5" />
              Get Device Code
            </button>

            <button className="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-colors font-medium">
              Remove Machine
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
