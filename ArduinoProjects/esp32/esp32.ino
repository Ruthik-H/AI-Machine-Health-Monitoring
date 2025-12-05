// File: esp32_main.ino
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <time.h>
#include <DHT.h>

// ----------------------
// USER CONFIG
// ----------------------
#define WIFI_SSID "Ruthik "
#define WIFI_PASSWORD "12345678"

#define DEVICE_ID "MACHINE-33FZTIH1"  // Match the dashboard ID

#define API_KEY "YOUR API KEY"
#define DATABASE_URL "URL"

// ----------------------
// HARDWARE PINS
// ----------------------
#define DHTPIN 4
#define DHTTYPE DHT11

#define RELAY_PIN 5      // LOW = ON, HIGH = OFF for LOW trigger relay

DHT dht(DHTPIN, DHTTYPE);

// ----------------------
// Firebase
// ----------------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ----------------------
// NTP Time
// ----------------------
const char* ntp1 = "pool.ntp.org";
const char* ntp2 = "time.nist.gov";
const long gmtOffset = 0;
const int daylightOffset = 0;

// ----------------------
// UPDATE EVERY 1 SECOND
// ----------------------
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 1000; // 1 sec

// ----------------------
// FETCH LIMITS EVERY 5s
// ----------------------
unsigned long lastLimitFetch = 0;
const unsigned long LIMIT_FETCH_INTERVAL = 5000; // 5 sec

// ----------------------
// Thresholds (defaults)
float tempLimit = 40.0;
float vibLimit = 1.8;
float currentLimit = 20.0;
float rpmLimit = 2000.0;

// Forward declarations
void connectWiFi();
void firebaseSetup();
void syncTime();
String isoNow();
void sendSensorValues();
String sensorsPath(const char *sensorName);
void fetchLimits();

void setup() {
  Serial.begin(115200);
  delay(200);

  Serial.println("\n=== ESP32 + DHT11 + Relay + Firebase ===");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);   // RELAY ON initially

  dht.begin();

  connectWiFi();
  syncTime();
  firebaseSetup();

  // random seed for fake/random values
  randomSeed(analogRead(0));
}

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting...");
    connectWiFi();
  }

  if (!Firebase.ready()) {
    Firebase.reconnectWiFi(true);
  }

  unsigned long nowMillis = millis();

  if (nowMillis - lastLimitFetch >= LIMIT_FETCH_INTERVAL) {
    lastLimitFetch = nowMillis;
    fetchLimits();
  }

  if (nowMillis - lastSend >= SEND_INTERVAL) {
    lastSend = nowMillis;
    sendSensorValues();
  }
}

// -------------------------------------------
// CONNECT WIFI
// -------------------------------------------
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// -------------------------------------------
// FIREBASE SETUP
// -------------------------------------------
void firebaseSetup() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  Serial.println("Signing in...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase SignUp OK");
  } else {
    Serial.printf("SignUp error: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Firebase initialized.");
}

// -------------------------------------------
// SYNC TIME (NTP)
// -------------------------------------------
void syncTime() {
  Serial.println("Syncing time...");
  configTime(gmtOffset, daylightOffset, ntp1, ntp2);

  time_t now = time(nullptr);
  while (now < 1600000000) {
    delay(200);
    now = time(nullptr);
  }
  Serial.println("Time synced.");
}

// -------------------------------------------
// ISO TIMESTAMP
// -------------------------------------------
String isoNow() {
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);

  char buf[32];
  sprintf(
    buf,
    "%04d-%02d-%02dT%02d:%02d:%02dZ",
    timeinfo.tm_year + 1900,
    timeinfo.tm_mon + 1,
    timeinfo.tm_mday,
    timeinfo.tm_hour,
    timeinfo.tm_min,
    timeinfo.tm_sec
  );
  return String(buf);
}

// -------------------------------------------
// PATH BUILDER
// -------------------------------------------
String sensorsPath(const char *sensorName) {
  return "/devices/" + String(DEVICE_ID) + "/sensors/" + String(sensorName);
}

// -------------------------------------------
// FETCH LIMITS FROM Firebase
// -------------------------------------------
void fetchLimits() {
  if (!Firebase.ready()) return;

  String base = "/devices/" + String(DEVICE_ID) + "/config/thresholds";

  // temperature
  String tPath = base + "/temperature";
  if (Firebase.getFloat(fbdo, tPath.c_str())) {
    tempLimit = fbdo.floatData();
    Serial.printf("Fetched tempLimit: %.2f\n", tempLimit);
  } else {
    Serial.printf("No tempLimit or fetch error: %s\n", fbdo.errorReason().c_str());
  }

  // vibration
  String vPath = base + "/vibration";
  if (Firebase.getFloat(fbdo, vPath.c_str())) {
    vibLimit = fbdo.floatData();
    Serial.printf("Fetched vibLimit: %.2f\n", vibLimit);
  } else {
    Serial.printf("No vibLimit or fetch error: %s\n", fbdo.errorReason().c_str());
  }

  // current
  String cPath = base + "/current";
  if (Firebase.getFloat(fbdo, cPath.c_str())) {
    currentLimit = fbdo.floatData();
    Serial.printf("Fetched currentLimit: %.2f\n", currentLimit);
  } else {
    Serial.printf("No currentLimit or fetch error: %s\n", fbdo.errorReason().c_str());
  }

  // rpm
  String rPath = base + "/rpm";
  if (Firebase.getFloat(fbdo, rPath.c_str())) {
    rpmLimit = fbdo.floatData();
    Serial.printf("Fetched rpmLimit: %.0f\n", rpmLimit);
  } else {
    Serial.printf("No rpmLimit or fetch error: %s\n", fbdo.errorReason().c_str());
  }
}

// -------------------------------------------
// MAIN FUNCTION — READ DHT & SEND
// -------------------------------------------
void sendSensorValues() {
  if (!Firebase.ready()) return;

  // -----------------------
  // READ REAL TEMPERATURE
  // -----------------------
  float temperature = dht.readTemperature();

  if (isnan(temperature)) {
    Serial.println("⚠️ DHT11 Read Error!");
    return;
  }

  // -----------------------
  // SET OTHER SENSORS TO ZERO (you don't have these sensors yet)
  // -----------------------
  float vibration = 0.0;  // Set to 0 (no vibration sensor)
  float current = 0.0;    // Set to 0 (no current sensor)
  float voltage = 0.0;    // Set to 0 (no voltage sensor)
  int rpm = 0;            // Set to 0 (no RPM sensor)

  Serial.print("Temp: ");
  Serial.println(temperature);

  // -----------------------
  // RELAY AUTO SHUTDOWN based on dynamic limit
  // -----------------------
  if (temperature > tempLimit) {
    digitalWrite(RELAY_PIN, HIGH);  // RELAY OFF
    Serial.println("🔥 TEMP HIGH → RELAY OFF");
  } else {
    digitalWrite(RELAY_PIN, LOW);   // RELAY ON
    Serial.println("OK → Relay ON");
  }

  // -----------------------
  // SEND TO FIREBASE
  // -----------------------
  Firebase.setFloat(fbdo, sensorsPath("temperature").c_str(), temperature);
  Firebase.setFloat(fbdo, sensorsPath("vibration").c_str(), vibration);
  Firebase.setFloat(fbdo, sensorsPath("current").c_str(), current);
  Firebase.setFloat(fbdo, sensorsPath("voltage").c_str(), voltage);
  Firebase.setInt(fbdo, sensorsPath("rpm").c_str(), rpm);

  Firebase.setInt(fbdo, ("/devices/" + String(DEVICE_ID) + "/meta/lastSeen").c_str(), time(nullptr));
  Firebase.setBool(fbdo, ("/devices/" + String(DEVICE_ID) + "/meta/online").c_str(), true);

  String timestamp = isoNow();
  String base = "/history/" + String(DEVICE_ID) + "/" + timestamp;

  Firebase.setFloat(fbdo, (base + "/temperature").c_str(), temperature);
  Firebase.setFloat(fbdo, (base + "/vibration").c_str(), vibration);
  Firebase.setFloat(fbdo, (base + "/current").c_str(), current);
  Firebase.setFloat(fbdo, (base + "/voltage").c_str(), voltage);
  Firebase.setInt(fbdo,   (base + "/rpm").c_str(), rpm);

  Serial.println("History saved → " + timestamp);
  Serial.println("-----------------------------");
}
