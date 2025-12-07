import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, ArrowLeft, Code, X, CheckCircle, Trash2 } from "lucide-react";
import { db } from "../firebaseClient";
import { ref, onValue } from "firebase/database";
import ArduinoCodeGenerator from "../components/ArduinoCodeGenerator";
import { SENSOR_DEFINITIONS } from "../data/sensors";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="min-h-screen p-6 md:p-8 text-white relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-blob" />
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-blob animation-delay-4000" />

      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-blue-300 hover:text-white font-medium mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </motion.button>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card max-w-5xl mx-auto overflow-hidden border border-white/10 shadow-2xl relative"
      >
        {/* Active Status Indicator */}
        <div className="absolute top-0 right-0 p-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${machineData.online ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
            <div className={`w-2 h-2 rounded-full ${machineData.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {machineData.online ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
              <HardDrive className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{machineData.machineName}</h2>
              <p className="text-blue-200/50 text-sm font-mono tracking-wider">{machineData.deviceId}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <p className="text-xs text-blue-200/50 uppercase tracking-widest font-bold mb-2">Machine Details</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60">Type</span>
                <span className="text-white font-semibold">{machineData.machineType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Added On</span>
                <span className="text-white font-semibold">{new Date(machineData.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <p className="text-xs text-blue-200/50 uppercase tracking-widest font-bold mb-2">Monitoring Stats</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60">Configured Sensors</span>
                <span className="text-accent-cyan font-bold">{activeSensors.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Status</span>
                <span className="text-emerald-400 font-semibold">Healthy</span>
              </div>
            </div>
          </div>

          {/* Configured Sensors Section */}
          <div className="mb-8">
            <h3 className="font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-accent-cyan rounded-full" />
              Active Sensors
            </h3>

            {activeSensors.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                <p className="text-white/30 italic">No sensors configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeSensors.map(key => {
                  const s = SENSOR_DEFINITIONS[key];
                  return (
                    <div key={key} className="flex items-center gap-3 p-4 border border-white/10 rounded-xl bg-black/20 hover:bg-white/5 transition-colors group">
                      <div className="p-2 bg-accent-cyan/10 rounded-lg text-accent-cyan group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{s.label}</p>
                        <p className="text-[10px] text-blue-200/50 uppercase tracking-wider font-semibold">{s.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <AnimatePresence>
            {showCode ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Firmware Configuration</h3>
                    <button
                      onClick={() => setShowCode(false)}
                      className="text-white/50 hover:text-white flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" /> Close Generator
                    </button>
                  </div>
                  <ArduinoCodeGenerator deviceId={machineData.deviceId} sensors={machineData.sensors} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-white/10"
              >
                <button
                  onClick={() => setShowCode(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/40 transition-all active:scale-95 font-bold"
                >
                  <Code className="w-5 h-5" />
                  Get Device Code
                </button>

                <button className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all active:scale-95 font-medium ml-auto">
                  <Trash2 className="w-5 h-5" />
                  Remove Machine
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
