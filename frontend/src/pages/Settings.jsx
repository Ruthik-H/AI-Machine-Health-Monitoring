// File: frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { auth, db } from "../firebaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Monitor,
  Sliders,
  Bell,
  Shield,
  Save,
  Camera,
  Mail,
  Phone,
  Trash2,
  Key,
  CheckCircle,
  Cpu
} from "lucide-react";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";

export default function SettingsPage() {
  const user = auth.currentUser;
  const uid = user?.uid;

  const [activeSection, setActiveSection] = useState("profile");
  const [showSuccess, setShowSuccess] = useState(false);

  // ----------------------------
  // USER SETTINGS
  // ----------------------------
  const [profile, setProfile] = useState({
    name: "",
    email: user?.email || "",
    photo: null,
  });

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    criticalOnly: false,
  });

  // ----------------------------
  // MACHINE SETTINGS
  // ----------------------------
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");

  const [machineInfo, setMachineInfo] = useState({
    machineName: "",
    location: "",
    machineType: "",
  });

  const [thresholds, setThresholds] = useState({
    temperature: 40,
    vibration: 1.8,
    current: 20,
    rpm: 2000,
  });

  // ----------------------------
  // LOAD USER DATA
  // ----------------------------
  useEffect(() => {
    if (!uid) return;

    // load profile
    onValue(ref(db, `users/${uid}/profile`), (snap) => {
      const p = snap.val();
      if (p) setProfile((old) => ({ ...old, ...p }));
    });

    // load preferences
    onValue(ref(db, `users/${uid}/preferences`), (snap) => {
      const p = snap.val();
      if (p) {
        setPreferences(p);
        applyTheme(p.theme);
      }
    });

    // load notifications
    onValue(ref(db, `users/${uid}/notifications`), (snap) => {
      const n = snap.val();
      if (n) setNotifications(n);
    });
  }, [uid]);

  // ----------------------------
  // LOAD MACHINE LIST
  // ----------------------------
  useEffect(() => {
    onValue(ref(db, "devices"), (snap) => {
      const data = snap.val() || {};
      const list = Object.keys(data);
      setMachines(list);
      if (!selectedMachine && list.length > 0) {
        setSelectedMachine(list[0]);
      }
    });
  }, [selectedMachine]);

  // ----------------------------
  // LOAD MACHINE CONFIG (info + thresholds)
  // ----------------------------
  useEffect(() => {
    if (!selectedMachine) return;
    onValue(ref(db, `devices/${selectedMachine}/config`), (snap) => {
      const cfg = snap.val() || {};

      setMachineInfo({
        machineName: cfg?.info?.machineName || selectedMachine,
        location: cfg?.info?.location || "",
        machineType: cfg?.info?.machineType || "",
      });

      setThresholds({
        temperature: cfg?.thresholds?.temperature ?? 40,
        vibration: cfg?.thresholds?.vibration ?? 1.8,
        current: cfg?.thresholds?.current ?? 20,
        rpm: cfg?.thresholds?.rpm ?? 2000,
      });
    });
  }, [selectedMachine]);

  // ----------------------------
  // APPLY THEME
  // ----------------------------
  const applyTheme = (theme) => {
    // Force dark mode logic for now to allow vibrancy, or keep mixed
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    localStorage.setItem("theme", theme);
  };

  // ----------------------------
  // PHOTO UPLOAD
  // ----------------------------
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((p) => ({ ...p, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------
  // SAVE ALL SETTINGS
  // ----------------------------
  const saveAll = async () => {
    if (!uid) return alert("Not logged in");
    if (!selectedMachine) return alert("Select a machine first");

    const updates = {};

    updates[`users/${uid}/profile`] = profile;
    updates[`users/${uid}/preferences`] = preferences;
    updates[`users/${uid}/notifications`] = notifications;

    updates[`devices/${selectedMachine}/config/info`] = machineInfo;
    updates[`devices/${selectedMachine}/config/thresholds`] = {
      temperature: Number(thresholds.temperature),
      vibration: Number(thresholds.vibration),
      current: Number(thresholds.current),
      rpm: Number(thresholds.rpm),
    };

    try {
      await update(ref(db), updates);
      applyTheme(preferences.theme);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save settings: " + err.message);
    }
  };

  // ----------------------------
  // PASSWORD RESET
  // ----------------------------
  const resetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, profile.email);
      alert("Password reset email sent!");
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------
  // DELETE ACCOUNT
  // ----------------------------
  const deleteAccount = async () => {
    if (!window.confirm("Delete account permanently?")) return;

    try {
      await deleteUser(auth.currentUser);
      alert("Account deleted.");
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------------
  // UI STARTS HERE
  // ----------------------------------
  const sections = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "preferences", icon: Monitor, label: "Preferences" },
    { id: "machine", icon: Cpu, label: "Machine Config" },
    { id: "thresholds", icon: Sliders, label: "Thresholds" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "account", icon: Shield, label: "Account" },
  ];

  return (
    <div className="min-h-screen text-white pb-20">

      {/* Top Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass sticky top-0 z-40 border-b border-white/5 p-5 flex justify-between items-center"
      >
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          </div>

          <button
            onClick={saveAll}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </motion.header>

      {/* Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="fixed top-24 right-6 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 mt-10 px-6">

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full md:w-72 glass-card h-fit sticky top-28"
        >
          <nav className="space-y-2">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-300 relative overflow-hidden group ${isActive
                      ? "bg-blue-600/20 text-white font-bold border border-blue-500/30 shadow-inner"
                      : "hover:bg-white/5 text-blue-100/70 hover:text-white"
                    }`}
                >
                  <div className={`active-indicator absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'}`} />
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-accent-cyan' : 'text-blue-300/50 group-hover:text-white'}`} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 glass-card border border-white/5 min-h-[600px] relative overflow-hidden"
        >
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-2"
            >

              {/* PROFILE */}
              {activeSection === "profile" && (
                <div className="space-y-8">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Profile Settings</h2>
                    <p className="text-blue-200/50 mt-1">Manage your public profile and personal details.</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="relative group mx-auto md:mx-0">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 ring-4 ring-white/10 shadow-2xl">
                        {profile.photo ? (
                          <img src={profile.photo} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/20">
                            {profile.name?.charAt(0)?.toUpperCase() || <User size={40} />}
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 p-2.5 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95 border-4 border-slate-900">
                        <Camera className="w-5 h-5 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                      <div className="group">
                        <label className="block text-sm font-medium text-blue-200/60 mb-2">Display Name</label>
                        <input
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-white/20 hover:bg-black/30"
                          placeholder="Enter your name"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-blue-200/60 mb-2">Email Address</label>
                        <input
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-white/20 hover:bg-black/30"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PREFERENCES */}
              {activeSection === "preferences" && (
                <div className="space-y-8">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">App Preferences</h2>
                    <p className="text-blue-200/50 mt-1">Customize your interface experience.</p>
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                    <label className="block text-sm font-medium text-blue-200/60 mb-3">Color Theme</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['light', 'dark', 'system'].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => {
                            setPreferences({ ...preferences, theme });
                            applyTheme(theme);
                          }}
                          className={`p-4 rounded-xl border transition-all ${preferences.theme === theme
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                              : 'bg-black/20 border-white/5 text-gray-400 hover:bg-black/30'
                            }`}
                        >
                          <div className="font-bold capitalize mb-1">{theme} Mode</div>
                          <div className="text-xs opacity-60">
                            {theme === 'light' ? 'Bright & Clear' : theme === 'dark' ? 'Easy on Eyes' : 'Follows OS'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MACHINE CONFIG */}
              {activeSection === "machine" && (
                <div className="space-y-8">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Machine Configuration</h2>
                    <p className="text-blue-200/50 mt-1">Update details for specific devices.</p>
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-200/60 mb-2">Target Machine</label>
                      <select
                        value={selectedMachine}
                        onChange={(e) => setSelectedMachine(e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {machines.map((m) => (
                          <option key={m} value={m} className="bg-slate-900">
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-blue-200/60 mb-2">Machine Name</label>
                        <input
                          value={machineInfo.machineName}
                          onChange={(e) => setMachineInfo({ ...machineInfo, machineName: e.target.value })}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-200/60 mb-2">Location / Zone</label>
                        <input
                          value={machineInfo.location}
                          onChange={(e) => setMachineInfo({ ...machineInfo, location: e.target.value })}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200/60 mb-2">Type / Model</label>
                      <input
                        value={machineInfo.machineType}
                        onChange={(e) => setMachineInfo({ ...machineInfo, machineType: e.target.value })}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* THRESHOLDS */}
              {activeSection === "thresholds" && (
                <div className="space-y-8">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Safety Thresholds</h2>
                    <p className="text-blue-200/50 mt-1">Set limits for automatic alerts.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Temperature (°C)", key: 'temperature', color: 'text-red-400' },
                      { label: "Vibration (mm/s)", key: 'vibration', step: '0.01', color: 'text-fuchsia-400' },
                      { label: "Current (A)", key: 'current', color: 'text-yellow-400' },
                      { label: "RPM Limit", key: 'rpm', color: 'text-green-400' }
                    ].map((item) => (
                      <div key={item.key} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${item.color}`}>{item.label}</div>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            step={item.step || "1"}
                            value={thresholds[item.key]}
                            onChange={(e) => setThresholds({ ...thresholds, [item.key]: Number(e.target.value) })}
                            className="w-full text-2xl font-black bg-transparent border-b border-white/10 focus:border-blue-500 outline-none py-2 text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeSection === "notifications" && (
                <div className="space-y-8">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Alert Preferences</h2>
                    <p className="text-blue-200/50 mt-1">Configure how you receive system updates.</p>
                  </div>

                  <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                    {[
                      { key: 'emailAlerts', label: 'Email Alerts', icon: Mail, color: 'text-blue-400' },
                      { key: 'smsAlerts', label: 'SMS Alerts', icon: Phone, color: 'text-green-400' },
                      { key: 'criticalOnly', label: 'Critical Errors Only', icon: Bell, color: 'text-red-400' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifications[item.key]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACCOUNT */}
              {activeSection === "account" && (
                <div className="space-y-8">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-bold text-red-400">Danger Zone</h2>
                    <p className="text-red-200/50 mt-1">Irreversible account actions.</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={resetPassword}
                      className="w-full flex justify-between items-center p-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                          <Key className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-blue-100">Reset Password</h4>
                          <p className="text-sm text-blue-200/50">Send a password reset link to your email.</p>
                        </div>
                      </div>
                      <span className="text-blue-400 group-hover:translate-x-1 transition-transform">➜</span>
                    </button>

                    <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-200">Delete Account</h4>
                          <p className="text-sm text-red-200/50 mt-1">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={deleteAccount}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg hover:shadow-red-900/40 transition-all w-full md:w-auto"
                      >
                        Confirm Deletion
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
}