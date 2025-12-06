// File: esp32_firmware_direct.ino
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <time.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

// ----------------------
// USER CONFIG
// ----------------------
#define WIFI_SSID "RUTHIK"
#define WIFI_PASSWORD "12345678"
#define API_KEY "AIzaSyDpFXjNixlR2lkIFnc-hPzopNPri_DkVkg"
#define DATABASE_URL "https://ai-machine-health-intelligence-default-rtdb.asia-southeast1.firebasedatabase.app"
#define DEVICE_ID "MACHINE-RFF33T15"
#define DHTPIN 4
#define DHTTYPE DHT11
Adafruit_BME280 bme; // I2C
#define MQ2_PIN 34
#define TRIG_PIN 12
#define ECHO_PIN 13
#define CURRENT_PIN 36
#define WATER_PIN 33
HardwareSerial co2Serial(2); // Use UART2
#define RPM_PIN 18
volatile int rpmCount = 0;
void IRAM_ATTR rpmISR() { rpmCount++; }
#define VOLT_PIN 39
#define SOIL_PIN 32
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
float temperature = 0.0;
float humidity = 0.0;
float pressure = 0.0;
float gasLevel = 0.0;
float distance = 0.0;
float current = 0.0;
float waterLevel = 0.0;
int co2 = 0;
int rpm = 0;
float voltage = 0.0;
float soilMoisture = 0.0;

// Helper to build path: /devices/{ID}/sensors/{SENSOR}
String sensorsPath(String sensorName) {
  return String("/devices/") + DEVICE_ID + "/sensors/" + sensorName;
}

void connectWiFi() {
  Serial.print("Connecting to: "); Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.println("\nConnected! IP: "); Serial.println(WiFi.localIP());
}

void syncTime() {
  configTime(gmtOffset, daylightOffset, ntp1, ntp2);
  time_t now = time(nullptr);
  while (now < 1600000000) { delay(200); now = time(nullptr); }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== ESP32 Firmware (Direct Mode) ===");
  Serial.println("WARNING: RUNNING IN SIMULATION MODE");

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
    Serial.printf("Firebase signup FAILED: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Sensor Setup

}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  unsigned long now = millis();

  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    
    // ---------------------------
    // 1. Read Sensors (SIMULATED)
    // ---------------------------
    // DHT11 Temp & Humidity (SIMULATION)
    temperature = random(20, 35) + random(0, 100) / 100.0;
  humidity = random(40, 80) + random(0, 100) / 100.0;
    // BME280 Temp/Hum/Pressure (SIMULATION)
    temperature = random(15, 30) + random(0, 100) / 100.0;
  humidity = random(30, 70) + random(0, 100) / 100.0;
  pressure = random(900, 1100) + random(0, 100) / 100.0;
    // MQ-2 Smoke/LPG/CO (SIMULATION)
    gasLevel = random(10, 100) + random(0, 100) / 100.0;
    // HC-SR04 Ultrasonic (SIMULATION)
    distance = random(5, 400) + random(0, 100) / 100.0;
    // ACS712 Current (20A) (SIMULATION)
    current = random(0, 1000) / 100.0;
    // Water Level Depth (SIMULATION)
    waterLevel = random(0, 100);
    // MH-Z19 CO2 Sensor (SIMULATION)
    co2 = random(400, 1000);
    // IR Speed / Tachometer (SIMULATION)
    rpm = random(0, 3000);
    // ZMPT101B Voltage (SIMULATION)
    voltage = random(220, 240) + random(0, 100) / 100.0;
    // Soil Moisture Sensor (SIMULATION)
    soilMoisture = random(0, 100);

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

      // DHT11 Temp & Humidity
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("temperature").c_str(), temperature);
  Firebase.RTDB.setFloat(&fbdo, sensorsPath("humidity").c_str(), humidity);
      // BME280 Temp/Hum/Pressure
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("temperature").c_str(), temperature);
  Firebase.RTDB.setFloat(&fbdo, sensorsPath("humidity").c_str(), humidity);
  Firebase.RTDB.setFloat(&fbdo, sensorsPath("pressure").c_str(), pressure);
      // MQ-2 Smoke/LPG/CO
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("gasLevel").c_str(), gasLevel);
      // HC-SR04 Ultrasonic
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("distance").c_str(), distance);
      // ACS712 Current (20A)
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("current").c_str(), current);
      // Water Level Depth
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("waterLevel").c_str(), waterLevel);
      // MH-Z19 CO2 Sensor
      Firebase.RTDB.setInt(&fbdo, sensorsPath("co2").c_str(), co2);
      // IR Speed / Tachometer
      Firebase.RTDB.setInt(&fbdo, sensorsPath("rpm").c_str(), rpm);
      // ZMPT101B Voltage
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("voltage").c_str(), voltage);
      // Soil Moisture Sensor
      Firebase.RTDB.setFloat(&fbdo, sensorsPath("soilMoisture").c_str(), soilMoisture);
      
    } else {
      Serial.println("Firebase not ready (token not generated yet or signup failed)");
    }
  }
}
