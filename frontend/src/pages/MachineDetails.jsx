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
    <div className="min-h-screen p-6 md:p-8 text-gray-800 relative z-10">

      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </motion.button>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card max-w-5xl mx-auto overflow-hidden border border-gray-200 shadow-2xl relative bg-white"
      >
        {/* Active Status Indicator */}
        <div className="absolute top-0 right-0 p-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${machineData.online ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
            <div className={`w-2 h-2 rounded-full ${machineData.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {machineData.online ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-100 rounded-xl border border-blue-200 text-blue-600 shadow-sm">
              <HardDrive className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{machineData.machineName}</h2>
              <p className="text-gray-500 text-sm font-mono tracking-wider font-semibold">{machineData.deviceId}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <p className="text-xs text-blue-600 uppercase tracking-widest font-bold mb-2">Machine Details</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 font-medium">Type</span>
                <span className="text-gray-900 font-bold">{machineData.machineType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Added On</span>
                <span className="text-gray-900 font-bold">{new Date(machineData.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <p className="text-xs text-blue-600 uppercase tracking-widest font-bold mb-2">Monitoring Stats</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 font-medium">Configured Sensors</span>
                <span className="text-blue-600 font-bold text-lg">{activeSensors.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Status</span>
                <span className="text-emerald-600 font-bold">Healthy</span>
              </div>
            </div>
          </div>

          {/* Configured Sensors Section */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              Active Sensors
            </h3>

            {activeSensors.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-400 font-bold italic">No sensors configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeSensors.map(key => {
                  const s = SENSOR_DEFINITIONS[key];
                  return (
                    <div key={key} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-white hover:shadow-md transition-all group">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{s.label}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{s.category}</p>
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
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Firmware Configuration</h3>
                    <button
                      onClick={() => setShowCode(false)}
                      className="text-gray-500 hover:text-red-500 flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-bold"
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
                className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-gray-100"
              >
                <button
                  onClick={() => setShowCode(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 font-bold"
                >
                  <Code className="w-5 h-5" />
                  Get Device Code
                </button>

                <button className="flex items-center gap-2 px-6 py-3 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-xl transition-all active:scale-95 font-bold ml-auto">
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
