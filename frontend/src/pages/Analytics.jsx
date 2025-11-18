// File: frontend/src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, query, orderByKey, limitToLast } from "firebase/database";
import { db } from "../firebaseClient";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart, Bar } from "recharts";
import { Cpu, Download } from "lucide-react";

function isoToDate(key) {
  const d = new Date(key);
  if (!isNaN(d)) return d;
  const n = Number(key);
  return new Date(n > 1e12 ? n : n * 1000);
}

export default function Analytics() {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [history, setHistory] = useState({});
  const [range, setRange] = useState("1h");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deviceRef = ref(db, "devices");
    const unsub = onValue(deviceRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.keys(data).map((id) => ({
        deviceId: id,
        machineName: data[id]?.meta?.machineName || id,
      }));
      setMachines(list);
      setSelectedMachine((cur) => cur || (list[0] && list[0].deviceId) || "");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedMachine) return;
    const histRef = query(ref(db, `history/${selectedMachine}`), orderByKey(), limitToLast(500));
    const unsub = onValue(histRef, (snap) => {
      const data = snap.val() || {};
      setHistory(data);
    });
    return () => unsub();
  }, [selectedMachine]);

  const series = useMemo(() => {
    const arr = Object.entries(history)
      .map(([k, v]) => {
        const t = isoToDate(k);
        return {
          timeKey: k,
          time: t,
          temperature: Number(v.temperature ?? v.temp ?? 0),
          current: Number(v.current ?? 0),
          vibration: Number(v.vibration ?? 0),
          rpm: Number(v.rpm ?? 0),
        };
      })
      .sort((a, b) => a.time - b.time);
    return arr;
  }, [history]);

  const filtered = useMemo(() => {
    if (!series.length) return [];
    const now = Date.now();
    let cutoff = 0;
    if (range === "1h") cutoff = now - 3600000;
    else if (range === "24h") cutoff = now - 86400000;
    else if (range === "7d") cutoff = now - 604800000;
    else cutoff = 0;
    return series.filter((s) => s.time.getTime() >= cutoff);
  }, [series, range]);

  const toCSV = () => {
    if (!filtered.length) return alert("No data");
    const rows = [["timestamp", "temperature", "current", "vibration", "rpm"]];
    for (const r of filtered) {
      rows.push([r.time.toISOString(), r.temperature, r.current, r.vibration, r.rpm]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedMachine || "machine"}-history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">

      <nav className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-md p-4 mb-6 flex items-center gap-4">
        <Cpu className="w-6 h-6 text-cyan-300" />
        <div>
          <h1 className="font-bold">Analytics</h1>
          <p className="text-xs text-cyan-200">Historical trends & reports</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={toCSV} className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </nav>

      <div className="mb-6 flex items-center gap-4">
        <select
          className="px-3 py-2 border rounded-lg"
          value={selectedMachine}
          onChange={(e) => setSelectedMachine(e.target.value)}
        >
          <option value="">-- select machine --</option>
          {machines.map((m) => (
            <option key={m.deviceId} value={m.deviceId}>
              {m.machineName} ({m.deviceId})
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button onClick={() => setRange("1h")} className={`px-3 py-2 rounded ${range === "1h" ? "bg-blue-600 text-white" : "bg-white"}`}>Last 1 hour</button>
          <button onClick={() => setRange("24h")} className={`px-3 py-2 rounded ${range === "24h" ? "bg-blue-600 text-white" : "bg-white"}`}>24 hours</button>
          <button onClick={() => setRange("7d")} className={`px-3 py-2 rounded ${range === "7d" ? "bg-blue-600 text-white" : "bg-white"}`}>7 days</button>
          <button onClick={() => setRange("all")} className={`px-3 py-2 rounded ${range === "all" ? "bg-blue-600 text-white" : "bg-white"}`}>All</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">Temperature</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                <Area type="monotone" dataKey="temperature" stroke="#ef4444" fill="#fecaca" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">Current</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                <Area type="monotone" dataKey="current" stroke="#f59e0b" fill="#fde68a" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">Vibration</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                <Area type="monotone" dataKey="vibration" stroke="#7c3aed" fill="#ede9fe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">RPM (bar)</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                <Bar dataKey="rpm" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <SummaryCard data={filtered} />
    </div>
  );
}

function SummaryCard({ data }) {
  if (!data || data.length === 0)
    return <div className="mt-6 text-gray-500">No historical data for this range.</div>;

  const temps = data.map((d) => d.temperature);
  const currents = data.map((d) => d.current);
  const vib = data.map((d) => d.vibration);
  const avg = (arr) => (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2);

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm mt-6">
      <h3 className="font-semibold mb-3">Summary</h3>
      <div className="grid grid-cols-2 gap-4 text-gray-800">
        <div><strong>Avg Temp:</strong> {avg(temps)} °C</div>
        <div><strong>Max Temp:</strong> {Math.max(...temps)}</div>
        <div><strong>Avg Current:</strong> {avg(currents)} A</div>
        <div><strong>Max Current:</strong> {Math.max(...currents)}</div>
        <div><strong>Avg Vibration:</strong> {avg(vib)} mm/s</div>
        <div><strong>Samples:</strong> {data.length}</div>
      </div>
    </div>
  );
}
