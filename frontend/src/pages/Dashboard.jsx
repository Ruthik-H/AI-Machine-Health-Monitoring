import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebaseClient";
import { ref, onValue } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";

import {
  Thermometer,
  Waves,
  Zap,
  Power,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  Settings,
  LogOut,
  Gauge,
  Cpu,
  HardDrive,
  BarChart3,
  Droplets,
  Wind,
  Activity,
  Maximize,
  Search,
  ArrowUpRight
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mapping of data keys to UI properties (Updated for Dark/Glass Theme)
const SENSOR_METADATA = {
  temperature: { label: "Temperature", unit: "°C", icon: Thermometer, color: "from-red-500 to-orange-500", stroke: "#ef4444", fill: "#fca5a5" },
  humidity: { label: "Humidity", unit: "%", icon: Droplets, color: "from-blue-400 to-cyan-400", stroke: "#60a5fa", fill: "#93c5fd" },
  pressure: { label: "Pressure", unit: "hPa", icon: Gauge, color: "from-indigo-400 to-purple-400", stroke: "#818cf8", fill: "#c7d2fe" },
  vibration: { label: "Vibration", unit: "mm/s", icon: Waves, color: "from-fuchsia-500 to-pink-500", stroke: "#d946ef", fill: "#f0abfc" },
  current: { label: "Current", unit: "A", icon: Zap, color: "from-yellow-400 to-amber-500", stroke: "#eab308", fill: "#fde047" },
  voltage: { label: "Voltage", unit: "V", icon: Power, color: "from-cyan-400 to-blue-500", stroke: "#06b6d4", fill: "#67e8f9" },
  rpm: { label: "Speed", unit: "RPM", icon: Gauge, color: "from-green-400 to-emerald-500", stroke: "#22c55e", fill: "#86efac" },
  distance: { label: "Distance", unit: "cm", icon: Maximize, color: "from-violet-500 to-purple-500", stroke: "#8b5cf6", fill: "#c4b5fd" },
  co2: { label: "CO2 Level", unit: "ppm", icon: Wind, color: "from-gray-400 to-slate-500", stroke: "#94a3b8", fill: "#cbd5e1" },
  gasLevel: { label: "Gas Level", unit: "ppm", icon: Wind, color: "from-orange-400 to-red-400", stroke: "#fb923c", fill: "#fdba74" },
  airQuality: { label: "Air Quality", unit: "AQI", icon: Wind, color: "from-emerald-400 to-green-500", stroke: "#34d399", fill: "#6ee7b7" },
  soilMoisture: { label: "Soil Moisture", unit: "%", icon: Droplets, color: "from-amber-600 to-yellow-600", stroke: "#d97706", fill: "#fcd34d" },
  waterLevel: { label: "Water Level", unit: "%", icon: Droplets, color: "from-blue-500 to-indigo-500", stroke: "#3b82f6", fill: "#93c5fd" },
  flowRate: { label: "Flow Rate", unit: "L/min", icon: Waves, color: "from-cyan-500 to-sky-500", stroke: "#06b6d4", fill: "#67e8f9" },
  motion: { label: "Motion", unit: "", icon: Activity, color: "from-orange-500 to-red-500", stroke: "#f97316", fill: "#fdba74" },
  accX: { label: "Accel X", unit: "g", icon: Activity, color: "from-pink-500 to-rose-500", stroke: "#ec4899", fill: "#fbcfe8" },
  accY: { label: "Accel Y", unit: "g", icon: Activity, color: "from-pink-500 to-rose-500", stroke: "#ec4899", fill: "#fbcfe8" },
  accZ: { label: "Accel Z", unit: "g", icon: Activity, color: "from-pink-500 to-rose-500", stroke: "#ec4899", fill: "#fbcfe8" },
};

// Fallback for unknown sensors
const DEFAULT_META = { label: "Sensor", unit: "", icon: Activity, color: "from-slate-500 to-gray-500", stroke: "#94a3b8", fill: "#e2e8f0" };

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");

  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState([]);

  const [alerts, setAlerts] = useState([]);
  const [machineStatus, setMachineStatus] = useState("running");
  const [showNotifications, setShowNotifications] = useState(false);

  const [thresholds, setThresholds] = useState({});
  const lastVoiceTimeRef = useRef(0);

  // ---------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => {
      setUser(cur || null);
      if (!cur) {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // ---------------------------------------------------
  // LOAD DEVICE LIST
  // ---------------------------------------------------
  useEffect(() => {
    if (!user) return;
    const deviceRef = ref(db, `users/${user.uid}/machines`);
    const unsub = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((id) => ({
        deviceId: id,
        machineName: data[id]?.machineName || id,
      }));
      setMachines(list);
      setLoading(false);

      if (!selectedMachine && list.length > 0) {
        setSelectedMachine(list[0].deviceId);
      }
    });
    return () => unsub();
  }, [user, selectedMachine]);

  // ---------------------------------------------------
  // LOAD THRESHOLDS
  // ---------------------------------------------------
  useEffect(() => {
    if (!selectedMachine) return;
    const threshRef = ref(db, `devices/${selectedMachine}/config/thresholds`);
    const unsub = onValue(threshRef, (snap) => {
      setThresholds(snap.val() || {});
    });
    return () => unsub();
  }, [selectedMachine]);

  // ---------------------------------------------------
  // LOAD SENSOR DATA
  // ---------------------------------------------------
  useEffect(() => {
    if (!selectedMachine) return;

    const sensorRef = ref(db, `devices/${selectedMachine}/sensors`);
    const unsub = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSensorData(data);

      const now = new Date().toLocaleTimeString();
      setHistory((prev) => {
        const entry = { time: now };
        Object.keys(data).forEach(k => {
          const val = Number(data[k]);
          if (!isNaN(val)) entry[k] = val;
        });

        const newHistory = [...prev, entry];
        return newHistory.slice(-20);
      });

      // Alerts Logic
      const newAlerts = [];
      Object.keys(thresholds).forEach((key) => {
        const val = data[key];
        const limit = thresholds[key];
        if (val !== undefined && val > limit) {
          newAlerts.push({ id: Date.now() + key, type: "warning", message: `${key.toUpperCase()} (${val}) exceeds limit (${limit})` });
        }
      });

      setAlerts(newAlerts);
      setMachineStatus(newAlerts.length > 0 ? "warning" : "running");
    });

    return () => unsub();
  }, [selectedMachine, thresholds]);

  // ---------------------------------------------------
  // VOICE ALERTS
  // ---------------------------------------------------
  useEffect(() => {
    if (alerts.length === 0) return;
    const now = Date.now();
    if (now - lastVoiceTimeRef.current < 10000) return;

    if (window.speechSynthesis && !speechSynthesis.speaking) {
      const msg = `Alert. ${alerts[0].message}`;
      const utter = new SpeechSynthesisUtterance(msg);
      speechSynthesis.speak(utter);
      lastVoiceTimeRef.current = now;
    }
  }, [alerts]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const SensorCard = ({ dataKey, value, index }) => {
    const meta = SENSOR_METADATA[dataKey] || { ...DEFAULT_META, label: dataKey };
    const Icon = meta.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="glass-card flex flex-col justify-between group relative overflow-hidden hover:scale-105 transition-all duration-300"
      >
        <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl bg-gradient-to-tr ${meta.color} opacity-40 group-hover:opacity-70 transition-opacity duration-500`}>
          <Icon className="w-7 h-7 text-white drop-shadow-lg" />
        </div>

        <div>
          <h3 className="text-gray-800 text-sm font-bold uppercase tracking-wider mb-3">{meta.label}</h3>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={value}
              initial={{ scale: 1.05, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-5xl font-black bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent"
            >
              {typeof value === 'number' ? value.toFixed(1) : value}
            </motion.span>
            <span className="text-lg font-bold text-purple-700">{meta.unit}</span>
          </div>
        </div>

        {/* Animated Bottom Glow */}
        <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${meta.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700`} />

        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </motion.div>
    );
  };

  const sensorKeys = Object.keys(sensorData).filter(k => !isNaN(Number(sensorData[k])));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_50px_rgba(139,92,246,0.5)]"></div>
          <p className="text-purple-700 font-bold animate-pulse text-lg">Initializing System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">

      {/* NAVBAR */}
      <nav className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">DashPro <span className="text-purple-600">AI</span></h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                <p className="text-xs text-gray-600 font-mono font-semibold">SYSTEM ONLINE</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Machine Select (Desktop) */}
            <div className="hidden md:block relative group">
              <select
                className="pl-4 pr-10 py-2.5 bg-white/60 border-2 border-purple-200 rounded-xl text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-white/80 transition-all w-52 shadow-md"
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
              >
                {machines.map((m) => (
                  <option key={m.deviceId} value={m.deviceId} className="bg-white text-gray-900">
                    {m.machineName}
                  </option>
                ))}
              </select>
              <HardDrive className="w-4 h-4 text-purple-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-white/60 hover:bg-white/80 border-2 border-purple-200 transition-all shadow-md group relative"
            >
              <Bell className="w-5 h-5 text-gray-700 group-hover:text-purple-600 transition-colors" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute top-20 right-6 w-96 glass border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-white">System Alerts</h3>
                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/30">{alerts.length} New</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center text-blue-200/40">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">All systems nominal system</p>
                      </div>
                    ) : (
                      alerts.map((alert, i) => (
                        <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3">
                          <div className="mt-1">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{alert.message}</p>
                            <p className="text-xs text-blue-200/40 mt-1 font-mono">TIMESTAMP: {new Date().toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => navigate("/settings")}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors"
            >
              <Settings className="w-5 h-5 text-blue-100" />
            </button>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg border border-red-500/20 transition-colors font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">

        {/* Mobile Machine Select */}
        <div className="md:hidden mb-6">
          <label className="text-xs font-bold text-blue-200/60 uppercase mb-2 block">Active Machine</label>
          <select
            className="w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none appearance-none"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
          >
            {machines.map((m) => (
              <option key={m.deviceId} value={m.deviceId} className="bg-slate-900">
                {m.machineName}
              </option>
            ))}
          </select>
        </div>

        {/* ALERTS BANNER */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 space-y-2"
          >
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 shadow-lg backdrop-blur-md">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                <p className="font-semibold text-sm">{alert.message}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* DYNAMIC SENSOR GRID */}
        {!selectedMachine || Object.keys(sensorData).length === 0 ? (
          <div className="text-center py-32 rounded-3xl border border-dashed border-white/10 bg-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Activity className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Awaiting Telemetry</h2>
            <p className="text-blue-200/40">Connect an ESP32 device to begin streaming data.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {Object.entries(sensorData).map(([key, value], index) => (
                <SensorCard key={key} dataKey={key} value={value} index={index} />
              ))}
            </div>

            {/* CHARTS */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-accent-violet/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-accent-violet" />
                </div>
                Live Analytics
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sensorKeys.length === 0 ? (
                  <p className="text-gray-500 col-span-2 text-center py-10">No numeric data available for visualization.</p>
                ) : (
                  sensorKeys.map((key, i) => {
                    const meta = SENSOR_METADATA[key] || { ...DEFAULT_META, label: key };
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        key={key}
                        className="glass-card border border-white/5"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-sm font-bold text-blue-200/70 flex items-center gap-2 uppercase tracking-wider">
                            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${meta.color}`}></span>
                            {meta.label} Trend
                          </h3>
                          <div className="bg-white/5 px-2 py-1 rounded text-xs font-mono text-white/50">LIVE</div>
                        </div>

                        <div className="relative z-10">
                          <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={history}>
                              <defs>
                                <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={meta.stroke} stopOpacity={0.5} />
                                  <stop offset="95%" stopColor={meta.stroke} stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis
                                dataKey="time"
                                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={30}
                              />
                              <YAxis
                                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                domain={['auto', 'auto']}
                              />
                              <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)', color: '#fff' }}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '5px' }}
                              />
                              <Area
                                type="monotone"
                                dataKey={key}
                                stroke={meta.stroke}
                                strokeWidth={3}
                                fill={`url(#grad-${key})`}
                                animationDuration={1000}
                                dot={{ fill: meta.stroke, r: 2, strokeWidth: 0 }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* MACHINE INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card mt-8 flex flex-col sm:flex-row justify-between items-center gap-6 border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-4 rounded-2xl border border-blue-500/30">
              <HardDrive className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">Active Configuration</h4>
              <p className="text-sm text-blue-200/60 font-mono mt-1">ID: {selectedMachine || "N/A"}</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/add-machine")}
            className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-blue-500/20 hover:scale-105 active:scale-95"
          >
            Configure Device
          </button>
        </motion.div>
      </div>
    </div>
  );
}
