# Data Source Explanation

## Current Setup (Simulation Mode)

### Where Values Come From:
**File:** `backend/backend.mjs` (Lines 32-44)

The system is currently in **SIMULATION MODE** because you don't have real sensors connected.

### Simulated Values:
- **Temperature:** 20-70°C (random)
- **Vibration:** 0-3 mm/s (random)
- **Current:** 5-25 A (random)
- **Voltage:** 220-230 V (random)
- **RPM:** 1000-2500 (random)
- **Humidity:** 30-70% (random)

### Update Frequency:
- Every **10 seconds** (reduced from 3 seconds to prevent alert spam)

---

## How to Connect Real Sensors (ESP32)

When you're ready to use real hardware:

### 1. Upload ESP32 Code
The file `ArduinoProjects/esp32/esp32.ino` contains the code for your ESP32 microcontroller.

### 2. Configure WiFi
Edit lines 10-11 in `esp32.ino`:
```cpp
#define WIFI_SSID "YOUR HOTSPOT NAME"
#define WIFI_PASSWORD "YOUR PASSWORD"
```

### 3. Set Device ID
Edit line 13:
```cpp
#define DEVICE_ID "MACHINE-33FZTIH1"  // Use this exact ID to match the dashboard
```

### 4. Connect Sensors
- **DHT11 Sensor** → Pin 4 (Temperature & Humidity)
- **Relay Module** → Pin 5 (Auto Turn-Off)
- Other sensors are simulated in the ESP32 code (you can add real ones later)

### 5. Upload to ESP32
1. Open `esp32.ino` in Arduino IDE
2. Select Board: "ESP32 Dev Module"
3. Click Upload

### 6. Stop Backend Simulation
Once ESP32 is running, you can comment out or remove the `setInterval` loop in `backend.mjs` (lines 72-159) since the ESP32 will be sending real data directly to Firebase.

---

## Recommended Threshold Settings

For the current simulation ranges:
- **Temperature:** 80°C (safe for most machines)
- **Vibration:** 2.0 mm/s (normal operation is 0-3)
- **Current:** 20 A (normal is 5-25)
- **RPM:** 2000 (normal is 1000-2500)

These settings will give you occasional warnings but not constant alerts.
