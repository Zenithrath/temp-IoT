/*
 * Weather Station - ESP32 + DHT11
 * 
 * Library yang perlu diinstall (Arduino IDE → Library Manager):
 *   - DHT sensor library (by Adafruit)
 *   - Adafruit Unified Sensor
 * 
 * Wiring DHT11 ke ESP32:
 *   VCC  → 3.3V
 *   GND  → GND
 *   DATA → GPIO4 (bisa diganti di bawah)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ============================================
// KONFIGURASI - ISI BAGIAN INI SAJA
// ============================================
const char* WIFI_SSID = "NamaWiFiKamu";        // ← ganti
const char* WIFI_PASS = "PasswordWiFiKamu";     // ← ganti
const char* API_URL   = "https://namamu.vercel.app/api/device";  // ← ganti URL deployment
const char* API_KEY   = "your-secret-key";       // ← ganti, samakan dengan IOT_API_KEY di .env.local
const char* DEVICE_ID = "device-uuid";           // ← ganti, ambil dari Settings → Add Device

#define DHTPIN 4        // GPIO pin DHT11 DATA
#define DHTTYPE DHT11
#define SEND_INTERVAL 5000  // interval kirim data (ms) = 5 detik
// ============================================

DHT dht(DHTPIN, DHTTYPE);
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== Weather Station ESP32 ===");
  dht.begin();
  connectWiFi();
}

void loop() {
  // Reconnect jika WiFi putus
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectWiFi();
  }

  // Kirim data sesuai interval
  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("[ERROR] Gagal baca DHT11, skip...");
      return;
    }

    Serial.print("[DHT11] Temp: ");
    Serial.print(temperature, 1);
    Serial.print("°C  Hum: ");
    Serial.print(humidity, 1);
    Serial.println("%");

    sendToServer(temperature, humidity);
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[ERROR] WiFi connection failed, will retry...");
  }
}

void sendToServer(float temp, float hum) {
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);

  // Build JSON manually (tanpa ArduinoJson library)
  String json = "{";
  json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  json += "\"temperature\":" + String(temp, 1) + ",";
  json += "\"humidity\":" + String(hum, 1);
  json += "}";

  Serial.print("[HTTP] POST ");
  Serial.println(API_URL);

  int httpCode = http.POST(json);

  if (httpCode > 0) {
    String response = http.getString();
    if (httpCode == 200) {
      Serial.println("[HTTP] OK: " + response);
    } else {
      Serial.print("[HTTP] Error ");
      Serial.print(httpCode);
      Serial.print(": ");
      Serial.println(response);
    }
  } else {
    Serial.print("[HTTP] Failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}
