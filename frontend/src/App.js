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

import Background from "./components/Background";

export default function App() {
  // Apply theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";

    const applyTheme = (theme) => {
      // Force dark mode for now as per "stunning" requirements often imply dark mode
      // But we respect the toggle if we want. 
      // Given the "glass/neon" vibe, dark mode usually looks best.
      // Let's ensure 'dark' class is present for the effects to pop.
      document.documentElement.classList.add("dark");
    };

    applyTheme(savedTheme);
  }, []);

  return (
    <Router>
      <Background />
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
