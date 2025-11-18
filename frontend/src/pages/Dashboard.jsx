// File: frontend/src/pages/Dashboard.jsx
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
  BarChart3
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

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");

  const [temperature, setTemperature] = useState(0);
  const [vibration, setVibration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [rpm, setRpm] = useState(0);

  const [tempHistory, setTempHistory] = useState([]);
  const [currentHistory, setCurrentHistory] = useState([]);

  const [alerts, setAlerts] = useState([]);
  const [machineStatus, setMachineStatus] = useState("running");

  // thresholds loaded from Firebase per-machine
  const [thresholds, setThresholds] = useState({
    temperature: 40,
    vibration: 1.8,
    current: 20,
    rpm: 2000,
  });

  // voice debounce (useRef to avoid re-renders)
  const lastVoiceTimeRef = useRef(0);

  // ---------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => {
      setUser(cur || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ---------------------------------------------------
  // LOAD DEVICE LIST (force your device id if you want)
  // ---------------------------------------------------
  useEffect(() => {
    const deviceRef = ref(db, "devices");

    const unsub = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val() || {};

      const list = Object.keys(data).map((id) => ({
        deviceId: id,
        machineName: data[id]?.meta?.machineName || id,
      }));

      setMachines(list);

      // Keep your hard-coded selection if desired, otherwise first element
      if (!selectedMachine) {
        // If the specific device exists prefer it, otherwise first device
        const preferred = list.find((l) => l.deviceId === "MACHINE-33FZTIH1");
        setSelectedMachine(preferred ? preferred.deviceId : (list[0]?.deviceId || ""));
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------
  // LOAD THRESHOLDS FOR SELECTED MACHINE
  // ---------------------------------------------------
  useEffect(() => {
    if (!selectedMachine) return;

    const threshRef = ref(db, `devices/${selectedMachine}/config/thresholds`);
    const unsub = onValue(threshRef, (snap) => {
      const data = snap.val();
      if (data) {
        // keep numeric conversion and fallback
        setThresholds({
          temperature: Number(data.temperature ?? 40),
          vibration: Number(data.vibration ?? 1.8),
          current: Number(data.current ?? 20),
          rpm: Number(data.rpm ?? 2000),
        });
      } else {
        // fallback defaults - these are safe defaults if config doesn't exist yet
        setThresholds({
          temperature: 40,
          vibration: 1.8,
          current: 20,
          rpm: 2000,
        });
      }
    });

    return () => unsub();
  }, [selectedMachine]);

  // ---------------------------------------------------
  // LOAD SENSOR DATA FOR SELECTED MACHINE
  // ---------------------------------------------------
  useEffect(() => {
    if (!selectedMachine) return;

    const sensorRef = ref(db, `devices/${selectedMachine}/sensors`);
    const unsub = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setTemperature(0);
        setVibration(0);
        setCurrent(0);
        setVoltage(0);
        setRpm(0);
        setAlerts([]);
        setMachineStatus("running");
        return;
      }

      const now = new Date().toLocaleTimeString();

      const t = Number(data.temperature || 0);
      const vib = Number(data.vibration || 0);
      const cur = Number(data.current || 0);
      const volt = Number(data.voltage || 0);
      const rpmVal = Number(data.rpm || 0);

      setTemperature(t);
      setVibration(vib);
      setCurrent(cur);
      setVoltage(volt);
      setRpm(rpmVal);

      setTempHistory((p) => [...p.slice(-19), { time: now, value: t }]);
      setCurrentHistory((p) => [...p.slice(-19), { time: now, value: cur }]);

      // ALERTS based on dynamic thresholds
      const newAlerts = [];
      if (t > thresholds.temperature) newAlerts.push({ type: "critical", message: `Temperature above ${thresholds.temperature}°C` });
      if (vib > thresholds.vibration) newAlerts.push({ type: "warning", message: `Vibration above ${thresholds.vibration}` });
      if (cur > thresholds.current) newAlerts.push({ type: "warning", message: `Current above ${thresholds.current}A` });

      setAlerts(newAlerts);

      if (newAlerts.find((a) => a.type === "critical")) setMachineStatus("critical");
      else if (newAlerts.length > 0) setMachineStatus("warning");
      else setMachineStatus("running");
    });

    return () => unsub();
  }, [selectedMachine, thresholds]);

  // ---------------------------------------------------
  // VOICE ALERTS (debounced + avoid restart)
  // ---------------------------------------------------
  useEffect(() => {
    if (!selectedMachine) return;

    const now = Date.now();

    // cooldown in ms
    const COOLDOWN = 10000; // 10 seconds

    // if within cooldown skip
    if (now - lastVoiceTimeRef.current < COOLDOWN) return;

    // don't speak if already speaking
    if (typeof window !== "undefined" && "speechSynthesis" in window && speechSynthesis.speaking) {
      // do not interrupt current speech
      return;
    }

    let msg = "";
    if (temperature > thresholds.temperature) {
      msg = `Warning. Temperature is ${temperature.toFixed(1)} degrees, above the threshold ${thresholds.temperature}.`;
    } else if (vibration > thresholds.vibration) {
      msg = `Alert. Vibration is ${vibration.toFixed(2)}, above ${thresholds.vibration}.`;
    } else if (current > thresholds.current) {
      msg = `Alert. Current is ${current.toFixed(1)} amps, above ${thresholds.current}.`;
    }

    if (msg !== "" && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(msg);
      utter.lang = "en-US";

      // When utterance finishes we could allow immediate next (optional)
      utter.onend = () => {
        // no-op; cooldown still enforced by timestamp
      };

      speechSynthesis.speak(utter);
      lastVoiceTimeRef.current = now;
    }
  }, [temperature, vibration, current, thresholds, selectedMachine]);

  // ---------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    navigate("/login");
  };

  // ---------------------------------------------------
  // UI COMPONENTS
  // ---------------------------------------------------
  const StatusBadge = ({ status }) => {
    const cfg = {
      running: { icon: CheckCircle, color: "bg-green-100 text-green-700 border-green-200", text: "Running Normal" },
      warning: { icon: AlertTriangle, color: "bg-yellow-100 text-yellow-700 border-yellow-200", text: "Warning" },
      critical: { icon: XCircle, color: "bg-red-100 text-red-700 border-red-200", text: "Critical Alert" },
    }[status] || { icon: CheckCircle, color: "bg-gray-100 text-gray-700", text: status };

    const Icon = cfg.icon;
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${cfg.color}`}>
        <Icon className="w-5 h-5" />
        <span className="font-semibold text-sm">{cfg.text}</span>
      </div>
    );
  };

  const SensorCard = ({ title, value, unit, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-3xl font-bold text-gray-900">{Number(value).toFixed(1)}</p>
        <span className="text-gray-500">{unit}</span>
      </div>
    </div>
  );

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
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
              <h1 className="text-xl font-bold">AI Machine Health Monitor</h1>
              <p className="text-xs text-cyan-300">Real-time Industrial Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusBadge status={machineStatus} />

            <button className="p-2 hover:bg-white/10 relative">
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>

            <button onClick={() => navigate("/analytics")} className="p-2 hover:bg-white/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </button>

            <button onClick={() => navigate("/settings")} className="p-2 hover:bg-white/10">
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* BODY CONTENT */}
      <div className="p-6">

        {/* TITLE + MACHINE SELECT */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Machine Status Overview</h2>
            <p className="text-gray-600">Monitoring: {selectedMachine}</p>
            <p className="text-xs text-gray-500">Thresholds: T {thresholds.temperature}°C · V {thresholds.vibration} · I {thresholds.current}A</p>
          </div>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
          >
            {machines.map((m) => (
              <option key={m.deviceId} value={m.deviceId}>
                {m.machineName} ({m.deviceId})
              </option>
            ))}
          </select>
        </div>

        {/* ALERTS */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex gap-3 p-4 rounded-lg border-l-4 ${
                  alert.type === "critical"
                    ? "bg-red-50 border-red-500"
                    : "bg-yellow-50 border-yellow-500"
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-gray-900">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SENSOR CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          <SensorCard title="Temperature" value={temperature} unit="°C" icon={Thermometer} color="bg-red-500" />
          <SensorCard title="Vibration" value={vibration} unit="mm/s" icon={Waves} color="bg-purple-500" />
          <SensorCard title="Current" value={current} unit="A" icon={Zap} color="bg-yellow-500" />
          <SensorCard title="Voltage" value={voltage} unit="V" icon={Power} color="bg-blue-500" />
          <SensorCard title="RPM" value={rpm} unit="RPM" icon={Gauge} color="bg-green-500" />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Trend */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-red-500" /> Temperature Trend
            </h3>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={tempHistory}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ddd" }} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ff4444"
                  strokeWidth={2.5}
                  fill="url(#tempGradient)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Current Trend */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Current Trend
            </h3>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={currentHistory}>
                <defs>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ddd" }} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  fill="url(#currentGradient)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MACHINE INFO */}
        <div className="bg-white p-6 rounded-xl border shadow-sm mt-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-500" /> Machine Information
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 text-gray-800">
            <div><strong>ID:</strong> {selectedMachine}</div>
            <div><strong>Status:</strong> {machineStatus.toUpperCase()}</div>
            <div><strong>Efficiency:</strong> 94%</div>
            <div><strong>Power:</strong> 3.34 kW</div>
          </div>
        </div>
      </div>
    </div>
  );
}