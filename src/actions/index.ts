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

  // Save ALL telemetry readings to Supabase device_history
  // Skip duplicates by checking existing timestamps for this device
  for (const device of devices) {
    if (device.telemetry && typeof device.telemetry === 'object' && !Array.isArray(device.telemetry)) {
      const tb = device.telemetry as { temperature?: { ts: number; value: string }[]; humidity?: { ts: number; value: string }[] };
      const tempArr = tb.temperature || [];
      const humArr = tb.humidity || [];
      if (tempArr.length === 0 || humArr.length === 0) continue;

      const sortedTemp = [...tempArr].sort((a, b) => a.ts - b.ts);
      const sortedHum = [...humArr].sort((a, b) => a.ts - b.ts);

      // Merge temp + hum by timestamp (closest match within 10s)
      const tempMap = new Map(sortedTemp.map((t) => [t.ts, parseFloat(t.value)]));
      const allTempTs = sortedTemp.map((t) => t.ts);
      const allHumTs = sortedHum.map((h) => h.ts);
      const allTimestamps = Array.from(new Set(allTempTs.concat(allHumTs))).sort((a, b) => a - b);

      // Fetch existing timestamps for this device (last hour) to skip duplicates
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { data: existingRows } = await supabase
        .from('device_history')
        .select('created_at')
        .eq('device_id', device.id)
        .gte('created_at', oneHourAgo);

      const existingTimestamps = new Set(
        (existingRows || []).map((r) => new Date(r.created_at).getTime())
      );

      const newRows: { device_id: string; temperature: number; humidity: number; created_at: string }[] = [];
      for (const ts of allTimestamps) {
        if (existingTimestamps.has(ts)) continue;

        const temp = tempMap.get(ts);
        const humEntry = sortedHum.find((h) => Math.abs(h.ts - ts) < 10000);
        if (temp !== undefined && humEntry) {
          newRows.push({
            device_id: device.id,
            temperature: temp,
            humidity: parseFloat(humEntry.value),
            created_at: new Date(ts).toISOString(),
          });
        }
      }

      if (newRows.length > 0) {
        await supabase.from('device_history').insert(newRows);
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
