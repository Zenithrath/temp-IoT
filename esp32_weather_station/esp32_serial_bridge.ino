#include <DHT.h>

// ============================================
// KONFIGURASI
// ============================================
const char* DEVICE_ID = "a09c1032-b196-40f1-8e52-066035b09dc1";
#define DHTPIN 23
#define DHTTYPE DHT11
#define SEND_INTERVAL 5000  // 5 detik
// ============================================

DHT dht(DHTPIN, DHTTYPE);
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== ESP32 Serial Bridge Mode ===");
  Serial.println("Kirim data via USB Serial (tidak pakai WiFi)");
  dht.begin();
}

void loop() {
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

    // Kirim JSON via serial
    String json = "{";
    json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    json += "\"temperature\":" + String(temperature, 1) + ",";
    json += "\"humidity\":" + String(humidity, 1);
    json += "}";

    Serial.println(json);
  }
}
