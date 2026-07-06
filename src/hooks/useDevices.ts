"use client";

import { useState, useEffect, useCallback } from "react";
import createSupabaseClientClient from "@/lib/supabase/client";
import { getDevicesWithTbTelemetry } from "@/actions";

export interface DeviceData {
  id: string;
  name: string;
  location: string | null;
  temperature: number;
  humidity: number;
  tempChange: number;
  humChange: number;
  history: { temp: number; hum: number; created_at?: string }[];
  lastSeen: string | null;
  isOnline: boolean;
}

export function useDevices() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    const supabase = createSupabaseClientClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setDevices([]);
      setLoaded(true);
      return;
    }

    const { data: deviceRows, error: devErr } = await supabase
      .from('devices')
      .select('id, name, location, thingsboard_device_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (devErr) {
      setError(devErr.message);
      setLoaded(true);
      return;
    }

    if (!deviceRows || deviceRows.length === 0) {
      setDevices([]);
      setLoaded(true);
      return;
    }

    // Batch fetch ALL history for all devices at once
    const deviceIds = deviceRows.map((d) => d.id);
    const { data: allHistoryRows } = await supabase
      .from('device_history')
      .select('device_id, temperature, humidity, created_at')
      .in('device_id', deviceIds)
      .order('created_at', { ascending: true });

    // Group history by device_id
    const historyByDevice = new Map<string, { temp: number; hum: number; created_at: string }[]>();
    const lastSeenByDevice = new Map<string, string>();
    (allHistoryRows || []).forEach((row) => {
      if (!historyByDevice.has(row.device_id)) {
        historyByDevice.set(row.device_id, []);
      }
      historyByDevice.get(row.device_id)!.push({
        temp: row.temperature,
        hum: row.humidity,
        created_at: row.created_at,
      });
      lastSeenByDevice.set(row.device_id, row.created_at);
    });

    const mapped: DeviceData[] = deviceRows.map((d) => {
      const history = historyByDevice.get(d.id) || [];
      const lastSeen = lastSeenByDevice.get(d.id) ?? null;
      const isOnline = lastSeen
        ? (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000
        : false;
      const latestTemp = history.length > 0 ? history[history.length - 1].temp : 0;
      const latestHum = history.length > 0 ? history[history.length - 1].hum : 0;

      return {
        id: d.id,
        name: d.name,
        location: d.location,
        temperature: latestTemp,
        humidity: latestHum,
        tempChange: history.length > 1
          ? parseFloat((((latestTemp - history[history.length - 2].temp) / (history[history.length - 2].temp || 1)) * 100).toFixed(1))
          : 0,
        humChange: history.length > 1
          ? parseFloat((((latestHum - history[history.length - 2].hum) / (history[history.length - 2].hum || 1)) * 100).toFixed(1))
          : 0,
        history,
        lastSeen,
        isOnline,
      };
    });

    setDevices(mapped);
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Sync ThingsBoard telemetry → Supabase device_history (on load + every 60s)
  useEffect(() => {
    const syncTb = async () => {
      await getDevicesWithTbTelemetry();
      await fetchDevices();
    };
    syncTb();
    const interval = setInterval(syncTb, 60000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Realtime: listen for device list changes in Supabase
  useEffect(() => {
    const supabase = createSupabaseClientClient();

    const channel = supabase
      .channel('devices_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        () => fetchDevices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices]);

  const addDevice = useCallback(async (name: string, location: string, opts?: { thingsboardDeviceId?: string; thingsboardAccessToken?: string }) => {
    const supabase = createSupabaseClientClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase.from('devices').insert({
      name,
      location,
      user_id: user.id,
      thingsboard_device_id: opts?.thingsboardDeviceId || null,
      thingsboard_access_token: opts?.thingsboardAccessToken || null,
    });
    if (error) return { error: error.message };
    await fetchDevices();
    return { error: null };
  }, [fetchDevices]);

  const updateDevice = useCallback(async (id: string, name: string, location: string, opts?: { thingsboardDeviceId?: string; thingsboardAccessToken?: string }) => {
    const supabase = createSupabaseClientClient();
    const updateData: Record<string, any> = { name, location };
    if (opts?.thingsboardDeviceId !== undefined) updateData.thingsboard_device_id = opts.thingsboardDeviceId;
    if (opts?.thingsboardAccessToken !== undefined) updateData.thingsboard_access_token = opts.thingsboardAccessToken;
    const { error } = await supabase.from('devices').update(updateData).eq('id', id);
    if (error) return { error: error.message };
    await fetchDevices();
    return { error: null };
  }, [fetchDevices]);

  const deleteDevice = useCallback(async (id: string) => {
    const supabase = createSupabaseClientClient();
    const { error } = await supabase.from('devices').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchDevices();
    return { error: null };
  }, [fetchDevices]);

  return { devices, loaded, error, addDevice, updateDevice, deleteDevice };
}
