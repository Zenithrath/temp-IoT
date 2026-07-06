#!/usr/bin/env python3
"""
ThingsBoard MQTT Simulator
Sends fake temperature & humidity data via MQTT to ThingsBoard CE.

Usage:
  pip install paho-mqtt
  python simulator.py

Env vars (optional):
  TB_HOST         ThingsBoard host (default: localhost)
  TB_PORT         MQTT port (default: 1883)
  TB_TOKEN        Device access token (default: HBrD0pYsbErz9uFdsq93)
  INTERVAL        Seconds between messages (default: 5)
  DEVICE_COUNT    Number of virtual devices (default: 2)
"""

import os
import sys
import json
import time
import random
import math
from datetime import datetime

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("ERROR: paho-mqtt not installed. Run: pip install paho-mqtt")
    sys.exit(1)

TB_HOST = os.environ.get("TB_HOST", "localhost")
TB_PORT = int(os.environ.get("TB_PORT", "1883"))
INTERVAL = float(os.environ.get("INTERVAL", "5"))

# Device access tokens — match what's in Supabase settings table
DEVICES = [
    {"name": "MT-021", "token": os.environ.get("TB_TOKEN_2", "Io8CNkjZTgoWXf4c10Ra")},
]

# Simulate realistic weather patterns
def simulate_temperature(elapsed_hours: float) -> float:
    """Simulate daily temperature cycle: cooler at night, warmer at day."""
    base = 26.0
    daily_variation = 3.5 * math.sin((elapsed_hours - 6) * math.pi / 12)  # peak at noon
    noise = random.gauss(0, 0.3)
    return round(base + daily_variation + noise, 1)

def simulate_humidity(elapsed_hours: float) -> float:
    """Simulate humidity — inversely correlated with temperature."""
    base = 55.0
    daily_variation = -15.0 * math.sin((elapsed_hours - 6) * math.pi / 12)
    noise = random.gauss(0, 1.5)
    return round(max(20, min(95, base + daily_variation + noise)), 1)


class DeviceSimulator:
    def __init__(self, name: str, token: str):
        self.name = name
        self.token = token
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"sim_{name}_{random.randint(1000,9999)}")
        self.connected = False
        self.message_count = 0

        # Set auth
        self.client.username_pw_set(token)

        # Callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.connected = True
            print(f"  [{self.name}] Connected to {TB_HOST}:{TB_PORT}")
        else:
            print(f"  [{self.name}] Connection failed: rc={rc}")

    def _on_disconnect(self, client, userdata, flags, rc, properties=None):
        self.connected = False
        if rc != 0:
            print(f"  [{self.name}] Unexpected disconnect (rc={rc}), reconnecting...")

    def _on_publish(self, client, userdata, mid):
        self.message_count += 1

    def connect(self):
        try:
            self.client.connect(TB_HOST, TB_PORT, keepalive=60)
            self.client.loop_start()
            return True
        except Exception as e:
            print(f"  [{self.name}] Cannot connect: {e}")
            return False

    def publish(self, temperature: float, humidity: float):
        if not self.connected:
            return False

        payload = json.dumps({
            "temperature": temperature,
            "humidity": humidity,
        })

        result = self.client.publish("v1/devices/me/telemetry", payload)
        if result.rc == 0:
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"  [{self.name}] #{self.message_count + 1}  temp={temperature}°C  hum={humidity}%  [{ts}]")
        return result.rc == 0

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()


def main():
    print("=" * 60)
    print("  ThingsBoard MQTT Simulator")
    print(f"  Target: {TB_HOST}:{TB_PORT}")
    print(f"  Interval: {INTERVAL}s")
    print(f"  Devices: {len(DEVICES)}")
    print("=" * 60)
    print()

    simulators = []
    for dev in DEVICES:
        sim = DeviceSimulator(dev["name"], dev["token"])
        simulators.append(sim)

    # Connect all devices
    print("[*] Connecting devices...")
    all_connected = True
    for sim in simulators:
        if not sim.connect():
            all_connected = False

    if not all_connected:
        print("\n[!] Some devices failed to connect. Retrying in background...")
        time.sleep(3)

    print(f"\n[*] Sending telemetry every {INTERVAL}s (Ctrl+C to stop)\n")

    start_time = time.time()
    try:
        while True:
            elapsed_hours = (time.time() - start_time) / 3600

            for sim in simulators:
                temp = simulate_temperature(elapsed_hours + random.uniform(-0.5, 0.5))
                hum = simulate_humidity(elapsed_hours + random.uniform(-0.5, 0.5))
                sim.publish(temp, hum)

            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\n\n[*] Stopping simulator...")
        for sim in simulators:
            sim.disconnect()
        print("[*] Done.")


if __name__ == "__main__":
    main()
