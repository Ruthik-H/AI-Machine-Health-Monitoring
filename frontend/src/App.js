// frontend/src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddMachine from "./pages/AddMachine";
import Landing from "./pages/Landing";

import SettingsPage from "./pages/Settings";
import AnalyticsPage from "./pages/Analytics";

export default function App() {
  // Apply theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";

    const applyTheme = (theme) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    applyTheme(savedTheme);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Add Machine */}
        <Route path="/add-machine" element={<AddMachine />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Analytics */}
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Router>
  );
}
