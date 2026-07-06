"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { SettingForm } from "../../components/forms/SettingForm";
import { readSetting } from "@/actions";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Settings, Server, RefreshCw, Plus, Edit, Trash2, Cpu, MapPin, Key } from "lucide-react";
import { useDevices, DeviceData } from "@/hooks/useDevices";

export default function SettingsPage() {
  const [tbDeviceId, setTbDeviceId] = useState("");
  const [tbAccessToken, setTbAccessToken] = useState("");
  const [loading, setLoading] = useState(true);

  const { devices, addDevice, updateDevice, deleteDevice, loaded: devicesLoaded } = useDevices();
  const [editingDevice, setEditingDevice] = useState<DeviceData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await readSetting();
        if (result.data && result.data.length > 0) {
          setTbDeviceId(result.data[0].thingsboard_device_id || "");
          setTbAccessToken(result.data[0].thingsboard_access_token || "");
        }
      } catch (e) {
        console.log("Backend not available");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteDevice = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this device?")) {
      const { error } = await deleteDevice(id);
      if (error) alert("Failed to delete: " + error);
    }
  };

  const handleSaveDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const location = (formData.get("location") as string) || "";
    const thingsboardDeviceId = formData.get("thingsboard_device_id") as string;
    const thingsboardAccessToken = formData.get("thingsboard_access_token") as string;

    let result: { error: string | null };
    if (editingDevice) {
      result = await updateDevice(editingDevice.id, name, location, {
        thingsboardDeviceId: thingsboardDeviceId || undefined,
        thingsboardAccessToken: thingsboardAccessToken || undefined,
      });
    } else {
      result = await addDevice(name, location, {
        thingsboardDeviceId: thingsboardDeviceId || undefined,
        thingsboardAccessToken: thingsboardAccessToken || undefined,
      });
    }

    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setShowForm(false);
    setEditingDevice(null);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your ThingsBoard IoT integration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Card: IoT Server Configuration (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-md p-6 border border-cream-300/30 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
            <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100 mb-5">
              <div className="p-2.5 bg-primary/10 rounded-md text-primary">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-none">ThingsBoard Connection</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">MQTT + REST API</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400 font-medium">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                Loading connection info...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5 p-3.5 bg-cream-50 rounded-md border border-cream-200/20">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">ThingsBoard Device ID</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-mono font-bold text-gray-600 truncate max-w-[200px]" title={tbDeviceId}>
                      {tbDeviceId || "Not configured"}
                    </span>
                    <Badge className={tbDeviceId ? "bg-primary/10 text-primary border-none font-bold" : "bg-gray-100 text-gray-500 border-none font-bold"}>
                      {tbDeviceId ? "Set" : "Missing"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 p-3.5 bg-cream-50 rounded-md border border-cream-200/20">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Access Token</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-gray-700">{tbAccessToken ? "••••••••" : "Not configured"}</span>
                    <Badge className={tbAccessToken ? "bg-primary/10 text-primary border-none font-bold" : "bg-gray-100 text-gray-500 border-none font-bold"}>
                      {tbAccessToken ? "Set" : "Missing"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-md p-6 border border-cream-300/30 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100 mb-4">
              <Settings className="h-5 w-5 text-gray-400" />
              <h3 className="font-bold text-gray-900 text-sm">Global Settings</h3>
            </div>
            <SettingForm />
          </div>
        </div>

        {/* Right Card: Device Management (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-md p-6 border border-gray-200/60 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900">Device Management</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage your Arkananta MT nodes (synced to ThingsBoard + Supabase)</p>
              </div>
              <button
                onClick={() => { setEditingDevice(null); setShowForm(true); }}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-primary/90 transition-colors shadow-card"
              >
                <Plus className="h-4 w-4" />
                Add Device
              </button>
            </div>

            {showForm ? (
              <form onSubmit={handleSaveDevice} className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6">
                <h4 className="font-bold text-sm mb-4">{editingDevice ? "Edit Device" : "Add New Device"}</h4>
                {formError && (
                  <p className="text-xs text-red-500 font-semibold mb-3 bg-red-50 p-2 rounded-md">{formError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Device Name</label>
                    <input
                      name="name"
                      defaultValue={editingDevice?.name}
                      required
                      className="px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Station #1 — Garden"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Location</label>
                    <input
                      name="location"
                      defaultValue={editingDevice?.location ?? ""}
                      className="px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Garden, Rooftop"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">ThingsBoard Device ID</label>
                    <input
                      name="thingsboard_device_id"
                      defaultValue={(editingDevice as any)?.thingsboard_device_id ?? ""}
                      className="px-3 py-2 rounded-md border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Access Token</label>
                    <input
                      name="thingsboard_access_token"
                      defaultValue={(editingDevice as any)?.thingsboard_access_token ?? ""}
                      className="px-3 py-2 rounded-md border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Paste access token"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(null); }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-md text-xs font-bold hover:bg-primary/90 shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {saving && <RefreshCw className="h-3 w-3 animate-spin" />}
                    {saving ? "Saving..." : "Save Device"}
                  </button>
                </div>
              </form>
            ) : null}

            <div className="flex flex-col gap-3">
              {devicesLoaded && devices.length > 0 ? (
                devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-md border border-slate-200/50 hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md text-primary">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-none">{device.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {device.location && (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
                              <MapPin className="h-2.5 w-2.5" />
                              {device.location}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-slate-500">
                            {device.temperature.toFixed(1)}°C — {device.humidity.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingDevice(device); setShowForm(true); }}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : devicesLoaded ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  <Cpu className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                  No devices found. Add one above!
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 gap-2 text-sm text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  Loading devices...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
