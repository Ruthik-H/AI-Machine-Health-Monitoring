export const SENSOR_DEFINITIONS = {
    // ------------------------------------------------------------------
    // 1. ENVIRONMENTAL SENSORS
    // ------------------------------------------------------------------
    dht11: {
        id: "dht11",
        label: "DHT11 Temp & Humidity",
        category: "environmental",
        pins: { DATA: 4 },
        code: {
            include: "#include <DHT.h>",
            define: "#define DHTPIN 4\n#define DHTTYPE DHT11",
            setup: "dht.begin();",
            read: "float temperature = dht.readTemperature();\n  float humidity = dht.readHumidity();",
            vars: "float temperature = 0.0;\nfloat humidity = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"temperature\").c_str(), temperature);\n  Firebase.setFloat(fbdo, sensorsPath(\"humidity\").c_str(), humidity);",
            mock: "float temperature = random(20, 35) + random(0, 100) / 100.0;\n  float humidity = random(40, 80) + random(0, 100) / 100.0;",
            json: "doc[\"temperature\"] = temperature;\n  doc[\"humidity\"] = humidity;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V" },
            { pin: "GND", esp: "GND" },
            { pin: "DATA", esp: "D4" }
        ]
    },
    dht22: {
        id: "dht22",
        label: "DHT22 High Precision",
        category: "environmental",
        pins: { DATA: 4 },
        code: {
            include: "#include <DHT.h>",
            define: "#define DHTPIN 4\n#define DHTTYPE DHT22",
            setup: "dht.begin();",
            read: "float temperature = dht.readTemperature();\n  float humidity = dht.readHumidity();",
            vars: "float temperature = 0.0;\nfloat humidity = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"temperature\").c_str(), temperature);\n  Firebase.setFloat(fbdo, sensorsPath(\"humidity\").c_str(), humidity);",
            mock: "float temperature = random(20, 35) + random(0, 100) / 100.0;\n  float humidity = random(40, 80) + random(0, 100) / 100.0;",
            json: "doc[\"temperature\"] = temperature;\n  doc[\"humidity\"] = humidity;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V" },
            { pin: "GND", esp: "GND" },
            { pin: "DATA", esp: "D4" }
        ]
    },
    ds18b20: {
        id: "ds18b20",
        label: "DS18B20 Waterproof Temp",
        category: "environmental",
        pins: { DATA: 15 },
        code: {
            include: "#include <OneWire.h>\n#include <DallasTemperature.h>",
            define: "#define ONE_WIRE_BUS 15\nOneWire oneWire(ONE_WIRE_BUS);\nDallasTemperature sensors(&oneWire);",
            setup: "sensors.begin();",
            read: "sensors.requestTemperatures();\n  float temperature = sensors.getTempCByIndex(0);",
            vars: "float temperature = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"temperature\").c_str(), temperature);",
            mock: "float temperature = random(20, 80) + random(0, 100) / 100.0;",
            json: "doc[\"temperature\"] = temperature;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V/5V" },
            { pin: "GND", esp: "GND" },
            { pin: "DATA", esp: "D15 (Pullup 4.7k)" }
        ]
    },
    bme280: {
        id: "bme280",
        label: "BME280 Temp/Hum/Pressure",
        category: "environmental",
        pins: { SDA: 21, SCL: 22 },
        code: {
            include: "#include <Wire.h>\n#include <Adafruit_Sensor.h>\n#include <Adafruit_BME280.h>",
            define: "Adafruit_BME280 bme; // I2C",
            setup: "if (!bme.begin(0x76)) { Serial.println(\"BME280 Fail\"); }",
            read: "float temperature = bme.readTemperature();\n  float humidity = bme.readHumidity();\n  float pressure = bme.readPressure() / 100.0F;",
            vars: "float temperature = 0.0;\nfloat humidity = 0.0;\nfloat pressure = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"temperature\").c_str(), temperature);\n  Firebase.setFloat(fbdo, sensorsPath(\"humidity\").c_str(), humidity);\n  Firebase.setFloat(fbdo, sensorsPath(\"pressure\").c_str(), pressure);",
            mock: "float temperature = random(15, 30) + random(0, 100) / 100.0;\n  float humidity = random(30, 70) + random(0, 100) / 100.0;\n  float pressure = random(900, 1100) + random(0, 100) / 100.0;",
            json: "doc[\"temperature\"] = temperature;\n  doc[\"humidity\"] = humidity;\n  doc[\"pressure\"] = pressure;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V" },
            { pin: "GND", esp: "GND" },
            { pin: "SDA", esp: "D21" },
            { pin: "SCL", esp: "D22" }
        ]
    },
    soil: {
        id: "soil",
        label: "Soil Moisture Sensor",
        category: "environmental",
        pins: { AO: 32 },
        code: {
            include: "",
            define: "#define SOIL_PIN 32",
            setup: "pinMode(SOIL_PIN, INPUT);",
            read: "int soilRaw = analogRead(SOIL_PIN);\n  float soilMoisture = map(soilRaw, 4095, 0, 0, 100);",
            vars: "float soilMoisture = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"soilMoisture\").c_str(), soilMoisture);",
            mock: "float soilMoisture = random(0, 100);",
            json: "doc[\"soilMoisture\"] = soilMoisture;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V/5V" },
            { pin: "GND", esp: "GND" },
            { pin: "AO", esp: "D32" }
        ]
    },

    // ------------------------------------------------------------------
    // 2. GAS SENSORS
    // ------------------------------------------------------------------
    mq2: {
        id: "mq2",
        label: "MQ-2 Smoke/LPG/CO",
        category: "gas",
        pins: { AO: 34 },
        code: {
            include: "",
            define: "#define MQ2_PIN 34",
            setup: "pinMode(MQ2_PIN, INPUT);",
            read: "int mq2Raw = analogRead(MQ2_PIN);\n  float gasLevel = mq2Raw / 40.95;",
            vars: "float gasLevel = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"gasLevel\").c_str(), gasLevel);",
            mock: "float gasLevel = random(10, 100) + random(0, 100) / 100.0;",
            json: "doc[\"gasLevel\"] = gasLevel;"
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "AO", esp: "D34" }
        ]
    },
    mq135: {
        id: "mq135",
        label: "MQ-135 Air Quality",
        category: "gas",
        pins: { AO: 35 },
        code: {
            include: "",
            define: "#define MQ135_PIN 35",
            setup: "pinMode(MQ135_PIN, INPUT);",
            read: "int mq135Raw = analogRead(MQ135_PIN);\n  float airQuality = mq135Raw / 40.95;",
            vars: "float airQuality = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"airQuality\").c_str(), airQuality);",
            mock: "float airQuality = random(20, 200) + random(0, 100) / 100.0;",
            json: "doc[\"airQuality\"] = airQuality;"
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "AO", esp: "D35" }
        ]
    },

    // ------------------------------------------------------------------
    // 3. MOTION & DISTANCE
    // ------------------------------------------------------------------
    hc_sr04: {
        id: "hc_sr04",
        label: "HC-SR04 Ultrasonic",
        category: "motion",
        pins: { TRIG: 12, ECHO: 13 },
        code: {
            include: "",
            define: "#define TRIG_PIN 12\n#define ECHO_PIN 13",
            setup: "pinMode(TRIG_PIN, OUTPUT);\n  pinMode(ECHO_PIN, INPUT);",
            read: "digitalWrite(TRIG_PIN, LOW);\n  delayMicroseconds(2);\n  digitalWrite(TRIG_PIN, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(TRIG_PIN, LOW);\n  long duration = pulseIn(ECHO_PIN, HIGH);\n  float distance = duration * 0.034 / 2;",
            vars: "float distance = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"distance\").c_str(), distance);",
            mock: "float distance = random(5, 400) + random(0, 100) / 100.0;",
            json: "doc[\"distance\"] = distance;"
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "Trig", esp: "D12" },
            { pin: "Echo", esp: "D13" }
        ]
    },
    mpu6050: {
        id: "mpu6050",
        label: "MPU6050 Accelerometer",
        category: "motion",
        pins: { SDA: 21, SCL: 22 },
        code: {
            include: "#include <Adafruit_MPU6050.h>\n#include <Adafruit_Sensor.h>\n#include <Wire.h>",
            define: "Adafruit_MPU6050 mpu;",
            setup: "if (!mpu.begin()) { Serial.println(\"MPU6050 Fail\"); }\n  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);\n  mpu.setGyroRange(MPU6050_RANGE_500_DEG);",
            read: "sensors_event_t a, g, temp;\n  mpu.getEvent(&a, &g, &temp);\n  float accX = a.acceleration.x;\n  float accY = a.acceleration.y;\n  float accZ = a.acceleration.z;",
            vars: "float accX = 0.0; float accY = 0.0; float accZ = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"accX\").c_str(), accX);\n  Firebase.setFloat(fbdo, sensorsPath(\"accY\").c_str(), accY);\n  Firebase.setFloat(fbdo, sensorsPath(\"accZ\").c_str(), accZ);",
            mock: "float accX = random(-10, 10) / 10.0;\n  float accY = random(-10, 10) / 10.0;\n  float accZ = random(8, 12) / 10.0;",
            json: "doc[\"accX\"] = accX;\n  doc[\"accY\"] = accY;\n  doc[\"accZ\"] = accZ;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V" },
            { pin: "GND", esp: "GND" },
            { pin: "SDA", esp: "D21" },
            { pin: "SCL", esp: "D22" }
        ]
    },
    pir: {
        id: "pir",
        label: "PIR Motion Sensor",
        category: "motion",
        pins: { OUT: 27 },
        code: {
            include: "",
            define: "#define PIR_PIN 27",
            setup: "pinMode(PIR_PIN, INPUT);",
            read: "int motion = digitalRead(PIR_PIN);",
            vars: "int motion = 0;",
            send: "Firebase.setInt(fbdo, sensorsPath(\"motion\").c_str(), motion);",
            mock: "int motion = random(0, 2);",
            json: "doc[\"motion\"] = motion;" // 0 or 1
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "OUT", esp: "D27" }
        ]
    },
    sw420: {
        id: "sw420",
        label: "SW-420 Vibration",
        category: "motion",
        pins: { DO: 26 },
        code: {
            include: "",
            define: "#define VIB_PIN 26",
            setup: "pinMode(VIB_PIN, INPUT);",
            read: "int vibration = digitalRead(VIB_PIN);",
            vars: "int vibration = 0;",
            send: "Firebase.setInt(fbdo, sensorsPath(\"vibration\").c_str(), vibration);",
            mock: "int vibration = random(0, 2);",
            json: "doc[\"vibration\"] = vibration;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V/5V" },
            { pin: "GND", esp: "GND" },
            { pin: "DO", esp: "D26" }
        ]
    },

    // ------------------------------------------------------------------
    // 4. POWER & ELECTRICAL
    // ------------------------------------------------------------------
    acs712: {
        id: "acs712",
        label: "ACS712 Current (20A)",
        category: "power",
        pins: { OUT: 36 },
        code: {
            include: "",
            define: "#define CURRENT_PIN 36",
            setup: "pinMode(CURRENT_PIN, INPUT);",
            read: "int curRaw = analogRead(CURRENT_PIN);\n  float voltage = (curRaw / 4095.0) * 3.3;\n  float current = (voltage - 1.65) / 0.100; // sensitivity\n  if(current < 0) current = 0;",
            vars: "float current = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"current\").c_str(), current);",
            mock: "float current = random(0, 1000) / 100.0;",
            json: "doc[\"current\"] = current;"
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "OUT", esp: "D36 (VP)" }
        ]
    },
    zmpt101b: {
        id: "zmpt101b",
        label: "ZMPT101B Voltage",
        category: "power",
        pins: { OUT: 39 },
        code: {
            include: "",
            define: "#define VOLT_PIN 39",
            setup: "pinMode(VOLT_PIN, INPUT);",
            read: "// Simplified RMS calculation\n  float voltage = (analogRead(VOLT_PIN) / 4095.0) * 250.0;",
            vars: "float voltage = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"voltage\").c_str(), voltage);",
            mock: "float voltage = random(220, 240) + random(0, 100) / 100.0;",
            json: "doc[\"voltage\"] = voltage;"
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "OUT", esp: "D39 (VN)" }
        ]
    },

    // ------------------------------------------------------------------
    // 5. LIQUID & FLOW
    // ------------------------------------------------------------------
    water_level: {
        id: "water_level",
        label: "Water Level Depth",
        category: "liquid",
        pins: { SIG: 33 },
        code: {
            include: "",
            define: "#define WATER_PIN 33",
            setup: "pinMode(WATER_PIN, INPUT);",
            read: "int waterRaw = analogRead(WATER_PIN);\n  float waterLevel = map(waterRaw, 0, 4095, 0, 100);",
            vars: "float waterLevel = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"waterLevel\").c_str(), waterLevel);",
            mock: "float waterLevel = random(0, 100);",
            json: "doc[\"waterLevel\"] = waterLevel;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V/5V" },
            { pin: "GND", esp: "GND" },
            { pin: "SIG", esp: "D33" }
        ]
    },
    flow: {
        id: "flow",
        label: "YF-S201 Water Flow",
        category: "liquid",
        pins: { DATA: 14 },
        code: {
            include: "",
            define: "#define FLOW_PIN 14\nvolatile int flowPulses = 0;\nvoid IRAM_ATTR flowISR() { flowPulses++; }",
            setup: "pinMode(FLOW_PIN, INPUT_PULLUP);\n  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowISR, RISING);",
            read: "float flowRate = (flowPulses / 7.5); // L/min\n  flowPulses = 0; // Reset for next second",
            vars: "float flowRate = 0.0;",
            send: "Firebase.setFloat(fbdo, sensorsPath(\"flowRate\").c_str(), flowRate);",
            mock: "float flowRate = random(0, 20);",
            json: "doc[\"flowRate\"] = flowRate;"
        },
        wiring: [
            { pin: "Red", esp: "5V" },
            { pin: "Black", esp: "GND" },
            { pin: "Yellow", esp: "D14" }
        ]
    },
    mh_z19: {
        id: "mh_z19",
        label: "MH-Z19 CO2 Sensor",
        category: "environmental",
        pins: { RX: 16, TX: 17 },
        code: {
            include: "",
            define: "HardwareSerial co2Serial(2); // Use UART2",
            setup: "co2Serial.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17",
            read: "// Simplified CO2 Read\n  int co2 = 400; // Placeholder for actual UART read logic",
            vars: "int co2 = 0;",
            send: "Firebase.setInt(fbdo, sensorsPath(\"co2\").c_str(), co2);",
            mock: "int co2 = random(400, 1000);",
            json: "doc[\"co2\"] = co2;"
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "TX", esp: "D16" },
            { pin: "RX", esp: "D17" }
        ]
    },
    relay: {
        id: "relay",
        label: "Relay Module (Control)",
        category: "other",
        pins: { IN: 5 },
        code: {
            include: "",
            define: "#define RELAY_PIN 5",
            setup: "pinMode(RELAY_PIN, OUTPUT);\n  digitalWrite(RELAY_PIN, LOW); // ON",
            read: "",
            vars: "",
            send: "", // Relay is an actuator, logic is handled usually in main loop
            mock: "",
            json: ""
        },
        wiring: [
            { pin: "VCC", esp: "5V" },
            { pin: "GND", esp: "GND" },
            { pin: "IN", esp: "D5" }
        ]
    },
    ir_speed: {
        id: "ir_speed",
        label: "IR Speed / Tachometer",
        category: "motion",
        pins: { DO: 18 },
        code: {
            include: "",
            define: "#define RPM_PIN 18\nvolatile int rpmCount = 0;\nvoid IRAM_ATTR rpmISR() { rpmCount++; }",
            setup: "pinMode(RPM_PIN, INPUT_PULLUP);\n  attachInterrupt(digitalPinToInterrupt(RPM_PIN), rpmISR, FALLING);",
            read: "int rpm = (rpmCount * 60); // simplified pulses per sec * 60\n  rpmCount = 0;",
            vars: "int rpm = 0;",
            send: "Firebase.setInt(fbdo, sensorsPath(\"rpm\").c_str(), rpm);",
            mock: "int rpm = random(0, 3000);",
            json: "doc[\"rpm\"] = rpm;"
        },
        wiring: [
            { pin: "VCC", esp: "3.3V" },
            { pin: "GND", esp: "GND" },
            { pin: "DO", esp: "D18" }
        ]
    }
};
