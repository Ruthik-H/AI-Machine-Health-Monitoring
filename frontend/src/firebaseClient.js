// src/firebaseClient.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Needed for live sensor data

const firebaseConfig = {
  apiKey: "PROTECTED!!",
  authDomain: "ai-machine-health-intelligence.firebaseapp.com",
  databaseURL: "https://ai-machine-health-intelligence-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ai-machine-health-intelligence",
  storageBucket: "ai-machine-health-intelligence.appspot.com",  
  messagingSenderId: "1051623327093",
  appId: "1:1051623327093:web:552d9f1e521a3c9e62bf3c",
  measurementId: "G-YSFBH6C5Y6"
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Export Firebase Authentication
export const auth = getAuth(app);

// ✅ Export Realtime Database instance
export const db = getDatabase(app);
