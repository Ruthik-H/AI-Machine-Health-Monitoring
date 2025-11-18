// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebaseClient";
import { ref, onValue } from "firebase/database";

import {
  Thermometer,
  Waves,
  Zap,
  Power,
  Gauge,
  Cpu,
  Bell,
  Settings,
  LogOut,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HardDrive,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // selected machine
  const [selectedMachine, setSelectedMachine] = useState(null);

  // all registered machines from Firebase
  const [machines, setMachines] = useState([]);

  // live sensor values
  const [temperature, setTemperature] = useState(0);
  const [vibration, setVibration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [rpm, setRpm] = useState(0);

  const [machineStatus, setMachineStatus] = useState("running");
  const [alerts, setAlerts] = useState([]);

  // wait for login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => {
      if (cur) {
        setUser(cur);
        setLoading(false);
      } else navigate("/login");
    });
    return () => unsub();
  }, [navigate]);

  // load all machines
  useEffect(() => {
    if (!user) return;

    const machinesRef = ref(db, `users/${user.uid}/machines`);

    onValue(machinesRef, (snapshot) => {
      const val = snapshot.val() || {};
      const list = Object.keys(val).map((id) => ({
        id,
        ...val[id],
      }));
      setMachines(list);

      if (list.length > 0 && !selectedMachine) {
        setSelectedMachine(list[0].id);
      }
    });
  }, [user]);

  // load live sensor data
  useEffect(() => {
    if (!selectedMachine) return;

    const sensorRef = ref(db, `devices/${selectedMachine}/sensors`);

    onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setTemperature(Number(data.temperature) || 0);
      setVibration(Number(data.vibration) || 0);
      setCurrent(Number(data.current) || 0);
      setVoltage(Number(data.voltage) || 0);
      setRpm(Number(data.rpm) || 0);

      // alerts
      const newAlerts = [];
      if (data.temperature > 75)
        newAlerts.push({ type: "critical", message: "High Temperature!" });
      if (data.vibration > 0.8)
        newAlerts.push({ type: "warning", message: "High Vibration" });
      if (data.current > 18)
        newAlerts.push({ type: "warning", message: "Current Spike" });

      setAlerts(newAlerts);

      if (newAlerts.some((a) => a.type === "critical"))
        setMachineStatus("critical");
      else if (newAlerts.length > 0)
        setMachineStatus("warning");
      else
        setMachineStatus("running");
    });
  }, [selectedMachine]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // sensor card
  const SensorCard = ({ title, value, unit, icon: Icon, min, max, color }) => {
    const safeVal = Number(value);
    const pct = ((safeVal - min) / (max - min)) * 100;

    return (
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="text-white w-6 h-6" />
          </div>
          {pct > 80 && <AlertTriangle className="text-yellow-500" />}
        </div>

        <h3 className="mt-4 text-gray-500 text-sm">{title}</h3>

        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-bold">{safeVal.toFixed(1)}</p>
          <span className="text-gray-400">{unit}</span>
        </div>
      </div>
    );
  };

  if (loading)
    return <div className="text-center p-20">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* top navbar */}
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <Cpu className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold">AI Machine Health Monitor</h1>
            <p className="text-xs text-cyan-300">Real-time Industrial Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Add Machine Button */}
          <button
            onClick={() => navigate("/add-machine")}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-semibold"
          >
            <PlusCircle className="w-5 h-5" />
            Add Machine
          </button>

          <button onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </nav>

      {/* page */}
      <div className="p-6">

        {/* machine selector */}
        <div className="mb-6">
          <label className="text-gray-600 font-medium">Select Machine:</label>
          <select
            className="block border p-2 rounded mt-2"
            value={selectedMachine || ""}
            onChange={(e) => setSelectedMachine(e.target.value)}
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machineName} ({m.id})
              </option>
            ))}
          </select>
        </div>

        {/* sensor grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <SensorCard title="Temperature" value={temperature} unit="°C" icon={Thermometer} min={0} max={100} color="bg-red-500" />
          <SensorCard title="Vibration" value={vibration} unit="mm/s" icon={Waves} min={0} max={1.5} color="bg-purple-500" />
          <SensorCard title="Current" value={current} unit="A" icon={Zap} min={0} max={20} color="bg-yellow-500" />
          <SensorCard title="Voltage" value={voltage} unit="V" icon={Power} min={200} max={240} color="bg-blue-500" />
          <SensorCard title="RPM" value={rpm} unit="RPM" icon={Gauge} min={1000} max={2000} color="bg-green-500" />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-6 space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`p-4 border-l-4 rounded bg-${a.type === "critical" ? "red" : "yellow"}-50`}
              >
                <p className="font-semibold">{a.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
