"""
Serial Bridge - Python Script
Baca data JSON dari ESP32 via USB Serial (COM5), lalu POST ke local Next.js API.

Cara pakai:
  1. Jalankan Next.js dev server: npm run dev
  2. Upload esp32_serial_bridge.ino ke ESP32 via Arduino IDE
  3. Jalankan: python serial_bridge.py

Install dependency:
  pip install pyserial requests
"""

import serial
import json
import requests
import time

# ============================================
# KONFIGURASI
# ============================================
SERIAL_PORT = "COM5"
BAUD_RATE = 115200
API_URL = "http://localhost:3000/api/device"
API_KEY = "apiku_gacor"
# ============================================

def main():
    print("=== Serial Bridge ===")
    print(f"Serial: {SERIAL_PORT} @ {BAUD_RATE} baud")
    print(f"API:    {API_URL}")
    print()

    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
    time.sleep(2)  # tunggu ESP32 reset
    print("Serial connected! Menunggu data dari ESP32...\n")

    while True:
        try:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            # Skip log lines, langsung proses JSON
            if not line.startswith("{"):
                print(f"  [Serial] {line}")
                continue

            print(f"  [JSON]   {line}")

            data = json.loads(line)

            # Validasi field wajib
            if not all(k in data for k in ("device_id", "temperature", "humidity")):
                print("  [SKIP] JSON tidak lengkap, butuh device_id, temperature, humidity\n")
                continue

            # Kirim ke API
            headers = {
                "Content-Type": "application/json",
                "x-api-key": API_KEY,
            }
            resp = requests.post(API_URL, json=data, headers=headers)
            print(f"  [POST]  Status {resp.status_code}: {resp.text}\n")

        except json.JSONDecodeError as e:
            print(f"  [ERROR] JSON parse gagal: {e}\n")
        except requests.exceptions.ConnectionError:
            print("  [ERROR] Gagal koneksi ke API. Pastikan 'npm run dev' sudah jalan.\n")
            time.sleep(2)
        except KeyboardInterrupt:
            print("\n[DONE] Dihentikan oleh user.")
            break
        except Exception as e:
            print(f"  [ERROR] {e}\n")

    ser.close()

if __name__ == "__main__":
    main()
