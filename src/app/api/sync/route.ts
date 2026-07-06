import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Login to ThingsBoard
    const loginRes = await fetch(`${process.env.TB_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.TB_USERNAME,
        password: process.env.TB_PASSWORD,
      }),
    });

    if (!loginRes.ok) {
      return NextResponse.json({ error: 'ThingsBoard login failed', status: loginRes.status });
    }

    const { token } = await loginRes.json();

    // 2. Get all devices from Supabase
    const supabase = createSupabaseServiceClient();
    const { data: deviceRows, error: devErr } = await supabase
      .from('devices')
      .select('id, thingsboard_device_id')
      .not('thingsboard_device_id', 'is', null);

    if (devErr || !deviceRows || deviceRows.length === 0) {
      return NextResponse.json({ error: devErr?.message || 'No devices', synced: 0 });
    }

    let synced = 0;
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    // 3. Fetch telemetry for each device and insert to Supabase
    for (const device of deviceRows) {
      try {
        const res = await fetch(
          `${process.env.TB_API_URL}/api/plugins/telemetry/DEVICE/${device.thingsboard_device_id}/values/timeseries?keys=temperature,humidity&limit=1`,
          {
            headers: { 'X-Authorization': `Bearer ${token}` },
          }
        );

        if (!res.ok) continue;

        const data = await res.json();
        const tempArr = data.temperature || [];
        const humArr = data.humidity || [];

        if (tempArr.length === 0 || humArr.length === 0) continue;

        const latestTemp = tempArr[tempArr.length - 1];
        const latestHum = humArr[humArr.length - 1];

        // Only insert if telemetry is recent (< 10 min)
        if ((now - latestTemp.ts) > TEN_MINUTES) continue;

        const { error: insertErr } = await supabase.from('device_history').insert({
          device_id: device.id,
          temperature: parseFloat(latestTemp.value),
          humidity: parseFloat(latestHum.value),
        });

        if (!insertErr) synced++;
      } catch {
        // Skip this device, continue with next
      }
    }

    return NextResponse.json({ success: true, synced, devices: deviceRows.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
