#!/usr/bin/env node
/**
 * ThingsBoard MQTT Simulator (Node.js worker)
 * Sends fake temperature & humidity data via MQTT to ThingsBoard CE.
 * Supports pause/resume to simulate device offline.
 *
 * Usage:
 *   node worker.js
 *
 * Env vars (optional):
 *   TB_HOST         ThingsBoard host (default: localhost)
 *   TB_PORT         MQTT port (default: 1883)
 *   INTERVAL        Seconds between messages (default: 5)
 */

const mqtt = require("mqtt");

const TB_HOST = process.env.TB_HOST || "localhost";
const TB_PORT = process.env.TB_PORT || "1883";
const INTERVAL = parseFloat(process.env.INTERVAL || "5");

const DEVICES = [
  { name: "MT-021", token: process.env.TB_TOKEN_2 || "Io8CNkjZTgoWXf4c10Ra" },
];

function simulateTemperature(elapsedHours) {
  const base = 26.0;
  const dailyVar = 3.5 * Math.sin((elapsedHours - 6) * Math.PI / 12);
  const noise = (Math.random() - 0.5) * 0.6;
  return parseFloat((base + dailyVar + noise).toFixed(1));
}

function simulateHumidity(elapsedHours) {
  const base = 55.0;
  const dailyVar = -15.0 * Math.sin((elapsedHours - 6) * Math.PI / 12);
  const noise = (Math.random() - 0.5) * 3.0;
  return parseFloat(Math.max(20, Math.min(95, base + dailyVar + noise)).toFixed(1));
}

class DeviceSimulator {
  constructor(name, token) {
    this.name = name;
    this.token = token;
    this.connected = false;
    this.paused = false;
    this.messageCount = 0;
    this.client = null;
  }

  connect() {
    return new Promise((resolve) => {
      this.client = mqtt.connect(`mqtt://${TB_HOST}:${TB_PORT}`, {
        username: this.token,
        clientId: `sim_${this.name}_${Math.floor(Math.random() * 9000 + 1000)}`,
        reconnectPeriod: 3000,
      });

      this.client.on("connect", () => {
        this.connected = true;
        console.log(`  [${this.name}] Connected to ${TB_HOST}:${TB_PORT}`);
        resolve(true);
      });

      this.client.on("error", (err) => {
        console.error(`  [${this.name}] Error: ${err.message}`);
        resolve(false);
      });

      this.client.on("offline", () => {
        this.connected = false;
        console.log(`  [${this.name}] Offline`);
      });

      this.client.on("reconnect", () => {
        console.log(`  [${this.name}] Reconnecting...`);
      });
    });
  }

  publish(temperature, humidity) {
    if (!this.connected || this.paused) return false;

    const payload = JSON.stringify({ temperature, humidity });
    this.client.publish("v1/devices/me/telemetry", payload, (err) => {
      if (!err) {
        this.messageCount++;
        const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.log(`  [${this.name}] #${this.messageCount}  temp=${temperature}°C  hum=${humidity}%  [${ts}]`);
      }
    });
    return true;
  }

  pause() {
    this.paused = true;
    console.log(`  [${this.name}] PAUSED (simulating offline)`);
  }

  resume() {
    this.paused = false;
    console.log(`  [${this.name}] RESUMED (back online)`);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  ThingsBoard MQTT Worker (Node.js)");
  console.log(`  Target: ${TB_HOST}:${TB_PORT}`);
  console.log(`  Interval: ${INTERVAL}s`);
  console.log(`  Devices: ${DEVICES.length}`);
  console.log("=".repeat(60));
  console.log();
  console.log("  Commands:  p = pause random device");
  console.log("             r = resume all devices");
  console.log("             q = quit");
  console.log();

  const simulators = DEVICES.map((d) => new DeviceSimulator(d.name, d.token));

  // Connect all
  console.log("[*] Connecting devices...");
  for (const sim of simulators) {
    await sim.connect();
  }

  console.log(`\n[*] Sending telemetry every ${INTERVAL}s (Ctrl+C to stop)\n`);

  const startTime = Date.now();

  // Telemetry loop
  const intervalId = setInterval(() => {
    const elapsedHours = (Date.now() - startTime) / 3600000;

    for (const sim of simulators) {
      const temp = simulateTemperature(elapsedHours + (Math.random() - 0.5));
      const hum = simulateHumidity(elapsedHours + (Math.random() - 0.5));
      sim.publish(temp, hum);
    }
  }, INTERVAL * 1000);

  // Keyboard commands
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (key) => {
      const cmd = key.toString().trim().toLowerCase();
      if (cmd === "p") {
        // Pause a random device
        const online = simulators.filter((s) => !s.paused);
        if (online.length > 0) {
          const target = online[Math.floor(Math.random() * online.length)];
          target.pause();
        }
      } else if (cmd === "r") {
        for (const sim of simulators) sim.resume();
      } else if (cmd === "q" || cmd === "\u0003") {
        // Ctrl+C or q
        cleanup();
      }
    });
  }

  // Graceful shutdown
  function cleanup() {
    console.log("\n\n[*] Stopping worker...");
    clearInterval(intervalId);
    for (const sim of simulators) sim.disconnect();
    console.log("[*] Done.");
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch(console.error);
