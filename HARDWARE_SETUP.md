# Hardware Setup Guide - ESP32 + Temperature Sensor + Relay + DC Motor

## Components You Have:
1. **ESP32 Development Board**
2. **DHT11 Temperature Sensor** (or DHT22)
3. **Single Channel Relay Module** (5V)
4. **DC Motor**

---

## Wiring Connections

### 1. DHT11 Temperature Sensor → ESP32
```
DHT11 Pin    →    ESP32 Pin
---------         ---------
VCC (+)      →    3.3V
GND (-)      →    GND
DATA (OUT)   →    GPIO 4 (D4)
```

### 2. Relay Module → ESP32
```
Relay Pin    →    ESP32 Pin
---------         ---------
VCC          →    5V (VIN)
GND          →    GND
IN (Signal)  →    GPIO 5 (D5)
```

### 3. DC Motor → Relay Module
```
Relay Terminal    →    Connection
--------------         -----------
COM (Common)      →    Power Supply (+) [e.g., 12V or 5V depending on motor]
NO (Normally Open)→    DC Motor (+)
                       DC Motor (-)  →  Power Supply GND
```

**Important:** 
- The relay acts as a switch for the motor
- When relay is ON (LOW signal to GPIO 5), motor runs
- When relay is OFF (HIGH signal to GPIO 5), motor stops

---

## Complete Wiring Diagram

```
                    ESP32
                 ┌─────────┐
                 │         │
    DHT11        │  GPIO 4 │──── DHT11 Data
    ┌───┐       │         │
    │ + │───────│  3.3V   │
    │ - │───────│  GND    │
    │ D │───────│  GPIO 4 │
    └───┘       │         │
                │  GPIO 5 │──── Relay Signal
                │         │
    Relay       │  5V     │──── Relay VCC
    ┌───┐       │  GND    │──── Relay GND
    │VCC│───────│         │
    │GND│───────│         │
    │IN │───────│         │
    │COM│───┐   └─────────┘
    │NO │   │
    │NC │   │
    └───┘   │
            │
         ┌──┴──┐
         │Motor│
         │  +  │────┐
         │  -  │    │
         └─────┘    │
                    │
         Power Supply (12V/5V)
         +  ────────┘
         -  ──────── GND (Common Ground)
```

---

## Power Supply Notes:

### Option 1: USB Power (for testing)
- ESP32 powered via USB (5V)
- Small DC motor (5V) can be powered from ESP32's VIN pin
- **Warning:** Don't draw more than 500mA from USB

### Option 2: External Power Supply (recommended)
- ESP32 powered via USB or VIN pin
- DC Motor powered by separate 5V/12V adapter
- **Important:** Connect all GNDs together (common ground)

---

## Safety Checklist:
- ✅ Double-check all connections before powering on
- ✅ Ensure common ground between ESP32 and motor power supply
- ✅ Don't exceed relay's current rating (usually 10A max)
- ✅ DHT11 uses 3.3V, not 5V
- ✅ Relay module uses 5V (from VIN pin)

---

## Next Steps:
1. Wire everything as shown above
2. Upload the modified ESP32 code (I'll create this for you)
3. Open Serial Monitor (115200 baud) to see temperature readings
4. Test the relay by setting a low temperature threshold
