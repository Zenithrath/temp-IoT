import { useState, useEffect, useCallback } from 'react';
import createSupabaseClientClient from '@/lib/supabase/client';

export type TimeRange = '1w' | '2w' | '1m' | '1y';

export interface AnalyticsData {
  labels: string[];
  temp: number[];
  hum: number[];
  avgTemp: number;
  avgHum: number;
  minTemp: number;
  maxTemp: number;
  minHum: number;
  maxHum: number;
  tempChange: number;
  humChange: number;
  rawReadings: RawReading[];
}

export interface RawReading {
  created_at: string;
  temperature: number;
  humidity: number;
}

function getRangeDays(timeRange: TimeRange): number {
  switch (timeRange) {
    case '1w': return 7;
    case '2w': return 14;
    case '1m': return 30;
    case '1y': return 365;
  }
}

function formatLabel(d: Date, timeRange: TimeRange): string {
  if (timeRange === '1y') {
    return d.toLocaleDateString('en-US', { month: 'short' });
  }
  if (timeRange === '1m') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function computeStats(values: number[]) {
  if (values.length === 0) {
    return { avg: 0, min: 0, max: 0 };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: parseFloat((sum / values.length).toFixed(1)),
    min: parseFloat(Math.min(...values).toFixed(1)),
    max: parseFloat(Math.max(...values).toFixed(1)),
  };
}

function computeChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

function buildAnalytics(
  readings: RawReading[],
  timeRange: TimeRange,
): AnalyticsData {
  if (readings.length === 0) {
    return {
      labels: [], temp: [], hum: [],
      avgTemp: 0, avgHum: 0,
      minTemp: 0, maxTemp: 0, minHum: 0, maxHum: 0,
      tempChange: 0, humChange: 0,
      rawReadings: [],
    };
  }

  const labels = readings.map((r) => formatLabel(new Date(r.created_at), timeRange));
  const temps = readings.map((r) => r.temperature);
  const hums = readings.map((r) => r.humidity);

  const tempStats = computeStats(temps);
  const humStats = computeStats(hums);

  const rangeDays = getRangeDays(timeRange);
  const midTs = readings[0] ? new Date(readings[0].created_at).getTime() + (new Date(readings[readings.length - 1].created_at).getTime() - new Date(readings[0].created_at).getTime()) / 2 : 0;

  const firstHalf = readings.filter((r) => new Date(r.created_at).getTime() <= midTs);
  const secondHalf = readings.filter((r) => new Date(r.created_at).getTime() > midTs);

  const firstHalfTempAvg = firstHalf.length ? firstHalf.reduce((a, r) => a + r.temperature, 0) / firstHalf.length : 0;
  const secondHalfTempAvg = secondHalf.length ? secondHalf.reduce((a, r) => a + r.temperature, 0) / secondHalf.length : 0;
  const firstHalfHumAvg = firstHalf.length ? firstHalf.reduce((a, r) => a + r.humidity, 0) / firstHalf.length : 0;
  const secondHalfHumAvg = secondHalf.length ? secondHalf.reduce((a, r) => a + r.humidity, 0) / secondHalf.length : 0;

  return {
    labels,
    temp: temps,
    hum: hums,
    avgTemp: tempStats.avg,
    avgHum: humStats.avg,
    minTemp: tempStats.min,
    maxTemp: tempStats.max,
    minHum: humStats.min,
    maxHum: humStats.max,
    tempChange: computeChange(secondHalfTempAvg, firstHalfTempAvg),
    humChange: computeChange(secondHalfHumAvg, firstHalfHumAvg),
    rawReadings: readings.map((r) => ({
      created_at: r.created_at,
      temperature: r.temperature,
      humidity: r.humidity,
    })),
  };
}

export function useAnalytics(deviceId: string | null, timeRange: TimeRange) {
  const [data, setData] = useState<AnalyticsData>({
    labels: [], temp: [], hum: [],
    avgTemp: 0, avgHum: 0,
    minTemp: 0, maxTemp: 0, minHum: 0, maxHum: 0,
    tempChange: 0, humChange: 0,
    rawReadings: [],
  });
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    const supabase = createSupabaseClientClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoaded(true);
      return;
    }

    const { data: userDevices } = await supabase
      .from('devices')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name');

    setDevices(userDevices ?? []);

    if (!deviceId) {
      setLoaded(true);
      return;
    }

    const days = getRangeDays(timeRange);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: rows, error: err } = await supabase
      .from('device_history')
      .select('temperature, humidity, created_at')
      .eq('device_id', deviceId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (err) {
      console.error('[useAnalytics] Failed to fetch:', err.message);
      setError(err.message);
      setLoaded(true);
      return;
    }

    const readings: RawReading[] = rows ?? [];
    setData(buildAnalytics(readings, timeRange));
    setLoaded(true);
  }, [deviceId, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  useEffect(() => {
    const supabase = createSupabaseClientClient();

    const channel = supabase
      .channel('analytics_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'device_history' },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnalytics]);

  return { data, devices, loaded, error };
}
