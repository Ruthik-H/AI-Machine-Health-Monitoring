// frontend/src/pages/AddMachine.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";
import { Cpu, ChevronRight, Clipboard, CheckCircle } from "lucide-react";

export default function AddMachine() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Wizard Steps
  const [step, setStep] = useState(1);

  // Fields
  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("");
  const [deviceId, setDeviceId] = useState("");

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Wait for auth
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate("/login");
      else setUser(currentUser);
    });
  }, [navigate]);

  // Auto-generate device ID on step 2
  const generateDeviceId = () => {
    const id =
      "MACHINE-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setDeviceId(id);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!machineName || !machineType) return;
      setStep(2);
      generateDeviceId();
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      saveMachine();
    }
  };

  const saveMachine = async () => {
    if (!user) return;

    const path = `users/${user.uid}/machines/${deviceId}`;
    const devicePath = `devices/${deviceId}/meta`;

    // save to user's machines
    await set(ref(db, path), {
      machineName,
      machineType,
      deviceId,
      createdAt: Date.now(),
    });

    // create device in DB
    await set(ref(db, devicePath), {
      deviceId,
      machineName,
      machineType,
      createdAt: Date.now(),
      online: false,
    });

    navigate("/dashboard");
  };

  const copyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Add New Machine</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <p className={`text-sm font-semibold ${step >= 1 ? "text-indigo-600" : "text-gray-400"}`}>
            1. Machine Info
          </p>
          <p className={`text-sm font-semibold ${step >= 2 ? "text-indigo-600" : "text-gray-400"}`}>
            2. Device ID
          </p>
          <p className={`text-sm font-semibold ${step >= 3 ? "text-indigo-600" : "text-gray-400"}`}>
            3. Connect
          </p>
        </div>

        {/* STEP 1 — MACHINE INFO */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Machine Name
              </label>
              <input
                type="text"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                placeholder="e.g. CNC Machine A1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Machine Type
              </label>
              <select
                value={machineType}
                onChange={(e) => setMachineType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select Type</option>
                <option>3D Printer</option>
                <option>CNC</option>
                <option>Motor</option>
                <option>Pump</option>
                <option>Lathe</option>
                <option>Custom</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 2 — GENERATED DEVICE ID */}
        {step === 2 && (
          <div>
            <p className="text-gray-700 mb-4">
              This ID uniquely identifies your device. Copy it and paste it into
              your ESP32 code.
            </p>

            <div className="bg-gray-100 border rounded-lg p-4 flex items-center justify-between">
              <p className="font-mono text-lg font-semibold">{deviceId}</p>

              <button
                onClick={copyId}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Clipboard className="w-5 h-5" />
                )}
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Paste this inside your ESP32 file:
            </p>

            <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 mt-2">
{`#define DEVICE_ID "${deviceId}"`}
            </pre>
          </div>
        )}

        {/* STEP 3 — HOW TO CONNECT DEVICE */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-gray-800 text-lg mb-3">
              Connect Your ESP32
            </h2>

            <div className="text-gray-700 space-y-3">
              <p>1. Open your <strong>ESP32 code</strong> in VS Code / Arduino IDE.</p>
              <p>2. Paste your Device ID into the code:</p>

              <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4">
{`#define DEVICE_ID "${deviceId}"`}
              </pre>

              <p>3. Enter your WiFi name and password.</p>
              <p>4. Upload the code to the ESP32.</p>
              <p>5. Once the device connects, live data will appear on your dashboard.</p>
            </div>
          </div>
        )}

        {/* NEXT BUTTON */}
        <button
          onClick={handleNext}
          className="mt-8 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2"
        >
          {step < 3 ? "Next" : "Finish"}
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Back Button */}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-3 w-full py-2 text-indigo-600 font-semibold hover:underline"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
