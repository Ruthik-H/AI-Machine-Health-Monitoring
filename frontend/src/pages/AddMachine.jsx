// frontend/src/pages/AddMachine.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clipboard, CheckCircle, ArrowLeft, Search, PenTool, Database, Wifi } from "lucide-react";
import ArduinoCodeGenerator from "../components/ArduinoCodeGenerator";
import { SENSOR_DEFINITIONS } from "../data/sensors";

export default function AddMachine() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);

  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("");
  const [deviceId, setDeviceId] = useState("");

  const [selectedSensors, setSelectedSensors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate("/login");
      else setUser(currentUser);
    });
  }, [navigate]);

  const generateDeviceId = () => {
    const id = "MACHINE-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setDeviceId(id);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!machineName || !machineType) return;
      setStep(2);
    } else if (step === 2) {
      const hasSensor = Object.values(selectedSensors).some((s) => s);
      if (!hasSensor) return alert("Please select at least one sensor.");
      setStep(3);
      generateDeviceId();
    } else if (step === 3) {
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
    const payload = { machineName, machineType, deviceId, sensors: selectedSensors, createdAt: Date.now() };

    await set(ref(db, path), payload);
    await set(ref(db, devicePath), { ...payload, online: false });
  };

  const copyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const filteredSensors = Object.values(SENSOR_DEFINITIONS).filter((s) => {
    const matchesSearch = s.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "environmental", "gas", "motion", "power", "liquid", "other"];

  return (
    <div className="w-full max-w-4xl mx-auto py-6 animate-fade-in text-slate-800">

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Add New Device</h1>
        <p className="text-slate-500 mt-2">Configure and register a new machine instance</p>
      </div>

      <div className="pro-card p-0 overflow-hidden bg-white shadow-lg">

        {/* PROGRESS HEADER */}
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <div className="flex items-center justify-between px-10 relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-0 -translate-y-1/2 mx-10"></div>
            {["Basic Info", "Sensors", "Identity", "Firmware"].map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step >= stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={label} className="relative z-10 flex flex-col items-center gap-2 bg-slate-50 px-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                    {isActive && !isCurrent ? <CheckCircle className="w-5 h-5" /> : stepNum}
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-10 min-h-[400px]">
          <AnimatePresence mode="wait">

            {/* STEP 1: INFO */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-lg mx-auto py-8">
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Machine Name</label>
                    <input
                      autoFocus
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                      placeholder="e.g. CNC Lathe 04"
                      value={machineName} onChange={e => setMachineName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Machine Type</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg appearance-none"
                      value={machineType} onChange={e => setMachineType(e.target.value)}
                    >
                      <option value="">Select Category...</option>
                      <option>CNC Machine</option>
                      <option>3D Printer</option>
                      <option>Industrial Motor</option>
                      <option>Hydraulic Pump</option>
                      <option>Environment Sensor</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SENSORS */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex justify-between items-center mb-6">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    {categories.slice(0, 4).map(c => (
                      <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1 text-xs font-semibold rounded-full border ${activeCategory === c ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                        {c.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto p-1 custom-scrollbar">
                  {filteredSensors.map(s => (
                    <label key={s.id} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${selectedSensors[s.id] ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:border-blue-300 border-slate-200'
                      }`}>
                      <input type="checkbox" className="mt-1 mr-3 w-4 h-4 accent-blue-600" checked={!!selectedSensors[s.id]} onChange={() => setSelectedSensors(prev => ({ ...prev, [s.id]: !prev[s.id] }))} />
                      <div>
                        <div className="font-bold text-slate-800">{s.label}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">{s.category}</div>
                      </div>
                    </label>
                  ))}
                  {filteredSensors.length === 0 && <div className="col-span-3 text-center py-10 text-slate-400">No sensors found</div>}
                </div>
              </motion.div>
            )}

            {/* STEP 3: ID */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center py-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <Database className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Device Registered</h2>
                <p className="text-slate-500 mb-8 max-w-sm text-center">Your device has been allocated a unique ID in the database.</p>

                <div className="bg-slate-900 text-white rounded-xl p-8 text-center w-full max-w-md shadow-2xl">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">UNIQUE DEVICE IDENTIFIER</p>
                  <p className="text-4xl font-mono font-bold tracking-wider mb-6 text-emerald-400">{deviceId}</p>
                  <button onClick={copyId} className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium">
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                    {copied ? "Copied to Clipboard" : "Copy Device ID"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: FIRMWARE */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-4 mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <Wifi className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="font-bold text-orange-800">Firmware Generation</h3>
                    <p className="text-sm text-orange-700">Configure your ESP32 WiFi credentials below.</p>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <ArduinoCodeGenerator deviceId={deviceId} sensors={selectedSensors} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-4">
            {step > 1 && step < 4 && (
              <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50">Back</button>
            )}
            <button onClick={handleNext} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2">
              {step === 4 ? "Back to Dashboard" : "Continue"}
              {step < 4 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
