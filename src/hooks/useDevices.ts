import { useState, useEffect, useCallback } from 'react';
import createSupabaseClientClient from '@/lib/supabase/client';

export interface DeviceData {
  id: string;
  name: string;
  location: string | null;
  temperature: number;
  humidity: number;
  tempChange: number;
  humChange: number;
  history: { temp: number; hum: number; created_at?: string }[];
}

function mapRowsToDevice(
  device: { id: string; name: string; location: string | null },
  history: { id: string; device_id: string; temperature: number; humidity: number; created_at: string }[]
): DeviceData {
  const deviceHistory = history
    .filter((h) => h.device_id === device.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const latestReading = deviceHistory[deviceHistory.length - 1];
  const previousReading = deviceHistory[deviceHistory.length - 2];

  const temperature = latestReading?.temperature ?? 0;
  const humidity = latestReading?.humidity ?? 0;

  const tempChange =
    latestReading && previousReading
      ? parseFloat(
          (
            ((latestReading.temperature - previousReading.temperature) /
              (previousReading.temperature || 1)) *
            100
          ).toFixed(1)
        )
      : 0;

  const humChange =
    latestReading && previousReading
      ? parseFloat(
          (
            ((latestReading.humidity - previousReading.humidity) /
              (previousReading.humidity || 1)) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    id: device.id,
    name: device.name,
    location: device.location,
    temperature,
    humidity,
    tempChange,
    humChange,
    history: deviceHistory.map((h) => ({
      temp: h.temperature,
      hum: h.humidity,
      created_at: h.created_at,
    })),
  };
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
      .select('id, name, location')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (devErr) {
      console.error('[useDevices] Failed to fetch devices:', devErr.message);
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

    const { data: historyRows, error: histErr } = await supabase
      .from('device_history')
      .select('id, device_id, temperature, humidity, created_at')
      .in('device_id', deviceIds)
      .order('created_at', { ascending: false })
      .limit(50 * deviceIds.length);

    if (histErr) {
      console.error('[useDevices] Failed to fetch history:', histErr.message);
      setError(histErr.message);
      setLoaded(true);
      return;
    }

    const mapped = deviceRows.map((d) => mapRowsToDevice(d, historyRows ?? []));
    setDevices(mapped);
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Realtime: Listen for new sensor readings and re-fetch when they arrive
  useEffect(() => {
    const supabase = createSupabaseClientClient();

    const channel = supabase
      .channel('device_history_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'device_history' },
        () => {
          fetchDevices();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices]);

  // Add a new device to Supabase
  const addDevice = useCallback(
    async (name: string, location: string) => {
      const supabase = createSupabaseClientClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase.from('devices').insert({ name, location, user_id: user.id });
      if (error) {
        console.error('[useDevices] addDevice error:', error.message);
        return { error: error.message };
      }
      await fetchDevices();
      return { error: null };
    },
    [fetchDevices]
  );

  // Update a device in Supabase
  const updateDevice = useCallback(
    async (id: string, name: string, location: string) => {
      const supabase = createSupabaseClientClient();
      const { error } = await supabase.from('devices').update({ name, location }).eq('id', id);
      if (error) {
        console.error('[useDevices] updateDevice error:', error.message);
        return { error: error.message };
      }
      await fetchDevices();
      return { error: null };
    },
    [fetchDevices]
  );

  // Delete a device from Supabase
  const deleteDevice = useCallback(
    async (id: string) => {
      const supabase = createSupabaseClientClient();
      const { error } = await supabase.from('devices').delete().eq('id', id);
      if (error) {
        console.error('[useDevices] deleteDevice error:', error.message);
        return { error: error.message };
      }
      await fetchDevices();
      return { error: null };
    },
    [fetchDevices]
  );

  return { devices, loaded, error, addDevice, updateDevice, deleteDevice };
}
