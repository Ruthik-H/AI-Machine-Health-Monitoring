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
  TrendingUp,
  Server,
  Sparkles
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

// Sensor Metadata with Vibrant Colors
const SENSOR_METADATA = {
  temperature: { label: "Temperature", unit: "°C", icon: Thermometer, color: "from-red-500 to-orange-500", stroke: "#ef4444", fill: "#fca5a5" },
  humidity: { label: "Humidity", unit: "%", icon: Droplets, color: "from-blue-500 to-cyan-500", stroke: "#3b82f6", fill: "#93c5fd" },
  pressure: { label: "Pressure", unit: "hPa", icon: Gauge, color: "from-indigo-500 to-purple-500", stroke: "#6366f1", fill: "#c7d2fe" },
  vibration: { label: "Vibration", unit: "mm/s", icon: Waves, color: "from-fuchsia-500 to-pink-500", stroke: "#d946ef", fill: "#f0abfc" },
  current: { label: "Current", unit: "A", icon: Zap, color: "from-yellow-500 to-amber-500", stroke: "#eab308", fill: "#fde047" },
  voltage: { label: "Voltage", unit: "V", icon: Power, color: "from-cyan-500 to-blue-600", stroke: "#0ea5e9", fill: "#67e8f9" },
  rpm: { label: "Speed", unit: "RPM", icon: Gauge, color: "from-green-500 to-emerald-600", stroke: "#22c55e", fill: "#86efac" },
  distance: { label: "Distance", unit: "cm", icon: Maximize, color: "from-violet-500 to-purple-600", stroke: "#8b5cf6", fill: "#c4b5fd" },
  co2: { label: "CO2 Level", unit: "ppm", icon: Wind, color: "from-gray-500 to-slate-600", stroke: "#64748b", fill: "#cbd5e1" },
  gasLevel: { label: "Gas Level", unit: "ppm", icon: Wind, color: "from-orange-500 to-red-500", stroke: "#f97316", fill: "#fdba74" },
  airQuality: { label: "Air Quality", unit: "AQI", icon: Wind, color: "from-emerald-500 to-green-600", stroke: "#10b981", fill: "#6ee7b7" },
  soilMoisture: { label: "Soil Moisture", unit: "%", icon: Droplets, color: "from-amber-600 to-yellow-600", stroke: "#d97706", fill: "#fcd34d" },
  waterLevel: { label: "Water Level", unit: "%", icon: Droplets, color: "from-blue-600 to-indigo-600", stroke: "#2563eb", fill: "#93c5fd" },
  flowRate: { label: "Flow Rate", unit: "L/min", icon: Waves, color: "from-cyan-600 to-sky-600", stroke: "#0891b2", fill: "#67e8f9" },
  motion: { label: "Motion", unit: "", icon: Activity, color: "from-orange-600 to-red-600", stroke: "#ea580c", fill: "#fdba74" },
  accX: { label: "Accel X", unit: "g", icon: Activity, color: "from-pink-600 to-rose-600", stroke: "#db2777", fill: "#fbcfe8" },
  accY: { label: "Accel Y", unit: "g", icon: Activity, color: "from-pink-600 to-rose-600", stroke: "#db2777", fill: "#fbcfe8" },
  accZ: { label: "Accel Z", unit: "g", icon: Activity, color: "from-pink-600 to-rose-600", stroke: "#db2777", fill: "#fbcfe8" },
};

const DEFAULT_META = { label: "Sensor", unit: "", icon: Activity, color: "from-slate-500 to-gray-600", stroke: "#64748b", fill: "#e2e8f0" };

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

  // AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => {
      setUser(cur || null);
      if (!cur) {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // LOAD DEVICE LIST
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

  // LOAD THRESHOLDS
  useEffect(() => {
    if (!selectedMachine) return;
    const threshRef = ref(db, `devices/${selectedMachine}/config/thresholds`);
    const unsub = onValue(threshRef, (snap) => {
      setThresholds(snap.val() || {});
    });
    return () => unsub();
  }, [selectedMachine]);

  // LOAD SENSOR DATA
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

  // VOICE ALERTS
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

  // Aggressive Metric Card
  const MetricCard = ({ icon: Icon, label, value, unit, gradient, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", bounce: 0.5 }}
      className="glass-card elevation-aggressive group cursor-pointer relative overflow-hidden bounce-in"
    >
      {/* Gradient Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-500 rounded-2xl`}></div>

      {/* Icon with Aggressive Shadow */}
      <div className={`relative mb-4 inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} aggressive-shadow`}>
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Label */}
      <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-3">{label}</h3>

      {/* Value with Vibrant Color */}
      <div className="flex items-baseline gap-2">
        <motion.span
          key={value}
          initial={{ scale: 1.2, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring" }}
          className={`text-5xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}
        >
          {value}
        </motion.span>
        <span className="text-lg font-black vibrant-purple">{unit}</span>
      </div>

      {/* Aggressive Bottom Border */}
      <div className={`absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 shadow-lg`}></div>
    </motion.div>
  );

  // Vibrant Sensor Card
  const SensorCard = ({ dataKey, value, index }) => {
    const meta = SENSOR_METADATA[dataKey] || { ...DEFAULT_META, label: dataKey };
    const Icon = meta.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, rotateY: -10 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ delay: index * 0.05, type: "spring" }}
        className="glass-card group relative overflow-hidden"
      >
        {/* Colorful Icon Badge */}
        <div className={`absolute top-4 right-4 p-3 rounded-xl bg-gradient-to-br ${meta.color} shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Label */}
        <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-4">{meta.label}</h3>

        {/* Value with Aggressive Styling */}
        <div className="flex items-baseline gap-3">
          <motion.span
            key={value}
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
            className={`text-6xl font-black value-transition bg-gradient-to-br ${meta.color} bg-clip-text text-transparent`}
          >
            {typeof value === 'number' ? value.toFixed(1) : value}
          </motion.span>
          <span className="text-xl font-black text-gray-700">{meta.unit}</span>
        </div>

        {/* Colorful Bottom Accent */}
        <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${meta.color} group-hover:h-2 transition-all duration-300 shadow-lg`}></div>
      </motion.div>
    );
  };

  const sensorKeys = Object.keys(sensorData).filter(k => !isNaN(Number(sensorData[k])));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 border-8 border-blue-500 border-t-pink-500 border-r-purple-500 rounded-full animate-spin mb-6 pulse-glow"></div>
          <p className="text-gradient font-black animate-pulse text-2xl tracking-wider">LOADING SYSTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 relative z-10">

      {/* VIBRANT NAVBAR */}
      <nav className="glass sticky top-0 z-50 border-b-4 border-blue-500/30 aggressive-shadow">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          <div className="flex items-center gap-5">
            {/* Logo with Rainbow Animation */}
            <div className="relative rainbow-animation">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center aggressive-shadow">
                <Cpu className="w-9 h-9 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight">
                <span className="vibrant-blue">AI Machine</span>
                <span className="vibrant-pink"> Health</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 pulse-glow-cyan shadow-lg"></div>
                <p className="text-xs vibrant-green font-black uppercase tracking-widest">System Online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Machine Selector */}
            <div className="hidden md:block relative">
              <select
                className="pl-5 pr-12 py-3 bg-white/90 border-3 border-blue-500/40 rounded-2xl text-sm font-black text-gray-800 focus:ring-4 focus:ring-pink-400 focus:border-pink-500 outline-none appearance-none cursor-pointer hover:border-pink-500 transition-all w-56 aggressive-shadow"
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
              >
                {machines.map((m) => (
                  <option key={m.deviceId} value={m.deviceId} className="bg-white font-bold">
                    {m.machineName}
                  </option>
                ))}
              </select>
              <HardDrive className="w-5 h-5 vibrant-blue absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-2xl bg-white/90 hover:bg-white border-3 border-purple-500/40 hover:border-purple-600 transition-all aggressive-shadow group relative"
            >
              <Bell className="w-6 h-6 vibrant-purple group-hover:scale-110 transition-transform" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full pulse-glow-pink flex items-center justify-center text-white text-xs font-black">{alerts.length}</span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute top-28 right-6 w-96 glass-card border-3 aggressive-border-purple rounded-3xl aggressive-shadow z-50 overflow-hidden"
                >
                  <div className="p-5 border-b-3 border-purple-300 flex justify-between items-center bg-gradient-to-r from-purple-100 to-pink-100">
                    <h3 className="font-black vibrant-purple text-lg">System Alerts</h3>
                    <span className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-full font-black">{alerts.length} NEW</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {alerts.length === 0 ? (
                      <div className="p-10 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 vibrant-green" />
                        <p className="text-sm font-bold text-gray-600">All systems nominal</p>
                      </div>
                    ) : (
                      alerts.map((alert, i) => (
                        <div key={i} className="p-5 border-b border-purple-200 hover:bg-purple-50 transition-colors flex gap-4">
                          <div className="mt-1">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1 font-mono font-bold">{new Date().toLocaleTimeString()}</p>
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
              className="p-3 rounded-2xl bg-white/90 hover:bg-white border-3 border-blue-500/40 hover:border-blue-600 transition-all aggressive-shadow"
            >
              <Settings className="w-6 h-6 vibrant-blue" />
            </button>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl font-black text-sm aggressive-shadow hover:scale-105 transition-transform"
            >
              <LogOut className="w-5 h-5" />
              SIGN OUT
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">

        {/* Mobile Machine Select */}
        <div className="md:hidden mb-6">
          <label className="text-xs font-black vibrant-blue uppercase mb-2 block tracking-widest">Active Machine</label>
          <select
            className="w-full pl-4 pr-10 py-4 bg-white/90 border-3 border-blue-500/40 rounded-2xl font-bold text-gray-800 outline-none appearance-none aggressive-shadow"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
          >
            {machines.map((m) => (
              <option key={m.deviceId} value={m.deviceId} className="bg-white">
                {m.machineName}
              </option>
            ))}
          </select>
        </div>

        {/* AGGRESSIVE METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
          <MetricCard icon={Server} label="Machines" value={machines.length} unit="" gradient="from-blue-500 to-cyan-600" index={0} />
          <MetricCard icon={AlertTriangle} label="Alerts" value={alerts.length} unit="" gradient="from-red-500 to-orange-500" index={1} />
          <MetricCard icon={Activity} label="Uptime" value="99.8" unit="%" gradient="from-green-500 to-emerald-600" index={2} />
          <MetricCard icon={TrendingUp} label="Efficiency" value="94" unit="%" gradient="from-purple-500 to-pink-600" index={3} />
          <MetricCard icon={Sparkles} label="Status" value={machineStatus === "running" ? "OK" : "WARN"} unit="" gradient={machineStatus === "running" ? "from-green-500 to-teal-500" : "from-yellow-500 to-orange-500"} index={4} />
        </div>

        {/* ALERTS BANNER */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 space-y-3"
          >
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-gradient-to-r from-red-100 to-pink-100 border-3 aggressive-border-pink aggressive-shadow">
                <AlertTriangle className="w-6 h-6 text-red-600 pulse-glow-pink" />
                <p className="font-black text-sm text-red-800">{alert.message}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* DYNAMIC SENSOR GRID */}
        {!selectedMachine || Object.keys(sensorData).length === 0 ? (
          <div className="text-center py-40 rounded-3xl border-4 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow">
              <Activity className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gradient mb-3">Awaiting Telemetry</h2>
            <p className="text-gray-600 font-bold">Connect an ESP32 device to begin streaming data.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {Object.entries(sensorData).map(([key, value], index) => (
                <SensorCard key={key} dataKey={key} value={value} index={index} />
              ))}
            </div>

            {/* VIBRANT CHARTS */}
            <div className="mb-6">
              <h3 className="text-2xl font-black text-gradient mb-8 flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl aggressive-shadow">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                Live Analytics
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sensorKeys.length === 0 ? (
                  <p className="text-gray-500 font-bold col-span-2 text-center py-10">No numeric data available for visualization.</p>
                ) : (
                  sensorKeys.map((key, i) => {
                    const meta = SENSOR_METADATA[key] || { ...DEFAULT_META, label: key };
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        key={key}
                        className="glass-card border-3 aggressive-border-blue"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-sm font-black text-gray-700 flex items-center gap-3 uppercase tracking-widest">
                            <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${meta.color} pulse-glow`}></span>
                            {meta.label} Trend
                          </h3>
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-3 py-1.5 rounded-lg text-xs font-black text-white">LIVE</div>
                        </div>

                        <div className="relative z-10">
                          <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={history}>
                              <defs>
                                <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={meta.stroke} stopOpacity={0.8} />
                                  <stop offset="95%" stopColor={meta.stroke} stopOpacity={0.1} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.2)" />
                              <XAxis
                                dataKey="time"
                                tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 700 }}
                                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                                tickLine={false}
                                minTickGap={30}
                              />
                              <YAxis
                                tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 700 }}
                                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                                tickLine={false}
                                domain={['auto', 'auto']}
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: '16px',
                                  border: '3px solid #3b82f6',
                                  background: 'rgba(255, 255, 255, 0.98)',
                                  color: '#1f2937',
                                  fontWeight: 800,
                                  boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
                                }}
                                labelStyle={{ color: '#6b7280', fontSize: '11px', marginBottom: '5px', fontWeight: 800 }}
                              />
                              <Area
                                type="monotone"
                                dataKey={key}
                                stroke={meta.stroke}
                                strokeWidth={4}
                                fill={`url(#grad-${key})`}
                                animationDuration={1000}
                                dot={{ fill: meta.stroke, r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff', fill: meta.stroke }}
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

        {/* MACHINE INFO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 border-3 aggressive-border-purple"
        >
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-5 rounded-3xl aggressive-shadow">
              <HardDrive className="w-10 h-10 text-white" />
            </div>
            <div>
              <h4 className="font-black vibrant-blue text-xl">Active Configuration</h4>
              <p className="text-sm text-gray-600 font-mono font-bold mt-1">ID: {selectedMachine || "N/A"}</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/add-machine")}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-black rounded-2xl hover:scale-105 transition-transform aggressive-shadow text-lg"
          >
            CONFIGURE DEVICE
          </button>
        </motion.div>
      </div>
    </div>
  );
}
