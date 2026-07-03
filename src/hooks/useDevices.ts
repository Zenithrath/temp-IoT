import { useState, useEffect } from 'react';

export interface DeviceData {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  tempChange: number;
  humChange: number;
  history: { temp: number; hum: number }[];
}

const defaultDevices: DeviceData[] = [
  {
    id: "station-1",
    name: "Station #1 — Garden",
    temperature: 28.5,
    humidity: 65,
    tempChange: 2.3,
    humChange: -1.2,
    history: [
      { temp: 26.2, hum: 58 }, { temp: 27.1, hum: 60 }, { temp: 28.0, hum: 62 },
      { temp: 28.8, hum: 64 }, { temp: 29.2, hum: 66 }, { temp: 28.7, hum: 65 }, { temp: 28.5, hum: 65 },
    ],
  },
  {
    id: "station-2",
    name: "Station #2 — Living Room",
    temperature: 22.1,
    humidity: 52,
    tempChange: -0.8,
    humChange: 3.5,
    history: [
      { temp: 23.0, hum: 48 }, { temp: 22.8, hum: 49 }, { temp: 22.5, hum: 50 },
      { temp: 22.2, hum: 51 }, { temp: 22.0, hum: 52 }, { temp: 22.1, hum: 52 }, { temp: 22.1, hum: 52 },
    ],
  },
  {
    id: "station-3",
    name: "Station #3 — Rooftop",
    temperature: 31.4,
    humidity: 45,
    tempChange: 4.1,
    humChange: -3.8,
    history: [
      { temp: 28.5, hum: 55 }, { temp: 29.2, hum: 52 }, { temp: 30.1, hum: 50 },
      { temp: 30.8, hum: 48 }, { temp: 31.5, hum: 46 }, { temp: 31.2, hum: 45 }, { temp: 31.4, hum: 45 },
    ],
  },
];

export function useDevices() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("arkananta_devices");
    if (stored) {
      try {
        setDevices(JSON.parse(stored));
      } catch (e) {
        setDevices(defaultDevices);
        localStorage.setItem("arkananta_devices", JSON.stringify(defaultDevices));
      }
    } else {
      setDevices(defaultDevices);
      localStorage.setItem("arkananta_devices", JSON.stringify(defaultDevices));
    }
    setLoaded(true);
  }, []);

  const saveDevices = (newDevices: DeviceData[]) => {
    setDevices(newDevices);
    localStorage.setItem("arkananta_devices", JSON.stringify(newDevices));
    // Dispatch a custom event to notify other tabs/components
    window.dispatchEvent(new Event("devices_updated"));
  };

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem("arkananta_devices");
      if (stored) {
        setDevices(JSON.parse(stored));
      }
    };
    window.addEventListener("devices_updated", handleUpdate);
    return () => window.removeEventListener("devices_updated", handleUpdate);
  }, []);

  return { devices, saveDevices, loaded };
}
