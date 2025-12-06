import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebaseClient";
import { ref, onValue } from "firebase/database";

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
  Search
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

// Mapping of data keys to UI properties
const SENSOR_METADATA = {
  temperature: { label: "Temperature", unit: "°C", icon: Thermometer, color: "bg-red-500", stroke: "#ef4444", fill: "#fca5a5" },
  humidity: { label: "Humidity", unit: "%", icon: Droplets, color: "bg-blue-400", stroke: "#60a5fa", fill: "#93c5fd" },
  pressure: { label: "Pressure", unit: "hPa", icon: Gauge, color: "bg-gray-500", stroke: "#6b7280", fill: "#d1d5db" },
  vibration: { label: "Vibration", unit: "mm/s", icon: Waves, color: "bg-purple-500", stroke: "#a855f7", fill: "#d8b4fe" },
  current: { label: "Current", unit: "A", icon: Zap, color: "bg-yellow-500", stroke: "#eab308", fill: "#fde047" },
  voltage: { label: "Voltage", unit: "V", icon: Power, color: "bg-blue-600", stroke: "#2563eb", fill: "#93c5fd" },
  rpm: { label: "Speed", unit: "RPM", icon: Gauge, color: "bg-green-500", stroke: "#22c55e", fill: "#86efac" },
  distance: { label: "Distance", unit: "cm", icon: Maximize, color: "bg-indigo-500", stroke: "#6366f1", fill: "#a5b4fc" },
  co2: { label: "CO2 Level", unit: "ppm", icon: Wind, color: "bg-gray-600", stroke: "#4b5563", fill: "#9ca3af" },
  gasLevel: { label: "Gas Level", unit: "ppm", icon: Wind, color: "bg-orange-500", stroke: "#f97316", fill: "#fdba74" },
  airQuality: { label: "Air Quality", unit: "AQI", icon: Wind, color: "bg-green-600", stroke: "#16a34a", fill: "#86efac" },
  soilMoisture: { label: "Soil Moisture", unit: "%", icon: Droplets, color: "bg-brown-500", stroke: "#a16207", fill: "#fde047" },
  waterLevel: { label: "Water Level", unit: "%", icon: Droplets, color: "bg-blue-500", stroke: "#3b82f6", fill: "#93c5fd" },
  flowRate: { label: "Flow Rate", unit: "L/min", icon: Waves, color: "bg-cyan-500", stroke: "#06b6d4", fill: "#67e8f9" },
  motion: { label: "Motion", unit: "", icon: Activity, color: "bg-orange-600", stroke: "#ea580c", fill: "#fdba74" },
  accX: { label: "Accel X", unit: "g", icon: Activity, color: "bg-pink-500", stroke: "#ec4899", fill: "#fbcfe8" },
  accY: { label: "Accel Y", unit: "g", icon: Activity, color: "bg-pink-500", stroke: "#ec4899", fill: "#fbcfe8" },
  accZ: { label: "Accel Z", unit: "g", icon: Activity, color: "bg-pink-500", stroke: "#ec4899", fill: "#fbcfe8" },
};

// Fallback for unknown sensors
const DEFAULT_META = { label: "Sensor", unit: "", icon: Activity, color: "bg-gray-500", stroke: "#6b7280", fill: "#e5e7eb" };

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");

  // Dynamic sensor data state
  const [sensorData, setSensorData] = useState({});
  const [history, setHistory] = useState([]);

  const [alerts, setAlerts] = useState([]);
  const [machineStatus, setMachineStatus] = useState("running");
  const [showNotifications, setShowNotifications] = useState(false);

  // Thresholds
  const [thresholds, setThresholds] = useState({});

  // Voice debounce
  const lastVoiceTimeRef = useRef(0);

  // ---------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => {
      setUser(cur || null);
      if (!cur) {
        setLoading(false);
        // Note: Don't navigate here, let rendering handle it or user might see flash
      }
    });
    return () => unsub();
  }, []);

  // ---------------------------------------------------
  // LOAD DEVICE LIST (USER SPECIFIC)
  // ---------------------------------------------------
  useEffect(() => {
    if (!user) return;

    // CHANGED: Load from users/{uid}/machines instead of global devices
    const deviceRef = ref(db, `users/${user.uid}/machines`);

    const unsub = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((id) => ({
        deviceId: id,
        machineName: data[id]?.machineName || id, // Structure in 'users' path is flat
      }));
      setMachines(list);
      setLoading(false); // Done loading list

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
        // Only keep numeric values for charts
        const entry = { time: now };
        Object.keys(data).forEach(k => {
          const val = Number(data[k]);
          if (!isNaN(val)) entry[k] = val;
        });

        const newHistory = [...prev, entry];
        return newHistory.slice(-20); // Keep last 20 points
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

  const SensorCard = ({ dataKey, value }) => {
    const meta = SENSOR_METADATA[dataKey] || { ...DEFAULT_META, label: dataKey };
    const Icon = meta.icon;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${meta.color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <h3 className="text-gray-600 text-sm font-medium mb-1 capitalize">{meta.label}</h3>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toFixed(1) : value}</p>
          <span className="text-gray-500">{meta.unit}</span>
        </div>
      </div>
    );
  };

  // Determine which sensors have numeric history to chart
  const sensorKeys = Object.keys(sensorData).filter(k => !isNaN(Number(sensorData[k])));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-lg sticky top-0 z-50">
        <div className="px-6 flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold md:block hidden">AI Machine Health Monitor</h1>
              <h1 className="text-xl font-bold md:hidden block">AI Monitor</h1>
              <p className="text-xs text-cyan-300 md:block hidden">Real-time Industrial Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <StatusBadge status={machineStatus} />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-white/10 rounded-full relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-200" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 origin-top-right animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{alerts.length}</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">No active alerts</p>
                    ) : (
                      alerts.map((alert, i) => (
                        <div key={i} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-800 font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-1">Just now</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => navigate("/settings")}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-200" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-red-200" />
              <span className="text-sm hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">
              Monitoring <span className="font-semibold text-indigo-600">{selectedMachine || 'No Machine Selected'}</span>
            </p>
          </div>
          <div className="w-full md:w-64">
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Select Machine</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
              >
                {machines.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.machineName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS BANNER (Mobile/Prominent) */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-8 animate-fadeIn">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-xl border-l-4 bg-red-50 border-red-500 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="font-semibold text-gray-900">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* DYNAMIC SENSOR GRID */}
        {!selectedMachine || Object.keys(sensorData).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 p-4 rounded-full inline-block mb-3">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">{selectedMachine ? "Waiting for sensor data..." : "No machines found. Add one!"}</p>
            <p className="text-sm text-gray-400 mt-1">{selectedMachine ? "Verify your ESP32 is connected to WiFi" : "Click 'Add Machine' to get started"}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {Object.entries(sensorData).map(([key, value]) => (
                <SensorCard key={key} dataKey={key} value={value} />
              ))}
            </div>

            {/* DYNAMIC CHARTS */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                Live Trends
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sensorKeys.length === 0 ? (
                  <p className="text-gray-400 col-span-2 italic">No numeric data available for charting.</p>
                ) : (
                  sensorKeys.map(key => {
                    const meta = SENSOR_METADATA[key] || { ...DEFAULT_META, label: key };
                    return (
                      <div key={key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                          <div className={`w-2 h-2 rounded-full ${meta.color}`}></div>
                          {meta.label} Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={history}>
                            <defs>
                              <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={meta.stroke} stopOpacity={0.8} /> {/* INCREASED BRIGHTNESS/OPACITY */}
                                <stop offset="95%" stopColor={meta.stroke} stopOpacity={0.2} /> {/* INCREASED BRIGHTNESS/OPACITY */}
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis
                              dataKey="time"
                              tick={{ fill: "#9ca3af", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: "#9ca3af", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              domain={['auto', 'auto']}
                            />
                            <Tooltip
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              labelStyle={{ color: '#6b7280', fontSize: '10px' }}
                            />
                            <Area
                              type="monotone"
                              dataKey={key}
                              stroke={meta.stroke}
                              strokeWidth={2}
                              fill={`url(#grad-${key})`}
                              animationDuration={500}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* MACHINE INFO */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Machine Details</h4>
              <p className="text-sm text-gray-500">ID: {selectedMachine || "N/A"}</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/details")}
            disabled={!selectedMachine}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View Full Config
          </button>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const isHealthy = status === 'running';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isHealthy ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {isHealthy ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      <span className="font-semibold text-xs uppercase tracking-wide">{isHealthy ? "Healthy" : "Attention"}</span>
    </div>
  );
};