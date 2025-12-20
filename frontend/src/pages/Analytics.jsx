// frontend/src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, query, orderByKey, limitToLast } from "firebase/database";
import { db } from "../firebaseClient";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Download } from "lucide-react";

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
    onValue(ref(db, "devices"), (snap) => {
      const data = snap.val() || {};
      const list = Object.keys(data).map((id) => ({
        deviceId: id,
        machineName: data[id]?.meta?.machineName || id,
      }));
      setMachines(list);
      setSelectedMachine((cur) => cur || (list[0] && list[0].deviceId) || "");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedMachine) return;
    const histRef = query(ref(db, `history/${selectedMachine}`), orderByKey(), limitToLast(500));
    onValue(histRef, (snap) => setHistory(snap.val() || {}));
  }, [selectedMachine]);

  const series = useMemo(() => {
    return Object.entries(history)
      .map(([k, v]) => ({
        time: isoToDate(k),
        temperature: Number(v.temperature ?? v.temp ?? 0),
        current: Number(v.current ?? 0),
        vibration: Number(v.vibration ?? 0),
        rpm: Number(v.rpm ?? 0),
      }))
      .sort((a, b) => a.time - b.time);
  }, [history]);

  const filtered = useMemo(() => {
    if (!series.length) return [];
    const now = Date.now();
    let cutoff = 0;
    if (range === "1h") cutoff = now - 3600000;
    else if (range === "24h") cutoff = now - 86400000;
    else if (range === "7d") cutoff = now - 604800000;
    return series.filter((s) => s.time.getTime() >= cutoff);
  }, [series, range]);

  const toCSV = () => {
    if (!filtered.length) return alert("No data");
    const rows = [["timestamp", "temperature", "current", "vibration", "rpm"]];
    filtered.forEach(r => rows.push([r.time.toISOString(), r.temperature, r.current, r.vibration, r.rpm]));
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedMachine}-history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ChartCard = ({ title, dataKey, color, fill }) => (
    <div className="pro-card p-6 min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Trend</div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={t => t.toLocaleTimeString()} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#64748B' }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Analytics...</div>;

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in pb-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500">Historical performance data and export</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit">
        <select
          value={selectedMachine}
          onChange={(e) => setSelectedMachine(e.target.value)}
          className="px-3 py-2 bg-slate-50 border-none rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {machines.map(m => <option key={m.deviceId} value={m.deviceId}>{m.machineName}</option>)}
        </select>
        <div className="h-6 w-px bg-slate-200"></div>
        <div className="flex gap-1">
          {['1h', '24h', '7d', 'all'].map(r => (
            <button
              key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${range === r ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {r === '1h' ? '1 Hour' : r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Temperature History" dataKey="temperature" color="#EF4444" fill="#FECACA" />
        <ChartCard title="Current Usage" dataKey="current" color="#EAB308" fill="#FDE047" />
        <ChartCard title="Vibration Levels" dataKey="vibration" color="#8B5CF6" fill="#DDD6FE" />

        <div className="pro-card p-6 min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">RPM Distribution</h3>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" tickFormatter={t => t.toLocaleTimeString()} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="rpm" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
