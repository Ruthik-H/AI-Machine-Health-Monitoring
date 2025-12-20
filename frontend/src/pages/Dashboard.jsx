// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseClient";
import { ref, onValue } from "firebase/database";
import { motion } from "framer-motion";

import {
  Thermometer,
  Waves,
  Zap,
  Power,
  AlertTriangle,
  CheckCircle,
  Bell,
  HardDrive,
  BarChart3,
  Droplets,
  Wind,
  Activity,
  Maximize,
  TrendingUp,
  Server,
  Plus
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

// PROFESSIONAL SENSOR METADATA
const SENSOR_METADATA = {
  temperature: { label: "Temperature", unit: "°C", icon: Thermometer, color: "text-red-600", bg: "bg-red-50", stroke: "#DC2626", fill: "#FECACA" },
  humidity: { label: "Humidity", unit: "%", icon: Droplets, color: "text-blue-600", bg: "bg-blue-50", stroke: "#2563EB", fill: "#BFDBFE" },
  pressure: { label: "Pressure", unit: "hPa", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50", stroke: "#4F46E5", fill: "#C7D2FE" },
  vibration: { label: "Vibration", unit: "mm/s", icon: Waves, color: "text-violet-600", bg: "bg-violet-50", stroke: "#7C3AED", fill: "#DDD6FE" },
  current: { label: "Current", unit: "A", icon: Zap, color: "text-amber-600", bg: "bg-amber-50", stroke: "#D97706", fill: "#FDE68A" },
  voltage: { label: "Voltage", unit: "V", icon: Power, color: "text-cyan-600", bg: "bg-cyan-50", stroke: "#0891B2", fill: "#A5F3FC" },
  rpm: { label: "Speed", unit: "RPM", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", stroke: "#059669", fill: "#A7F3D0" },
  co2: { label: "CO2 Level", unit: "ppm", icon: Wind, color: "text-slate-600", bg: "bg-slate-50", stroke: "#475569", fill: "#E2E8F0" },
};

const DEFAULT_META = { label: "Sensor", unit: "", icon: Activity, color: "text-slate-600", bg: "bg-slate-50", stroke: "#64748B", fill: "#E2E8F0" };

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
  const [thresholds, setThresholds] = useState({});
  const lastVoiceTimeRef = useRef(0);

  // AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => {
      setUser(cur || null);
      if (!cur) setLoading(false);
    });
    return () => unsub();
  }, []);

  // LOAD DEVICES
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
      if (!selectedMachine && list.length > 0) setSelectedMachine(list[0].deviceId);
    });
    return () => unsub();
  }, [user, selectedMachine]);

  // LOAD THRESHOLDS
  useEffect(() => {
    if (!selectedMachine) return;
    const threshRef = ref(db, `devices/${selectedMachine}/config/thresholds`);
    const unsub = onValue(threshRef, (snap) => setThresholds(snap.val() || {}));
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
        return [...prev, entry].slice(-20);
      });

      // Alerts
      const newAlerts = [];
      Object.keys(thresholds).forEach((key) => {
        const val = data[key];
        const limit = thresholds[key];
        if (val !== undefined && val > limit) {
          newAlerts.push({ message: `${key.toUpperCase()} exceeds limit` });
        }
      });
      setAlerts(newAlerts);
      setMachineStatus(newAlerts.length > 0 ? "warning" : "running");
    });
    return () => unsub();
  }, [selectedMachine, thresholds]);

  // COMPONENTS
  const MetricCard = ({ label, value, subtext, icon: Icon, trend }) => (
    <div className="pro-card p-5 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sub font-semibold uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtext && <p className="text-xs text-slate-400 font-medium">{subtext}</p>}
    </div>
  );

  const SensorCard = ({ dataKey, value }) => {
    const meta = SENSOR_METADATA[dataKey] || { ...DEFAULT_META, label: dataKey };
    const Icon = meta.icon;
    return (
      <div className="pro-card p-5 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${meta.bg} ${meta.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-slate-600">{meta.label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-sm font-medium text-slate-400">{meta.unit}</span>
        </div>
        {/* Subtle Bottom Bar */}
        <div className={`absolute bottom-0 left-0 h-1 w-full ${meta.bg.replace('bg-', 'bg-')}-400 opacity-50`} />
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading System...</div>;

  const sensorKeys = Object.keys(sensorData).filter(k => !isNaN(Number(sensorData[k])));

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in">

      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Real-time monitoring and analytics</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-sm font-semibold text-slate-600 pl-2">Device:</span>
          <div className="relative">
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="bg-slate-50 border-none text-slate-900 font-bold text-sm rounded-lg py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {machines.map(m => (
                <option key={m.deviceId} value={m.deviceId}>{m.machineName}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => navigate('/add-machine')}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-l border-slate-100"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ALERTS BANNER */}
      {alerts.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">{alerts.length} Active Alerts: {alerts[0].message}</span>
        </div>
      )}

      {/* BENTO GRID LAYOUT */}
      <div className="bento-grid">

        {/* ROW 1: KEY METRICS */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <MetricCard
            label="System Status"
            value={machineStatus === 'running' ? 'Optimal' : 'Warning'}
            icon={CheckCircle}
            subtext="All systems operational"
            trend="up"
          />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <MetricCard
            label="Uptime"
            value="99.9%"
            icon={Activity}
            subtext="Last 30 days"
            trend="up"
          />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <MetricCard
            label="Efficiency"
            value="94%"
            icon={TrendingUp}
            subtext="+2.4% from average"
            trend="up"
          />
        </div>

        {/* ROW 2: MAIN CHART (Large) */}
        <div className="col-span-1 md:col-span-6 lg:col-span-4 row-span-2 pro-card p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              Live Performance
            </h3>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
          </div>
          <div className="h-[320px] w-full">
            {/* Chart Render */}
            {sensorKeys.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  {sensorKeys.map((key, i) => (
                    i < 2 && <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={SENSOR_METADATA[key]?.stroke || "#64748B"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTemp)"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                <Server className="w-10 h-10 mb-2 opacity-20" />
                <p>No telemetry data available</p>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: SIDE SENSORS */}
        <div className="col-span-1 md:col-span-6 lg:col-span-2 row-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {Object.entries(sensorData).slice(0, 3).map(([key, value]) => (
            <SensorCard key={key} dataKey={key} value={value} />
          ))}
          {Object.keys(sensorData).length === 0 && (
            <div className="pro-card p-6 flex items-center justify-center text-slate-400 h-full">
              <p>Connect sensors to view live metrics</p>
            </div>
          )}
        </div>

        {/* ROW 3: Extra Data Grid if more sensors exist */}
        {Object.entries(sensorData).length > 3 && (
          <div className="col-span-1 md:col-span-6 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {Object.entries(sensorData).slice(3).map(([key, value]) => (
              <SensorCard key={key} dataKey={key} value={value} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
