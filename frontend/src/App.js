// frontend/src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddMachine from "./pages/AddMachine";
import Landing from "./pages/Landing";
import SettingsPage from "./pages/Settings";
import AnalyticsPage from "./pages/Analytics";
import Sidebar from "./components/Sidebar";

// Layout Wrapper for Authenticated Pages
const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-[#F8FAFC]">
    <Sidebar />
    {/* Main Content Area - Offset for fixed sidebar */}
    <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 h-screen overflow-y-auto">
      {children}
    </main>
  </div>
);

export default function App() {
  useEffect(() => {
    // Ensure light mode is forced for professional UI
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated Routes with Sidebar Layout */}
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/add-machine" element={<AppLayout><AddMachine /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
        <Route path="/analytics" element={<AppLayout><AnalyticsPage /></AppLayout>} />
      </Routes>
    </Router>
  );
}
