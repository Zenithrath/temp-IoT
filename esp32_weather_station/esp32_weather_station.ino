#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ============================================
// KONFIGURASI
// ============================================
const char* WIFI_SSID = "HQ_Mesh";
const char* WIFI_PASS = "##ARKA##4321##";

const char* TB_SERVER    = "mqtt.thingsboard.cloud";
const int   TB_PORT      = 1883;
const char* TB_TOKEN     = "uCIMsiaE9GNTH2k0yuxN";  // MT-022 token

#define DHTPIN 23
#define DHTTYPE DHT11
#define SEND_INTERVAL 5000
// ============================================

DHT dht(DHTPIN, DHTTYPE);
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== Weather Station ESP32 -> ThingsBoard MQTT ===");
  dht.begin();
  connectWiFi();
  mqtt.setServer(TB_SERVER, TB_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected, reconnecting...");
    connectWiFi();
  }

  if (!mqtt.connected()) {
    reconnectMQTT();
  }
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("[DHT11] Failed to read sensor, skip...");
      return;
    }

    Serial.printf("[DHT11] Temp: %.1f C  Hum: %.1f%%\n", temperature, humidity);

    String payload = "{\"temperature\":";
    payload += String(temperature, 1);
    payload += ",\"humidity\":";
    payload += String(humidity, 1);
    payload += "}";

    if (mqtt.publish("v1/devices/me/telemetry", payload.c_str())) {
      Serial.println("[MQTT] Sent: " + payload);
    } else {
      Serial.println("[MQTT] Publish failed");
    }
  }
}

void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
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
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[WiFi] Connection failed, retrying...");
  }
}

void reconnectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("[MQTT] Connecting to ThingsBoard...");
    if (mqtt.connect("ESP32Weather", TB_TOKEN, NULL)) {
      Serial.println(" OK");
    } else {
      Serial.print(" Failed (rc=");
      Serial.print(mqtt.state());
      Serial.println("), retry in 5s...");
      delay(5000);
    }
  }
}
