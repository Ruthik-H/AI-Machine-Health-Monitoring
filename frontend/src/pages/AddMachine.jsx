import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ChevronRight, Clipboard, CheckCircle, ArrowLeft, Search, PlusCircle, PenTool, Database, Wifi } from "lucide-react";
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
    <div className="min-h-screen text-white flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-blob" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-blob animation-delay-2000" />

      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 mb-2">Setup New Device</h1>
          <p className="text-blue-200/50">Connect a new industrial machine to the DashPro AI cloud.</p>
        </div>

        <div className="glass-card shadow-2xl p-0 overflow-hidden relative border border-white/10">

          {/* Progress Bar Top */}
          <div className="h-1 w-full bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-cyan to-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="p-8 md:p-10">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-10 px-4 relative">
              <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white/10 -z-0 translate-y-[-50%]"></div>

              {["Basic Info", "Sensors", "Identity", "Firmware"].map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step >= stepNum;
                const isCurrent = step === stepNum;
                return (
                  <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shadow-xl ${isActive ? "border-accent-cyan bg-accent-cyan text-slate-900" : "border-white/20 bg-slate-900 text-white/40"}`}
                      animate={{ scale: isCurrent ? 1.2 : 1 }}
                    >
                      {isActive ? <CheckCircle className="w-5 h-5" /> : stepNum}
                    </motion.div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isCurrent ? "text-accent-cyan" : "text-white/30"}`}>{label}</span>
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1 — MACHINE INFO */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 max-w-lg mx-auto py-4"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                      <PenTool className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Machine Details</h2>
                    <p className="text-blue-200/50 text-sm">Give your device a recognizable name.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-blue-200/70 mb-2 uppercase tracking-wide">
                      Machine Name
                    </label>
                    <input
                      type="text"
                      value={machineName}
                      onChange={(e) => setMachineName(e.target.value)}
                      className="input-glass w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-accent-cyan/50 outline-none text-white text-lg placeholder-white/20"
                      placeholder="e.g. Factory Line CNC-01"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-blue-200/70 mb-2 uppercase tracking-wide">
                      Machine Type
                    </label>
                    <div className="relative">
                      <select
                        value={machineType}
                        onChange={(e) => setMachineType(e.target.value)}
                        className="input-glass w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-accent-cyan/50 outline-none text-white appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">Select Device Category</option>
                        <option className="bg-slate-900">3D Printer</option>
                        <option className="bg-slate-900">CNC Machine</option>
                        <option className="bg-slate-900">Industrial Motor</option>
                        <option className="bg-slate-900">Hydraulic Pump</option>
                        <option className="bg-slate-900">Lathe / Milling</option>
                        <option className="bg-slate-900">Environment Sensor</option>
                        <option className="bg-slate-900">Custom Prototype</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">▼</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — SENSORS */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Select Sensors</h2>
                      <p className="text-blue-200/50 text-sm mt-1">Configure what data this device will collect.</p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search sensors..."
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-accent-cyan outline-none text-white text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-all border ${activeCategory === cat
                          ? "bg-accent-cyan/20 border-accent-cyan text-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                          : "bg-transparent border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* SENSOR GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                    {filteredSensors.length === 0 ? (
                      <div className="col-span-full text-center py-20 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-white/30">No sensors match your search.</p>
                      </div>
                    ) : (
                      filteredSensors.map((sensor) => (
                        <label
                          key={sensor.id}
                          className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-300 group border ${selectedSensors[sensor.id]
                            ? "bg-accent-cyan/10 border-accent-cyan/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                            : "bg-white/5 border-white/5 hover:bg-white/10"
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
                            className="mr-4 w-5 h-5 accent-cyan-400 rounded border-white/20"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <p className={`font-bold ${selectedSensors[sensor.id] ? "text-white" : "text-white/70"}`}>
                                {sensor.label}
                              </p>
                              {selectedSensors[sensor.id] && <CheckCircle className="w-4 h-4 text-accent-cyan" />}
                            </div>
                            <p className="text-xs text-white/30 uppercase tracking-wider">{sensor.category}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm text-white/40 border-t border-white/10 pt-4">
                    <span>Required for code generation</span>
                    <span className={Object.values(selectedSensors).filter(Boolean).length > 0 ? "text-accent-cyan font-bold" : ""}>
                      {Object.values(selectedSensors).filter(Boolean).length} Selected
                    </span>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — GENERATED DEVICE ID */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 py-8"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 animate-pulse">
                      <Database className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Device ID Generated</h2>
                    <p className="text-blue-200/50 max-w-md mx-auto">This unique identifier maps your physical hardware to our cloud platform.</p>
                  </div>

                  <div className="max-w-md mx-auto bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                    <p className="text-xs text-emerald-400 uppercase font-bold tracking-[0.2em]">UNIQUE IDENTIFIER</p>
                    <p className="font-mono text-3xl font-bold text-white tracking-wider">{deviceId}</p>

                    <button
                      onClick={copyId}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <> <CheckCircle className="w-4 h-4 text-emerald-400" /> Copied </>
                      ) : (
                        <> <Clipboard className="w-4 h-4" /> Copy to Clipboard </>
                      )}
                    </button>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 items-center max-w-lg mx-auto">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-100/80">Click <strong className="text-white">Next</strong> to generate the specific Arduino firmware for your ESP32.</p>
                  </div>
                </motion.div>
              )}

              {/* STEP 4 — CODE GENERATOR */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                      <Wifi className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-xl">Firmware Generation</h2>
                      <p className="text-white/40 text-sm">Configure WiFi and download your sketch.</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-white/10 rounded-xl p-1 overflow-hidden">
                    <ArduinoCodeGenerator deviceId={deviceId} sensors={selectedSensors} />
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-5 rounded-xl text-sm text-yellow-100/80">
                    <strong className="text-yellow-400 block mb-2 uppercase tracking-wide text-xs">Deployment Instructions</strong>
                    <ol className="list-decimal ml-5 space-y-1 text-white/70">
                      <li>Copy the generated code above.</li>
                      <li>Open <span className="text-white font-mono">Arduino IDE</span>.</li>
                      <li>Install required libraries (Firebase_ESP_Client, etc).</li>
                      <li>Connect your ESP32 via USB and upload.</li>
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NAVIGATION BUTTONS */}
            <div className="mt-10 flex gap-4 pt-6 border-t border-white/5">
              {step > 1 && step < 4 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-bold transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold shadow-lg shadow-blue-900/40 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {step < 4 ? "Continue" : "Go to Dashboard"}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
