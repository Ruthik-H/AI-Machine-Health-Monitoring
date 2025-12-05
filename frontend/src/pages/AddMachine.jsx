import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";
import { Cpu, ChevronRight, Clipboard, CheckCircle, ArrowLeft, Search } from "lucide-react";
import ArduinoCodeGenerator from "../components/ArduinoCodeGenerator";
import { SENSOR_DEFINITIONS } from "../data/sensors";

export default function AddMachine() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Wizard Steps
  const [step, setStep] = useState(1);

  // Fields
  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("");
  const [deviceId, setDeviceId] = useState("");

  // Sensor Selection
  const [selectedSensors, setSelectedSensors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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
    const id = "MACHINE-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setDeviceId(id);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!machineName || !machineType) return;
      setStep(2);
    } else if (step === 2) {
      // Validate at least one sensor selected?
      const hasSensor = Object.values(selectedSensors).some((s) => s);
      if (!hasSensor) return alert("Please select at least one sensor.");
      setStep(3);
      generateDeviceId();
    } else if (step === 3) {
      // Save machine before showing code generator
      await saveMachine();
      setStep(4);
    } else if (step === 4) {
      navigate("/dashboard");
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
      sensors: selectedSensors,
      createdAt: Date.now(),
    });

    // create device in DB
    await set(ref(db, devicePath), {
      deviceId,
      machineName,
      machineType,
      createdAt: Date.now(),
      sensors: selectedSensors,
      online: false,
    });
  };

  const copyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Filter Sensors
  const filteredSensors = Object.values(SENSOR_DEFINITIONS).filter((s) => {
    const matchesSearch = s.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "environmental", "gas", "motion", "power", "liquid", "other"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Add New Machine</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>

          {["Info", "Sensors", "ID", "Code"].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step >= stepNum;
            const isCurrent = step === stepNum;
            return (
              <div key={label} className={`flex flex-col items-center gap-2 bg-white px-2 ${isActive ? "text-indigo-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isActive ? "border-indigo-600 bg-indigo-50" : "border-gray-300 bg-white"}`}>
                  {stepNum}
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? "text-gray-900" : ""}`}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* STEP 1 — MACHINE INFO */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Machine Name
              </label>
              <input
                type="text"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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

        {/* STEP 2 — SENSORS */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Select Sensors</h2>
              <p className="text-gray-500 text-sm">Choose from our library of industrial and IoT sensors.</p>
            </div>

            {/* SEARCH & FILTER */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sensors (e.g., Temperature, Current)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${activeCategory === cat
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* SENSOR GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-80 overflow-y-auto pr-2 custom-scrollbar">
              {filteredSensors.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-gray-500">
                  No sensors found matching "{searchQuery}"
                </div>
              ) : (
                filteredSensors.map((sensor) => (
                  <label
                    key={sensor.id}
                    className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all hover:shadow-md ${selectedSensors[sensor.id]
                      ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedSensors[sensor.id]}
                      onChange={() =>
                        setSelectedSensors((prev) => ({
                          ...prev,
                          [sensor.id]: !prev[sensor.id],
                        }))
                      }
                      className="mt-1 w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`font-semibold ${selectedSensors[sensor.id] ? "text-indigo-900" : "text-gray-800"}`}>
                          {sensor.label}
                        </p>
                        {selectedSensors[sensor.id] && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{sensor.category}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="text-right text-sm text-gray-500">
              {Object.values(selectedSensors).filter(Boolean).length} sensors selected
            </div>
          </div>
        )}

        {/* STEP 3 — GENERATED DEVICE ID */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <p className="text-gray-700 mb-4">
              This ID uniquely identifies your device. It will be automatically included in the generated code in the next step.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Device ID</p>
                <p className="font-mono text-xl font-bold text-gray-800 tracking-wide">{deviceId}</p>
              </div>

              <button
                onClick={copyId}
                className="p-2 bg-white border border-gray-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                title="Copy ID"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clipboard className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex gap-3 items-start">
              <div className="mt-0.5"><CheckCircle className="w-4 h-4" /></div>
              <p>Click <strong>Next</strong> to generate the Arduino code for this device automatically.</p>
            </div>
          </div>
        )}

        {/* STEP 4 — CODE GENERATOR */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <div className="mb-4">
              <h2 className="font-bold text-gray-900 text-lg">Get Your Device Code</h2>
              <p className="text-gray-600 text-sm">
                Enter your WiFi details below to generate the complete code for your ESP32.
              </p>
            </div>

            <ArduinoCodeGenerator deviceId={deviceId} sensors={selectedSensors} />

            <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
              <strong>Next Steps:</strong>
              <ol className="list-decimal ml-4 mt-2 space-y-1">
                <li>Download the code above.</li>
                <li>Open it in Arduino IDE.</li>
                <li>Connect your ESP32 via USB.</li>
                <li>Upload the code.</li>
              </ol>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="mt-8 flex gap-3">
          {step > 1 && step < 4 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            {step < 4 ? "Next" : "Go to Dashboard"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
