// src/components/MachineDashboard.js
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar, Legend } from "recharts";

export default function MachineDashboard() {
  const [data, setData] = useState({
    temp: 68,
    vibration: 12,
    load: 78,
    health: 94,
    status: "Optimal"
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData({
        temp: 65 + Math.random() * 10,
        vibration: 5 + Math.random() * 15,
        load: 60 + Math.random() * 30,
        health: 85 + Math.random() * 15,
        status: ["Optimal", "Good", "Warning"][Math.floor(Math.random() * 3)]
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const pieData = [
    { name: "Health", value: data.health, color: "#a78bfa" },
    { name: "Risk", value: 100 - data.health, color: "#e0e7ff" }
  ];

  const radialData = [
    { name: "Load", value: data.load, fill: "#7c3aed" },
  ];

  return (
    <div className="heaven-body">
      <div className="main-card">
        <h1>Machine Alpha-01</h1>
        <p className="status-tag" style={{ background: data.health > 90 ? "#ecfdf5" : data.health > 70 ? "#fef3c7" : "#fee2e2", color: data.health > 90 ? "#166534" : data.health > 70 ? "#92400e" : "#991b1b" }}>
          {data.status}
        </p>

        <div className="grid-4">
          {/* PIE HEALTH */}
          <div className="chart-card">
            <h3>Overall Health</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="pie-number">
                  {data.health.toFixed(0)}%
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* RADIAL LOAD */}
          <div className="chart-card">
            <h3>Current Load</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#7c3aed" background={{ fill: "#e0e7ff" }} />
                <text x="50%" y="50%" textAnchor="middle" className="pie-number">
                  {data.load.toFixed(0)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* TEMP LINE */}
          <div className="chart-card">
            <h3>Temperature (°C)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={Array(10).fill().map((_, i) => ({ name: i, value: 60 + Math.random() * 15 }))}>
                <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="big-number">{data.temp.toFixed(1)}°C</p>
          </div>

          {/* VIBRATION */}
          <div className="chart-card">
            <h3>Vibration Level</h3>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${data.vibration * 5}%`, background: data.vibration < 15 ? "#86efac" : "#f87171" }}></div>
            </div>
            <p className="big-number">{data.vibration.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}