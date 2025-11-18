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

// ✅ Generate Random Machine Data
function generateData() {
  return {
    temperature: (40 + Math.random() * 60).toFixed(2),   // 40 to 100°C
    vibration: (Math.random() * 10).toFixed(2),          // 0 to 10 mm/s
    load: (Math.random() * 100).toFixed(2),              // 0 to 100%
    rpm: Math.floor(500 + Math.random() * 2500),         // 500 - 3000 RPM
    humidity: (20 + Math.random() * 60).toFixed(2),      // 20% - 80%
    status: ["normal", "warning", "critical"][Math.floor(Math.random() * 3)],
    lastUpdated: new Date().toISOString(),
  };
}

// ✅ Update Firebase Every 3 Seconds
setInterval(() => {
  rtdb.ref("/").update({
    machine1: generateData(),
    machine2: generateData(),
    machine3: generateData(),
  });
  console.log("✅ Random machine data updated");
}, 3000);

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

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
