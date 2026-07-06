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
