// File: frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { auth, db } from "../firebaseClient";
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
  // SAVE ALL SETTINGS (Creates config + thresholds if missing)
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
      setTimeout(() => setShowSuccess(false), 2000);
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
    { id: "machine", icon: SettingsIcon, label: "Machine Config" },
    { id: "thresholds", icon: Sliders, label: "Thresholds" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "account", icon: Shield, label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <button
          onClick={saveAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          <Save className="w-4 h-4" />
          Save All
        </button>
      </header>

      {/* Toast */}
      {showSuccess && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Saved successfully!
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 min-h-screen">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left mb-1 ${
                  activeSection === s.id
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                {s.label}
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 p-8">
          {/* PROFILE */}
          {activeSection === "profile" && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Profile Settings</h2>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-300">
                      {profile.photo ? (
                        <img src={profile.photo} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {profile.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full cursor-pointer shadow-lg">
                      <Camera className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>

                  <div className="flex-1">
                    <label>Name</label>
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full p-2 mt-1 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                    />

                    <label className="mt-4">Email</label>
                    <input
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full p-2 mt-1 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES */}
          {activeSection === "preferences" && (
            <div>
              <h2 className="text-2xl font-bold mb-3">App Preferences</h2>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                <label className="block mb-2 font-medium">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => {
                    setPreferences({ ...preferences, theme: e.target.value });
                    applyTheme(e.target.value);
                  }}
                  className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          )}

          {/* MACHINE CONFIG */}
          {activeSection === "machine" && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Machine Configuration</h2>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                <label>Select Machine</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                >
                  {machines.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <label className="mt-4 block">Machine Name</label>
                <input
                  value={machineInfo.machineName}
                  onChange={(e) =>
                    setMachineInfo({ ...machineInfo, machineName: e.target.value })
                  }
                  className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                />

                <label className="mt-4 block">Location</label>
                <input
                  value={machineInfo.location}
                  onChange={(e) =>
                    setMachineInfo({ ...machineInfo, location: e.target.value })
                  }
                  className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                />

                <label className="mt-4 block">Machine Type</label>
                <input
                  value={machineInfo.machineType}
                  onChange={(e) =>
                    setMachineInfo({ ...machineInfo, machineType: e.target.value })
                  }
                  className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                />
              </div>
            </div>
          )}

          {/* THRESHOLDS */}
          {activeSection === "thresholds" && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Threshold Settings</h2>

              <div className="grid grid-cols-2 gap-6">

                {/* Temperature */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                  <label>Temperature (°C)</label>
                  <input
                    type="number"
                    value={thresholds.temperature}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, temperature: Number(e.target.value) })
                    }
                    className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                </div>

                {/* Vibration */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                  <label>Vibration</label>
                  <input
                    type="number"
                    step="0.01"
                    value={thresholds.vibration}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, vibration: Number(e.target.value) })
                    }
                    className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                </div>

                {/* Current */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                  <label>Current (A)</label>
                  <input
                    type="number"
                    value={thresholds.current}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, current: Number(e.target.value) })
                    }
                    className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                </div>

                {/* RPM */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                  <label>RPM</label>
                  <input
                    type="number"
                    value={thresholds.rpm}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, rpm: Number(e.target.value) })
                    }
                    className="w-full p-2 border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Notification Settings</h2>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span>Email Alerts</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={notifications.emailAlerts}
                    onChange={(e) =>
                      setNotifications({ ...notifications, emailAlerts: e.target.checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-500" />
                    <span>SMS Alerts</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={notifications.smsAlerts}
                    onChange={(e) =>
                      setNotifications({ ...notifications, smsAlerts: e.target.checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-500" />
                    <span>Critical Only</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={notifications.criticalOnly}
                    onChange={(e) =>
                      setNotifications({ ...notifications, criticalOnly: e.target.checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {activeSection === "account" && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Account Settings</h2>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
                <button
                  onClick={resetPassword}
                  className="w-full flex justify-between items-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4"
                >
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-600" />
                    <span>Reset Password</span>
                  </div>
                  ➜
                </button>

                <div className="border border-red-300 dark:border-red-700 p-4 rounded-lg bg-red-50 dark:bg-red-900">
                  <p className="text-red-700 dark:text-red-300 mb-3">
                    Deleting your account is permanent.
                  </p>
                  <button
                    onClick={deleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Small fade animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}