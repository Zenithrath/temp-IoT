"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import createSupabaseClientClient from "@/lib/supabase/client";

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
  thingsboard_device_id?: string | null;
  thingsboard_access_token?: string | null;
}

export function useDevices() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchDevices = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const supabase = createSupabaseClientClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDevices([]);
        setLoaded(true);
        return;
      }

      const { data: deviceRows, error: devErr } = await supabase
        .from('devices')
        .select('id, name, location, thingsboard_device_id, thingsboard_access_token')
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

      const deviceIds = deviceRows.map((d) => d.id);

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: historyRows } = await supabase
        .from('device_history')
        .select('device_id, temperature, humidity, created_at')
        .in('device_id', deviceIds)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);

      const historyByDevice = new Map<string, { temp: number; hum: number; created_at: string }[]>();
      (historyRows || []).forEach((row) => {
        const arr = historyByDevice.get(row.device_id) || [];
        arr.unshift({
          temp: row.temperature,
          hum: row.humidity,
          created_at: row.created_at,
        });
        historyByDevice.set(row.device_id, arr);
      });

      const mapped: DeviceData[] = deviceRows.map((d) => {
        const history = historyByDevice.get(d.id) || [];
        const latest = history[history.length - 1];
        const previous = history.length > 1 ? history[history.length - 2] : null;

        const lastSeen = latest?.created_at ?? null;
        const isOnline = lastSeen
          ? (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000
          : false;

        const latestTemp = latest?.temp ?? 0;
        const latestHum = latest?.hum ?? 0;

        return {
          id: d.id,
          name: d.name,
          location: d.location,
          temperature: latestTemp,
          humidity: latestHum,
          tempChange: previous
            ? parseFloat((((latestTemp - previous.temp) / (previous.temp || 1)) * 100).toFixed(1))
            : 0,
          humChange: previous
            ? parseFloat((((latestHum - previous.hum) / (previous.hum || 1)) * 100).toFixed(1))
            : 0,
          history,
          lastSeen,
          isOnline,
          thingsboard_device_id: d.thingsboard_device_id,
          thingsboard_access_token: d.thingsboard_access_token,
        };
      });

      setDevices(mapped);
      setLoaded(true);
    } catch {
      setError(null);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  useEffect(() => {
    const sync = async () => {
      try {
        await fetch('/api/sync');
        await fetchDevices();
      } catch {
        // Retry next cycle
      }
    };
    sync();
    const interval = setInterval(sync, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  useEffect(() => {
    const supabase = createSupabaseClientClient();

    const channel = supabase
      .channel('device_history_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'device_history' },
        () => fetchDevices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices]);

  const addDevice = useCallback(async (
    name: string,
    location: string,
    opts?: { thingsboardDeviceId?: string; thingsboardAccessToken?: string }
  ) => {
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

  const updateDevice = useCallback(async (
    id: string,
    name: string,
    location: string,
    opts?: { thingsboardDeviceId?: string; thingsboardAccessToken?: string }
  ) => {
    const supabase = createSupabaseClientClient();
    const { error } = await supabase
      .from('devices')
      .update({
        name,
        location,
        ...(opts?.thingsboardDeviceId !== undefined && { thingsboard_device_id: opts.thingsboardDeviceId }),
        ...(opts?.thingsboardAccessToken !== undefined && { thingsboard_access_token: opts.thingsboardAccessToken }),
      })
      .eq('id', id);
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
