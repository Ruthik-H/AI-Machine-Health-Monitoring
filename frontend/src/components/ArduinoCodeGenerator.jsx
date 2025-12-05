import React, { useState, useEffect } from 'react';
import { firebaseConfig } from '../firebaseClient';
import { Copy, Download, Wifi, Eye, EyeOff, Code, CheckCircle, Zap, Shield, AlertTriangle } from 'lucide-react';
import { SENSOR_DEFINITIONS } from '../data/sensors';

export default function ArduinoCodeGenerator({ deviceId, sensors }) {
  // config is a map of { sensorId: boolean }
  const config = sensors || {};

  const [activeTab, setActiveTab] = useState('code'); // 'code', 'wiring', 'security'
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Get active sensor definitions
  const activeSensors = Object.keys(config)
    .filter((id) => config[id] && SENSOR_DEFINITIONS[id])
    .map((id) => SENSOR_DEFINITIONS[id]);

  useEffect(() => {
    generateCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssid, password, deviceId, config]);

  const generateCode = () => {
    // 1. Collect all code parts
    const parts = {
      includes: new Set(["#include <WiFi.h>", "#include <FirebaseESP32.h>", "#include <time.h>"]),
      defines: new Set([`#define WIFI_SSID "${ssid || 'YOUR_WIFI_SSID'}"`, `#define WIFI_PASSWORD "${password || 'YOUR_WIFI_PASSWORD'}"`, `#define DEVICE_ID "${deviceId}"`, `#define API_KEY "${firebaseConfig.apiKey}"`, `#define DATABASE_URL "${firebaseConfig.databaseURL}"`]),
      setup: [],
      read: [],
      vars: [],
      send: []
    };

    activeSensors.forEach(s => {
      if (s.code.include) s.code.include.split('\n').forEach(l => parts.includes.add(l.trim()));
      if (s.code.define) s.code.define.split('\n').forEach(l => parts.defines.add(l.trim()));
      if (s.code.setup) parts.setup.push(`  // ${s.label}\n  ${s.code.setup}`);
      if (s.code.vars) parts.vars.push(s.code.vars);
      if (s.code.read) parts.read.push(`  // ${s.label}\n  ${s.code.read}`);
      if (s.code.send) parts.send.push(`  ${s.code.send}`);
    });

    const code = `// File: esp32_main.ino
${Array.from(parts.includes).join('\n')}

// ----------------------
// USER CONFIG
// ----------------------
${Array.from(parts.defines).join('\n')}
#define RELAY_PIN 5 

// ----------------------
// Firebase & Time
// ----------------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig conf;

const char* ntp1 = "pool.ntp.org";
const char* ntp2 = "time.nist.gov";
const long gmtOffset = 0;
const int daylightOffset = 0;

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 2000; // 2 sec

// Global Sensor Variables
${parts.vars.join('\n')}

// Helper for paths
String sensorsPath(const char *sensorName) {
  return "/devices/" + String(DEVICE_ID) + "/sensors/" + String(sensorName);
}

void connectWiFi() {
  Serial.print("Connecting to: "); Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.println("\\nConnected! IP: "); Serial.println(WiFi.localIP());
}

void firebaseSetup() {
  conf.api_key = API_KEY;
  conf.database_url = DATABASE_URL;
  Firebase.signUp(&conf, &auth, "", "");
  Firebase.begin(&conf, &auth);
  Firebase.reconnectWiFi(true);
}

void syncTime() {
  configTime(gmtOffset, daylightOffset, ntp1, ntp2);
  time_t now = time(nullptr);
  while (now < 1600000000) { delay(200); now = time(nullptr); }
}

String isoNow() {
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char buf[32];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02dZ",
    timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
    timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  return String(buf);
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\\n=== ESP32 Universal Firmware ===");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // ON initially

  connectWiFi();
  syncTime();
  firebaseSetup();
  randomSeed(analogRead(0));

  // Sensor Setup
${parts.setup.join('\n')}
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!Firebase.ready()) Firebase.reconnectWiFi(true);

  unsigned long now = millis();

  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    
    // 1. Read Sensors
${parts.read.join('\n')}

    // 2. Send to Firebase
${parts.send.join('\n')}
    
    // Heartbeat
    Firebase.setInt(fbdo, ("/devices/" + String(DEVICE_ID) + "/meta/lastSeen").c_str(), time(nullptr));
    Firebase.setBool(fbdo, ("/devices/" + String(DEVICE_ID) + "/meta/online").c_str(), true);
  }
}
`;
    setGeneratedCode(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "esp32.ino";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Code className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Device Configuration</h3>
        </div>
        <div className="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">
          ID: {deviceId}
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'code' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Code className="w-4 h-4" /> Generated Code
        </button>
        <button
          onClick={() => setActiveTab('wiring')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'wiring' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Zap className="w-4 h-4" /> Wiring Guide
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Shield className="w-4 h-4" /> Security Info
        </button>
      </div>

      <div className="p-6">

        {/* TAB: CODE */}
        {activeTab === 'code' && (
          <div className="animate-fadeIn">
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Wifi className="w-4 h-4" /> WiFi Configuration
              </h4>
              <p className="text-sm text-blue-600 mb-4">
                Enter your WiFi credentials below. They will be automatically inserted into the code.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">WiFi Name (SSID)</label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="e.g., Home_WiFi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">WiFi Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-md shadow hover:bg-gray-50 transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md shadow hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download .ino
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <pre className="text-xs font-mono text-gray-300 leading-relaxed">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-all transform hover:scale-[1.02]"
              >
                <Download className="w-5 h-5" />
                Download Code for ESP32
              </button>
            </div>
          </div>
        )}

        {/* TAB: WIRING */}
        {activeTab === 'wiring' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-yellow-800">Safety First</h4>
                <p className="text-sm text-yellow-700">Double-check all connections before powering on. Ensure common ground between ESP32 and external power supplies.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSensors.map((sensor, idx) => (
                <div key={sensor.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                    {sensor.label}
                  </h4>
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">{sensor.category}</p>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2">Pin</th>
                        <th className="pb-2">ESP32 Pin</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {sensor.wiring.map((w, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className={`py-1.5 ${w.pin === 'VCC' ? 'text-red-500 font-medium' : w.pin === 'GND' ? 'text-black font-medium' : 'text-blue-600 font-mono'}`}>
                            {w.pin}
                          </td>
                          <td className="font-mono text-gray-600">{w.esp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {activeSensors.length === 0 && (
                <div className="col-span-3 text-center py-10 text-gray-400">
                  No sensors selected. Please go back and select sensors to see the wiring guide.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SECURITY */}
        {activeTab === 'security' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" /> Is this secure?
              </h4>
              <p className="text-sm text-green-700 leading-relaxed">
                Yes. While the API Key is visible in the code, <strong>it does not give full access to your database</strong>.
                Security is handled by Firebase "Security Rules" on the server side, which restrict what this key can do.
              </p>
            </div>
            {/* Same security content as before */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">How we protect your data:</h4>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <h5 className="font-semibold text-gray-800">Public ID, Not a Password</h5>
                  <p className="text-sm text-gray-600">The API Key identifies your project to Google. Like a house address.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <h5 className="font-semibold text-gray-800">Server-Side Rules</h5>
                  <p className="text-sm text-gray-600">We configure Firebase to only accept sensor data from authenticated devices.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
