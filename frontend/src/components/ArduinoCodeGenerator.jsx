// File: frontend/src/components/ArduinoCodeGenerator.jsx
import React, { useState, useEffect } from 'react';
import { Copy, Download, Wifi, Eye, EyeOff, Code, CheckCircle, Zap, Shield, AlertTriangle, Key, Database } from 'lucide-react';
import { SENSOR_DEFINITIONS } from '../data/sensors';

export default function ArduinoCodeGenerator({ deviceId, sensors }) {
  // config is a map of { sensorId: boolean }
  const config = sensors || {};

  const [activeTab, setActiveTab] = useState('code'); // 'code', 'wiring', 'security'
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [dbUrl, setDbUrl] = useState('');
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
  }, [ssid, password, apiKey, dbUrl, deviceId, config, isSimulationMode]);

  const generateCode = () => {
    // 1. Collect all code parts
    const parts = {
      includes: new Set([
        "#include <WiFi.h>",
        "#include <Firebase_ESP_Client.h>", // NEW Library
        "#include \"addons/TokenHelper.h\"",
        "#include \"addons/RTDBHelper.h\"",
        "#include <time.h>"
      ]),
      defines: [],
      setup: [],
      read: [],
      vars: [],
      send: []
    };

    // 2. Add Config Defines
    parts.defines.push('#define WIFI_SSID "' + (ssid || 'YOUR_WIFI_SSID') + '"');
    parts.defines.push('#define WIFI_PASSWORD "' + (password || 'YOUR_WIFI_PASSWORD') + '"');
    parts.defines.push('#define API_KEY "' + (apiKey || 'YOUR_FIREBASE_API_KEY') + '"');
    parts.defines.push('#define DATABASE_URL "' + (dbUrl || 'YOUR_FIREBASE_DATABASE_URL') + '"');
    parts.defines.push('#define DEVICE_ID "' + deviceId + '"');

    // 3. Process Sensors
    activeSensors.forEach(s => {
      if (s.code.include) s.code.include.split('\n').forEach(l => parts.includes.add(l.trim()));
      if (s.code.define) s.code.define.split('\n').forEach(l => parts.defines.push(l.trim()));

      // SETUP: Only if NOT simulation
      if (!isSimulationMode) {
        if (s.code.setup) parts.setup.push(`  // ${s.label}\n  ${s.code.setup}`);
      }

      // VARS: Deduplicate
      if (s.code.vars) {
        const varLines = s.code.vars.split('\n');
        varLines.forEach(line => {
          if (!parts.vars.includes(line.trim())) {
            parts.vars.push(line.trim());
          }
        });
      }

      // READ: Simulation vs Real
      if (isSimulationMode) {
        const mockLogic = s.code.mock || `// No mock logic for ${s.id}`;
        // Clean assignments (remove types)
        const cleanMock = mockLogic.replace(/(float|int|long|bool|char\*)\s+(\w+)\s*=/g, '$2 =');
        parts.read.push(`    // ${s.label} (SIMULATION)\n    ${cleanMock}`);
      } else {
        if (s.code.read) {
          const cleanRead = s.code.read.replace(/(float|int|long|bool|char\*)\s+(\w+)\s*=/g, '$2 =');
          parts.read.push(`    // ${s.label}\n    ${cleanRead}`);
        }
      }

      // SEND: Use Firebase RTDB syntax
      if (s.code.send) {
        let upgradedSend = s.code.send.replace(/Firebase\.set/g, 'Firebase.RTDB.set');
        upgradedSend = upgradedSend.replace(/\(fbdo/g, '(&fbdo'); // pass address
        parts.send.push(`      // ${s.label}\n      ${upgradedSend}`);
      }
    });

    const code = `// File: esp32_firmware_direct.ino
${Array.from(parts.includes).join('\n')}

// ----------------------
// USER CONFIG
// ----------------------
${parts.defines.join('\n')}
#define RELAY_PIN 5 

// Firebase Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

const char* ntp1 = "pool.ntp.org";
const char* ntp2 = "time.nist.gov";
const long gmtOffset = 0;
const int daylightOffset = 0;

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 2000; // 2 sec

// Global Sensor Variables
${parts.vars.join('\n')}

// Helper to build path: /devices/{ID}/sensors/{SENSOR}
String sensorsPath(String sensorName) {
  return String("/devices/") + DEVICE_ID + "/sensors/" + sensorName;
}

void connectWiFi() {
  Serial.print("Connecting to: "); Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.println("\\nConnected! IP: "); Serial.println(WiFi.localIP());
}

void syncTime() {
  configTime(gmtOffset, daylightOffset, ntp1, ntp2);
  time_t now = time(nullptr);
  while (now < 1600000000) { delay(200); now = time(nullptr); }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\\n=== ESP32 Firmware (Direct Mode) ===");
  ${isSimulationMode ? 'Serial.println("WARNING: RUNNING IN SIMULATION MODE");' : ''}

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // ON initially

  connectWiFi();
  syncTime();
  randomSeed(analogRead(0));

  // ---------------------------
  // Firebase Setup
  // ---------------------------
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Show token generation info on Serial Monitor
  config.token_status_callback = tokenStatusCallback;
  config.max_token_generation_retry = 5;

  // Anonymous sign-up (no email, no password)
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase signup OK");
    signupOK = true;
  } else {
    Serial.printf("Firebase signup FAILED: %s\\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Sensor Setup
${parts.setup.join('\n')}
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  unsigned long now = millis();

  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    
    // ---------------------------
    // 1. Read Sensors ${isSimulationMode ? '(SIMULATED)' : ''}
    // ---------------------------
${parts.read.join('\n')}

    // ---------------------------
    // 2. Send to Firebase (Direct)
    // ---------------------------
    if (Firebase.ready() && signupOK) {
      Serial.println("Sending data to Firebase...");
      
      String lastSeenPath = "/devices/" + String(DEVICE_ID) + "/meta/lastSeen";
      String onlinePath   = "/devices/" + String(DEVICE_ID) + "/meta/online";

      // Meta
      if (!Firebase.RTDB.setInt(&fbdo, lastSeenPath.c_str(), time(nullptr))) {
        Serial.print("lastSeen error: "); Serial.println(fbdo.errorReason());
      }
      if (!Firebase.RTDB.setBool(&fbdo, onlinePath.c_str(), true)) {
        Serial.print("online error: "); Serial.println(fbdo.errorReason());
      }

${parts.send.join('\n')}
      
    } else {
      Serial.println("Firebase not ready (token not generated yet or signup failed)");
    }
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
    element.download = "esp32_direct.ino";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="glass-card shadow-lg border border-gray-100 overflow-hidden bg-white">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Code className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Device Configuration</h3>
        </div>
        <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200">
          ID: {deviceId}
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'code' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <Code className="w-4 h-4" /> Generated Code
        </button>
        <button
          onClick={() => setActiveTab('wiring')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'wiring' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <Zap className="w-4 h-4" /> Wiring Guide
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <Shield className="w-4 h-4" /> Security Info
        </button>
      </div>

      <div className="p-6">

        {/* TAB: CODE */}
        {activeTab === 'code' && (
          <div className="animate-fadeIn">
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Wifi className="w-4 h-4" /> WiFi & Firebase Configuration
              </h4>

              {/* Simulation Mode Toggle */}
              <div className="mb-6 flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${isSimulationMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => setIsSimulationMode(!isSimulationMode)}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isSimulationMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">No sensors? Use Simulation Mode</div>
                  <div className="text-xs text-gray-500">Generates random values so you can test the dashboard without hardware.</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-700/50 uppercase mb-1">WiFi Name (SSID)</label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="e.g., Home_WiFi"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-700/50 uppercase mb-1">WiFi Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all pr-10"
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
                <div>
                  <label className="block text-xs font-semibold text-blue-700/50 uppercase mb-1">Firebase API Key</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all pl-9"
                    />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-700/50 uppercase mb-1">Database URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={dbUrl}
                      onChange={(e) => setDbUrl(e.target.value)}
                      placeholder="https://your-project.firebaseio.com"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all pl-9"
                    />
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-900 text-sm font-medium rounded-md shadow hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-md shadow hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              {/* PREVIEW OF CODE */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar relative shadow-inner">
                <pre className="text-xs font-mono text-blue-100/90 leading-relaxed">
                  <code>{generatedCode}</code>
                </pre>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <span>
                  <strong>Direct Mode:</strong> Your API Key is embedded in this code. Do not share this file publicly.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
              >
                <Download className="w-5 h-5" />
                Download Firmware
              </button>
            </div>
          </div>
        )}

        {/* TAB: WIRING */}
        {activeTab === 'wiring' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-700">Safety First</h4>
                <p className="text-sm text-amber-800/80">Double-check all connections before powering on. Ensure common ground between ESP32 and external power supplies.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSensors.map((sensor, idx) => (
                <div key={sensor.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs border border-blue-200">{idx + 1}</span>
                    {sensor.label}
                  </h4>
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-semibold">{sensor.category}</p>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-100">
                        <th className="pb-2">Pin</th>
                        <th className="pb-2">ESP32 Pin</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {sensor.wiring.map((w, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className={`py-1.5 ${w.pin === 'VCC' ? 'text-red-500 font-medium' : w.pin === 'GND' ? 'text-gray-900 font-medium' : 'text-blue-600 font-mono'}`}>
                            {w.pin}
                          </td>
                          <td className="font-mono text-gray-500">{w.esp}</td>
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
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <h4 className="font-bold text-red-600 flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" /> Direct Connection Mode
              </h4>
              <p className="text-sm text-red-800/80 leading-relaxed">
                You are connecting directly to Firebase. This requires embedding your <strong>API Key</strong> in the firmware.
                This is fine for personal projects, but not recommended for commercial products.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
