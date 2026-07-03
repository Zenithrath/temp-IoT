import { useState, useEffect, useCallback } from 'react';
import createSupabaseClientClient from '@/lib/supabase/client';

type Period = 'weekly' | 'biweekly' | 'monthly';

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
}

interface RawReading {
  temperature: number;
  humidity: number;
  created_at: string;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = r.getDay();
  r.setDate(r.getDate() - day);
  return r;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatWeekLabel(d: Date): string {
  return `W${Math.ceil((d.getDate()) / 7)}`;
}

function aggregateByDay(readings: RawReading[]): AnalyticsData {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dayMap = new Map<string, { temps: number[]; hums: number[] }>();

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    dayMap.set(formatDate(d), { temps: [], hums: [] });
  }

  for (const r of readings) {
    const rd = new Date(r.created_at);
    if (rd < sevenDaysAgo) continue;
    const key = formatDate(rd);
    const entry = dayMap.get(key);
    if (entry) {
      entry.temps.push(r.temperature);
      entry.hums.push(r.humidity);
    }
  }

  const labels: string[] = [];
  const temp: number[] = [];
  const hum: number[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = formatDate(d);
    labels.push(key);
    const entry = dayMap.get(key)!;
    temp.push(entry.temps.length ? parseFloat((entry.temps.reduce((a, b) => a + b, 0) / entry.temps.length).toFixed(1)) : 0);
    hum.push(entry.hums.length ? Math.round(entry.hums.reduce((a, b) => a + b, 0) / entry.hums.length) : 0);
  }

  return buildAnalytics(labels, temp, hum);
}

function aggregateByWeek(readings: RawReading[], weekCount: number): AnalyticsData {
  const now = new Date();
  const weeks: { start: Date; temps: number[]; hums: number[] }[] = [];

  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStart = startOfWeek(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeks.push({ start: weekStart, temps: [], hums: [] });
  }

  for (const r of readings) {
    const rd = new Date(r.created_at);
    const rWeekStart = startOfWeek(rd);

    for (const w of weeks) {
      if (rWeekStart.getTime() === w.start.getTime()) {
        w.temps.push(r.temperature);
        w.hums.push(r.humidity);
        break;
      }
    }
  }

  const labels: string[] = [];
  const temp: number[] = [];
  const hum: number[] = [];

  for (const w of weeks) {
    labels.push(formatWeekLabel(w.start));
    temp.push(w.temps.length ? parseFloat((w.temps.reduce((a, b) => a + b, 0) / w.temps.length).toFixed(1)) : 0);
    hum.push(w.hums.length ? Math.round(w.hums.reduce((a, b) => a + b, 0) / w.hums.length) : 0);
  }

  return buildAnalytics(labels, temp, hum);
}

function buildAnalytics(labels: string[], temp: number[], hum: number[]): AnalyticsData {
  const validTemps = temp.filter((t) => t > 0);
  const validHums = hum.filter((h) => h > 0);

  const avgTemp = validTemps.length ? parseFloat((validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1)) : 0;
  const avgHum = validHums.length ? Math.round(validHums.reduce((a, b) => a + b, 0) / validHums.length) : 0;
  const minTemp = validTemps.length ? Math.min(...validTemps) : 0;
  const maxTemp = validTemps.length ? Math.max(...validTemps) : 0;
  const minHum = validHums.length ? Math.min(...validHums) : 0;
  const maxHum = validHums.length ? Math.max(...validHums) : 0;

  const half = Math.floor(temp.length / 2);
  const firstHalfTemp = temp.slice(0, half);
  const secondHalfTemp = temp.slice(half);
  const firstHalfHum = hum.slice(0, half);
  const secondHalfHum = hum.slice(half);

  const avgFirstTemp = firstHalfTemp.length ? firstHalfTemp.reduce((a, b) => a + b, 0) / firstHalfTemp.length : 0;
  const avgSecondTemp = secondHalfTemp.length ? secondHalfTemp.reduce((a, b) => a + b, 0) / secondHalfTemp.length : 0;
  const avgFirstHum = firstHalfHum.length ? firstHalfHum.reduce((a, b) => a + b, 0) / firstHalfHum.length : 0;
  const avgSecondHum = secondHalfHum.length ? secondHalfHum.reduce((a, b) => a + b, 0) / secondHalfHum.length : 0;

  const tempChange = avgFirstTemp ? parseFloat((((avgSecondTemp - avgFirstTemp) / avgFirstTemp) * 100).toFixed(1)) : 0;
  const humChange = avgFirstHum ? parseFloat((((avgSecondHum - avgFirstHum) / avgFirstHum) * 100).toFixed(1)) : 0;

  return { labels, temp, hum, avgTemp, avgHum, minTemp, maxTemp, minHum, maxHum, tempChange, humChange };
}

export function useAnalytics() {
  const [data, setData] = useState<Record<Period, AnalyticsData>>({
    weekly: { labels: [], temp: [], hum: [], avgTemp: 0, avgHum: 0, minTemp: 0, maxTemp: 0, minHum: 0, maxHum: 0, tempChange: 0, humChange: 0 },
    biweekly: { labels: [], temp: [], hum: [], avgTemp: 0, avgHum: 0, minTemp: 0, maxTemp: 0, minHum: 0, maxHum: 0, tempChange: 0, humChange: 0 },
    monthly: { labels: [], temp: [], hum: [], avgTemp: 0, avgHum: 0, minTemp: 0, maxTemp: 0, minHum: 0, maxHum: 0, tempChange: 0, humChange: 0 },
  });
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
      .select('id')
      .eq('user_id', user.id);

    const deviceIds = userDevices?.map((d) => d.id) ?? [];
    if (deviceIds.length === 0) {
      setLoaded(true);
      return;
    }

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const { data: rows, error: err } = await supabase
      .from('device_history')
      .select('temperature, humidity, created_at')
      .in('device_id', deviceIds)
      .gte('created_at', twoMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    if (err) {
      console.error('[useAnalytics] Failed to fetch:', err.message);
      setError(err.message);
      setLoaded(true);
      return;
    }

    const readings: RawReading[] = rows ?? [];

    setData({
      weekly: aggregateByDay(readings),
      biweekly: aggregateByWeek(readings, 14),
      monthly: aggregateByWeek(readings, 4),
    });
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchAnalytics();
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

  return { data, loaded, error };
}
