"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { SettingForm } from "../../components/forms/SettingForm";
import { readSetting } from "@/actions";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Settings, Server, RefreshCw, Plus, Edit, Trash2, Cpu, MapPin } from "lucide-react";
import { useDevices, DeviceData } from "@/hooks/useDevices";

export default function SettingsPage() {
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
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

    let result: { error: string | null };
    if (editingDevice) {
      result = await updateDevice(editingDevice.id, name, location);
    } else {
      result = await addDevice(name, location);
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
        <p className="text-sm text-gray-500 mt-1">Configure your IoT device connection credentials</p>
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

        {/* Right Card: Device Management (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-neu">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900">Device Management</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage your Arkananta MT nodes (synced to Supabase)</p>
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
                {formError && (
                  <p className="text-xs text-red-500 font-semibold mb-3 bg-red-50 p-2 rounded-lg">{formError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Device Name</label>
                    <input
                      name="name"
                      defaultValue={editingDevice?.name}
                      required
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Station #1 — Garden"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Location</label>
                    <input
                      name="location"
                      defaultValue={editingDevice?.location ?? ""}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Garden, Rooftop"
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
                    className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 shadow-sm disabled:opacity-60 flex items-center gap-1.5"
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
                  <div key={device.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/50 hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
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
                  No devices found in Supabase. Add one above!
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
