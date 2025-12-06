// backend/backend.mjs
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import admin from "firebase-admin";

// resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load service account key
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8")
);

// init Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://ai-machine-health-intelligence-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const rtdb = admin.database();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ✅ BACKEND SIMULATION DISABLED
// The ESP32 will send real sensor data directly to Firebase
console.log("✅ Backend simulation DISABLED. Waiting for ESP32 sensor data...");
console.log("📡 ESP32 should be sending data to Firebase at: /devices/MACHINE-33FZTIH1/sensors");

// ✅ API: Return All Machine Data
app.get("/api/machines", async (_req, res) => {
  try {
    const snapshot = await rtdb.ref("/").once("value");
    res.json(snapshot.val() || {});
  } catch (error) {
    console.error("Error fetching machine data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// ✅ API: Receive Sensor Data from ESP32 (PROXY)
app.post("/api/data/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const sensorData = req.body; // { temperature: 25.5, humidity: 60, ... }

  if (!deviceId || !sensorData) {
    return res.status(400).json({ error: "Missing deviceId or data" });
  }

  console.log(`📡 Received data for ${deviceId}:`, sensorData);

  try {
    // 1. Update Realtime Values
    await rtdb.ref(`/devices/${deviceId}/sensors`).update(sensorData);

    // 2. Update Metadata
    await rtdb.ref(`/devices/${deviceId}/meta`).update({
      lastSeen: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
      online: true
    });

    res.json({ success: true, message: "Data forwarded to Firebase" });
  } catch (error) {
    console.error("❌ Error forwarding data to Firebase:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 API available at: http://localhost:${PORT}/api/machines`);
});
