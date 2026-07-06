'use server'
import axios from "@/config/axiosTb";
import { AxiosResponse } from "axios";
import { redirect } from "next/navigation";
import createSupabaseServerClient from "@/lib/supabase/server";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

type ResponseData = {
  token: string;
  refreshToken: string;
};

type LoginResult = {
  token?: string;
  refreshToken?: string;
  error?: Error;
};


//THINGSBOARD
export async function loginTb(): Promise<LoginResult> {
  try {
    const username = process.env.TB_USERNAME;
    const password = process.env.TB_PASSWORD;

    if (!username || !password) {
      throw new Error(
        "The environment variables for the username and password are not defined."
      );
    }

    const responseLogin: AxiosResponse<ResponseData> = await axios.post(
      `/api/auth/login`,
      {
        username,
        password,
      }
    );

    const { token, refreshToken } = responseLogin.data;
    return { token, refreshToken };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function fetchThingsBoardTelemetry(deviceId: string) {
  try {
    const { token, error } = await loginTb();
    if (error || !token) {
      throw new Error('ThingsBoard login failed');
    }

    const res = await fetch(
      `${process.env.TB_API_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=temperature,humidity&limit=50`,
      {
        headers: {
          'X-Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error(`Failed to fetch telemetry: ${res.status}`);
    return await res.json();
  } catch (error) {
    return { error: (error as Error).message };
  }
}

//SETTING

export async function createSetting(data: {
  thingsboard_device_id: string;
  thingsboard_access_token: string;
}) {
  const supabase = await createSupabaseServerClient();

  const result = await supabase
    .from("settings")
    .insert({
      thingsboard_device_id: data.thingsboard_device_id,
      thingsboard_access_token: data.thingsboard_access_token,
    })
    .single();
  
    revalidatePath("/")
  return result;
}

export async function readSetting() {
  noStore();
  const supabase = await createSupabaseServerClient();
  return await supabase.from("settings").select("*").order("created_at", { ascending: false }).limit(1);
}

export async function getDevicesWithTbTelemetry() {
  noStore();
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Not authenticated' };

  const { data: deviceRows, error: devErr } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (devErr) return { data: [], error: devErr.message };

  const { token, error: loginErr } = await loginTb();
  if (loginErr || !token) return { data: deviceRows, error: null };

  const devices = await Promise.all(
    (deviceRows || []).map(async (device) => {
      if (!device.thingsboard_device_id) return { ...device, telemetry: [] };

      try {
        const res = await fetch(
          `${process.env.TB_API_URL}/api/plugins/telemetry/DEVICE/${device.thingsboard_device_id}/values/timeseries?keys=temperature,humidity&limit=50`,
          {
            headers: { 'X-Authorization': `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        if (!res.ok) return { ...device, telemetry: [] };
        const data = await res.json();
        return { ...device, telemetry: data };
      } catch {
        return { ...device, telemetry: [] };
      }
    })
  );

  // Save latest readings to Supabase device_history for backup
  // Only save if telemetry is fresh (<5 min old) to avoid marking offline devices as online
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  for (const device of devices) {
    if (device.telemetry && typeof device.telemetry === 'object' && !Array.isArray(device.telemetry)) {
      const tb = device.telemetry as { temperature?: { ts: number; value: string }[]; humidity?: { ts: number; value: string }[] };
      const tempArr = tb.temperature;
      const humArr = tb.humidity;
      if (tempArr && humArr && tempArr.length > 0 && humArr.length > 0) {
        const sortedTemp = [...tempArr].sort((a, b) => a.ts - b.ts);
        const sortedHum = [...humArr].sort((a, b) => a.ts - b.ts);
        const latestTemp = sortedTemp[sortedTemp.length - 1];
        const latestHum = sortedHum[sortedHum.length - 1];
        // Only save if telemetry timestamp is within last 5 minutes
        if (latestTemp && latestHum && (Date.now() - latestTemp.ts) < FIVE_MINUTES_MS) {
          await supabase.from('device_history').insert({
            device_id: device.id,
            temperature: parseFloat(latestTemp.value),
            humidity: parseFloat(latestHum.value),
          });
        }
      }
    }
  }

  return { data: devices, error: null };
}

//AUTH

export async function signUpWithEmailAndPassword(data: {
  email: string;
  password: string;
  confirm: string;
}) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  return result;
}

export async function signInWithEmailAndPassword(data: {
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  return result;
}

export async function signOut(){
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/auth')
}

export default async function readUserSession() {
  const supabase = await createSupabaseServerClient();
  return supabase.auth.getSession();
}
