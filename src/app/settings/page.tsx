"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { SettingForm } from "../../components/forms/SettingForm";
import { readSetting } from "@/actions";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Settings, Server, RefreshCw, Plus, Edit, Trash2, Cpu } from "lucide-react";
import { useDevices, DeviceData } from "@/hooks/useDevices";

export default function SettingsPage() {
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [loading, setLoading] = useState(true);

  const { devices, saveDevices, loaded: devicesLoaded } = useDevices();
  const [editingDevice, setEditingDevice] = useState<DeviceData | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await readSetting();
        if (result.data && result.data.length > 0) {
          setEntityType(result.data[0].entityType);
          setEntityId(result.data[0].entityId);
        }
      } catch (e) {
        console.log("Backend not available");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteDevice = (id: string) => {
    if (window.confirm("Are you sure you want to delete this device?")) {
      saveDevices(devices.filter(d => d.id !== id));
    }
  };

  const handleSaveDevice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDevice: DeviceData = {
      id: editingDevice?.id || `station-${Date.now()}`,
      name: formData.get("name") as string,
      temperature: Number(formData.get("temperature")),
      humidity: Number(formData.get("humidity")),
      tempChange: editingDevice ? editingDevice.tempChange : 0,
      humChange: editingDevice ? editingDevice.humChange : 0,
      history: editingDevice ? editingDevice.history : [
        { temp: Number(formData.get("temperature")), hum: Number(formData.get("humidity")) }
      ],
    };

    if (editingDevice) {
      saveDevices(devices.map(d => d.id === editingDevice.id ? newDevice : d));
    } else {
      saveDevices([...devices, newDevice]);
    }
    setShowForm(false);
    setEditingDevice(null);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your ThingsBoard IoT device connection credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Card: Current Configuration (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-cream-300/30 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
            <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100 mb-5">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-none">IoT Server Integration</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Live Status Connection</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400 font-medium">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                Loading connection info...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5 p-3.5 bg-cream-50 rounded-2xl border border-cream-200/20">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">ThingsBoard Entity Type</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-gray-700">{entityType || "Not configured"}</span>
                    <Badge className={entityType ? "bg-primary/10 text-primary border-none font-bold" : "bg-gray-100 text-gray-500 border-none font-bold"}>
                      {entityType ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 p-3.5 bg-cream-50 rounded-2xl border border-cream-200/20">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">ThingsBoard Entity ID</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-mono font-bold text-gray-600 truncate max-w-[200px]" title={entityId}>
                      {entityId || "Not configured"}
                    </span>
                    <Badge className={entityId ? "bg-primary/10 text-primary border-none font-bold" : "bg-gray-100 text-gray-500 border-none font-bold"}>
                      {entityId ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Update form (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-neu">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900">Device Management</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage your Arkananta MT nodes</p>
              </div>
              <button 
                onClick={() => { setEditingDevice(null); setShowForm(true); }}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-neu-sm"
              >
                <Plus className="h-4 w-4" />
                Add Device
              </button>
            </div>
            
            {showForm ? (
              <form onSubmit={handleSaveDevice} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <h4 className="font-bold text-sm mb-4">{editingDevice ? "Edit Device" : "Add New Device"}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Device Name</label>
                    <input name="name" defaultValue={editingDevice?.name} required className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g., Station #1 - Garden" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Current Temperature (°C)</label>
                    <input name="temperature" type="number" step="0.1" defaultValue={editingDevice?.temperature} required className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Current Humidity (%)</label>
                    <input name="humidity" type="number" step="1" defaultValue={editingDevice?.humidity} required className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 shadow-sm">Save Device</button>
                </div>
              </form>
            ) : null}

            <div className="flex flex-col gap-3">
              {devicesLoaded && devices.length > 0 ? (
                devices.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/50 hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-none">{device.name}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 block mt-1">
                          {device.temperature.toFixed(1)}°C — {device.humidity.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingDevice(device); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteDevice(device.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-slate-400">No devices found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
