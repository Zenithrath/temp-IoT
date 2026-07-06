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

interface TbTelemetryValue {
  ts: number;
  value: string;
}

interface TbTelemetryResponse {
  temperature?: TbTelemetryValue[];
  humidity?: TbTelemetryValue[];
}

function parseTbTelemetry(telemetry: TbTelemetryResponse | undefined) {
  if (!telemetry) {
    return { temperature: 0, humidity: 0, tempChange: 0, humChange: 0, history: [] as { temp: number; hum: number; created_at?: string }[] };
  }

  const tempValues = (telemetry.temperature || []).map((v) => ({
    ts: v.ts,
    value: parseFloat(v.value),
  }));

  const humValues = (telemetry.humidity || []).map((v) => ({
    ts: v.ts,
    value: parseFloat(v.value),
  }));

  tempValues.sort((a, b) => a.ts - b.ts);
  humValues.sort((a, b) => a.ts - b.ts);

  const latestTemp = tempValues[tempValues.length - 1]?.value ?? 0;
  const latestHum = humValues[humValues.length - 1]?.value ?? 0;
  const prevTemp = tempValues[tempValues.length - 2]?.value ?? latestTemp;
  const prevHum = humValues[humValues.length - 2]?.value ?? latestHum;

  const tempChange = prevTemp !== 0
    ? parseFloat((((latestTemp - prevTemp) / prevTemp) * 100).toFixed(1))
    : 0;

  const humChange = prevHum !== 0
    ? parseFloat((((latestHum - prevHum) / prevHum) * 100).toFixed(1))
    : 0;

  const tempMap = new Map(tempValues.map((v) => [v.ts, v.value]));
  const allTsSet = new Set<number>([...tempValues.map((v) => v.ts), ...humValues.map((v) => v.ts)]);
  const allTs = Array.from(allTsSet).sort((a, b) => a - b);

  const history = allTs.map((ts) => ({
    temp: tempMap.get(ts) ?? 0,
    hum: humValues.find((h) => h.ts === ts)?.value ?? 0,
    created_at: new Date(ts).toISOString(),
  }));

  return { temperature: latestTemp, humidity: latestHum, tempChange, humChange, history };
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

    // Fallback: jika ada thingsboard_device_id, fetch dari ThingsBoard
    const tbDevices = deviceRows.filter((d) => d.thingsboard_device_id);
    let tbTelemetryMap = new Map<string, TbTelemetryResponse>();

    if (tbDevices.length > 0) {
      const result = await getDevicesWithTbTelemetry();
      if (result.data) {
        for (const device of result.data as any[]) {
          if (device.telemetry) {
            tbTelemetryMap.set(device.id, device.telemetry);
          }
        }
      }
    }

    const mapped: DeviceData[] = await Promise.all(
      deviceRows.map(async (d) => {
        const tbData = parseTbTelemetry(tbTelemetryMap.get(d.id));

        // Fetch ALL history from Supabase device_history
        const { data: historyRows } = await supabase
          .from('device_history')
          .select('temperature, humidity, created_at')
          .eq('device_id', d.id)
          .order('created_at', { ascending: true });

        // Fetch latest reading for online/offline status
        const { data: latestRow } = await supabase
          .from('device_history')
          .select('created_at')
          .eq('device_id', d.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastSeen = latestRow?.created_at ?? null;
        const isOnline = lastSeen
          ? (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000
          : false;

        const supabaseHistory = (historyRows || [])
          .map((r) => ({
            temp: r.temperature,
            hum: r.humidity,
            created_at: r.created_at,
          }));

        // Use Supabase history if available, fallback to ThingsBoard history
        const history = supabaseHistory.length > 0 ? supabaseHistory : tbData.history;

        return {
          id: d.id,
          name: d.name,
          location: d.location,
          temperature: tbData.temperature,
          humidity: tbData.humidity,
          tempChange: tbData.tempChange,
          humChange: tbData.humChange,
          history,
          lastSeen,
          isOnline,
        };
      })
    );

    setDevices(mapped);
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchDevices, 5000);
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
