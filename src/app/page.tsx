"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DeviceCard, type DeviceData } from "@/components/DeviceCard";
import dynamic from "next/dynamic";
import createSupabaseClientClient from "@/lib/supabase/client";

const SplineComponent = dynamic(() => import("@/components/SplineComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-cream-100/30 rounded-md border border-gray-200/50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-4 h-4 border-2 border-primary/30 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loading...</span>
      </div>
    </div>
  ),
});
import { 
  TrendingUp, 
  TrendingDown, 
  Thermometer, 
  Droplets,
  Activity,
  Cpu,
  ChevronDown,
} from "lucide-react";

import { useDevices } from "@/hooks/useDevices";

interface DeviceStats {
  avgTemp: number;
  avgHum: number;
  minTemp: number;
  maxTemp: number;
  dataPoints: number;
}

export default function Home() {
  const { devices, loaded } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);

  useEffect(() => {
    if (loaded && devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [loaded, devices, selectedDeviceId]);

  // Fetch stats from Supabase (last 7 days) for selected device — same as analytics
  const fetchDeviceStats = useCallback(async () => {
    if (!selectedDeviceId) return;
    const supabase = createSupabaseClientClient();
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: rows } = await supabase
      .from('device_history')
      .select('temperature, humidity')
      .eq('device_id', selectedDeviceId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (!rows || rows.length === 0) {
      setDeviceStats(null);
      return;
    }

    const temps = rows.map((r) => r.temperature);
    const hums = rows.map((r) => r.humidity);
    const avgTemp = parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1));
    const avgHum = Math.round(hums.reduce((a, b) => a + b, 0) / hums.length);

    setDeviceStats({
      avgTemp,
      avgHum,
      minTemp: parseFloat(Math.min(...temps).toFixed(1)),
      maxTemp: parseFloat(Math.max(...temps).toFixed(1)),
      dataPoints: rows.length,
    });
  }, [selectedDeviceId]);

  useEffect(() => {
    fetchDeviceStats();
  }, [fetchDeviceStats]);

  // Polling stats every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchDeviceStats, 10000);
    return () => clearInterval(interval);
  }, [fetchDeviceStats]);

  if (!loaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary/40"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (devices.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
          <Cpu className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-gray-500">No devices found.</p>
          <p className="text-xs text-gray-400">Add devices and sensor history to your Supabase database to get started.</p>
        </div>
      </DashboardLayout>
    );
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  // Use Supabase stats if available, fallback to history-based
  const avgTemp = deviceStats?.avgTemp ?? (selectedDevice.history.length > 0
    ? selectedDevice.history.reduce((sum, h) => sum + h.temp, 0) / selectedDevice.history.length
    : 0);
  const avgHum = deviceStats?.avgHum ?? (selectedDevice.history.length > 0
    ? selectedDevice.history.reduce((sum, h) => sum + h.hum, 0) / selectedDevice.history.length
    : 0);
  const minTemp = deviceStats?.minTemp ?? (selectedDevice.history.length > 0
    ? Math.min(...selectedDevice.history.map(h => h.temp))
    : 0);
  const maxTemp = deviceStats?.maxTemp ?? (selectedDevice.history.length > 0
    ? Math.max(...selectedDevice.history.map(h => h.temp))
    : 0);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.isOnline).length;
  const avgTempAll = devices.reduce((s, d) => s + d.temperature, 0) / (devices.length || 1);
  const avgHumAll = devices.reduce((s, d) => s + d.humidity, 0) / (devices.length || 1);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-5">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-none">
            Arkananta MT
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Dashboard Monitoring Mobile Tower</p>
        </div>

        {/* Quick stats pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md shadow-card">
            <Cpu className="h-3 w-3 text-primary" />
            <span className="text-[10px] sm:text-xs font-bold text-gray-700">{onlineDevices}/{totalDevices}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md shadow-card">
            <Thermometer className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-gray-700">{avgTempAll.toFixed(1)}°C</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md shadow-card">
            <Droplets className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-gray-700">{avgHumAll.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Main Layout: 3D + Average Card */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mb-4 sm:mb-5">
        {/* 3D Model */}
        <div className="col-span-1 lg:col-span-7 flex">
          <div className="h-[145px] sm:h-[220px] lg:h-[300px] w-full relative rounded-md overflow-hidden bg-white shadow-card border border-gray-200/60">
            <SplineComponent />
            <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-white/80 backdrop-blur-md px-2 py-1 rounded-md shadow-card text-[9px] sm:text-[10px] font-bold text-gray-500 flex items-center gap-1.5 pointer-events-none">
              <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary animate-pulse" />
              3D View
            </div>
          </div>
        </div>

        {/* Average Card */}
        <div className="col-span-1 lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-md p-3 sm:p-5 shadow-card border border-gray-200/60 h-[145px] sm:h-[220px] lg:h-[300px] flex flex-col justify-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center justify-between gap-1.5 sm:mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Device Stats</h3>
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">7 Days</span>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200/60 hover:bg-gray-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-[9px] sm:text-[10px] font-bold text-slate-600 transition-colors"
                >
                  <Cpu className="h-3 w-3 text-primary" />
                  <span className="max-w-[60px] sm:max-w-[70px] truncate">{selectedDevice.name}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 sm:w-48 bg-white rounded-md shadow-card-elevated border border-gray-200/60 py-1 z-50">
                    {devices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setSelectedDeviceId(d.id); setDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-[10px] sm:text-xs font-semibold flex items-center gap-2 ${
                          d.id === selectedDeviceId ? "text-primary bg-primary/5" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Cpu className={`h-3 w-3 ${d.id === selectedDeviceId ? "text-primary" : "text-gray-400"}`} />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span>{d.name}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${d.isOnline ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                          </div>
                          {d.location && <span className="text-[9px] sm:text-[10px] text-gray-400 font-normal">{d.location}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-gray-50 rounded-md p-2 sm:p-3 flex flex-col items-center sm:items-start border border-gray-200/60">
                <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                  <Thermometer className="h-3 w-3 text-primary" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Temp</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-sm sm:text-2xl font-extrabold text-slate-800 tabular-nums">{avgTemp.toFixed(1)}</span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 ml-0.5">°C</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-2 sm:p-3 flex flex-col items-center sm:items-start border border-gray-200/60">
                <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                  <Droplets className="h-3 w-3 text-blue-500" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Hum</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-sm sm:text-2xl font-extrabold text-slate-800 tabular-nums">{avgHum.toFixed(0)}</span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 ml-0.5">%</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block mb-2 sm:mb-3">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Range</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500">{minTemp.toFixed(1)}°C — {maxTemp.toFixed(1)}°C</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 w-full overflow-hidden p-0.5 border border-gray-200/60">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full"
                  style={{ width: `${maxTemp !== minTemp ? ((avgTemp - minTemp) / (maxTemp - minTemp)) * 100 : 50}%` }}
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-between pt-2 border-t border-gray-200/60 mt-auto">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  selectedDevice.isOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                    : 'bg-gray-300'
                }`} />
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {selectedDevice.isOnline ? 'Online' : 'Offline'}
                </span>
                {deviceStats && (
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-300">
                    {deviceStats.dataPoints} pts
                  </span>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-[10px] sm:text-xs font-bold text-slate-700">{selectedDevice.temperature.toFixed(1)}°C</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-700">{selectedDevice.humidity}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Data Cards */}
      <h2 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight mb-2 sm:mb-3">Live Nodes</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </DashboardLayout>
  );
}
