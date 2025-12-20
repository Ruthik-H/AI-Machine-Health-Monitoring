// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { auth, db } from "../firebaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
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

  // USER SETTINGS
  const [profile, setProfile] = useState({ name: "", email: user?.email || "", photo: null });
  const [preferences, setPreferences] = useState({ theme: "light", language: "en" });
  const [notifications, setNotifications] = useState({ emailAlerts: true, smsAlerts: false, criticalOnly: false });

  // MACHINE SETTINGS
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [machineInfo, setMachineInfo] = useState({ machineName: "", location: "", machineType: "" });
  const [thresholds, setThresholds] = useState({ temperature: 40, vibration: 1.8, current: 20, rpm: 2000 });

  // LOAD DATA
  useEffect(() => {
    if (!uid) return;
    onValue(ref(db, `users/${uid}/profile`), (snap) => { if (snap.val()) setProfile(prev => ({ ...prev, ...snap.val() })) });
    onValue(ref(db, `users/${uid}/preferences`), (snap) => { if (snap.val()) setPreferences(snap.val()) });
    onValue(ref(db, `users/${uid}/notifications`), (snap) => { if (snap.val()) setNotifications(snap.val()) });
  }, [uid]);

  useEffect(() => {
    onValue(ref(db, "devices"), (snap) => {
      const list = Object.keys(snap.val() || {});
      setMachines(list);
      if (!selectedMachine && list.length) setSelectedMachine(list[0]);
    });
  }, [selectedMachine]);

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile(p => ({ ...p, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const saveAll = async () => {
    if (!uid || !selectedMachine) return;
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
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  const sections = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "preferences", icon: Monitor, label: "Preferences" },
    { id: "machine", icon: Cpu, label: "Machine Config" },
    { id: "thresholds", icon: Sliders, label: "Thresholds" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "account", icon: Shield, label: "Account" },
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto animate-fade-in text-slate-800">

      {/* PROFESSIONAL HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage global preferences and device configurations</p>
        </div>

        <button
          onClick={saveAll}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-200 shadow-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Settings saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* SETTINGS MENU (Internal Sidebar) */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isActive
                      ? 'bg-white shadow-sm border border-slate-200 text-blue-600 font-semibold'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1">
          <div className="pro-card p-8 min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* SECTIONS */}
                {activeSection === 'profile' && (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Profile Settings</h2>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                          {profile.photo ? <img src={profile.photo} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-300" />}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handlePhotoUpload} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Profile Picture</h3>
                        <p className="text-sm text-slate-500">Click to upload a new avatar</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
                        <input
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <input
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                          value={profile.email} readOnly
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'preferences' && (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Interface Preferences</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {['light', 'dark', 'system'].map(theme => (
                        <button
                          key={theme}
                          onClick={() => setPreferences({ ...preferences, theme })}
                          className={`p-4 border rounded-xl text-left ${preferences.theme === theme ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <div className="font-semibold capitalize text-slate-900">{theme}</div>
                          <div className="text-xs text-slate-500">Theme mode</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {activeSection === 'machine' && (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Device Configuration</h2>
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Select Device</label>
                      <select
                        value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-xl"
                      >
                        {machines.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Machine Name</label>
                        <input className="w-full p-2 border border-slate-300 rounded-lg" value={machineInfo.machineName} onChange={e => setMachineInfo({ ...machineInfo, machineName: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Model Type</label>
                        <input className="w-full p-2 border border-slate-300 rounded-lg" value={machineInfo.machineType} onChange={e => setMachineInfo({ ...machineInfo, machineType: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'thresholds' && (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Safety Thresholds</h2>
                    <div className="space-y-4">
                      {Object.entries({ temperature: "Temperature (°C)", vibration: "Vibration (mm/s)", current: "Current (A)", rpm: "RPM Limit" }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-semibold text-slate-700">{label}</span>
                          <input
                            type="number" className="w-24 text-right p-1 bg-transparent font-bold border-b border-slate-300 focus:border-blue-500 outline-none"
                            value={thresholds[key]} onChange={e => setThresholds({ ...thresholds, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}