import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey || apiKey !== process.env.IOT_API_KEY) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  let body: { device_id?: string; access_token?: string; temperature?: number; humidity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { device_id, access_token, temperature, humidity } = body;

  if (temperature == null || humidity == null) {
    return NextResponse.json({ error: 'Missing required fields: temperature, humidity' }, { status: 400 });
  }

  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    return NextResponse.json({ error: 'temperature and humidity must be numbers' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  let resolvedDeviceId = device_id;

  // Look up device by access_token if no device_id provided
  if (!resolvedDeviceId && access_token) {
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('thingsboard_access_token', access_token)
      .single();

    if (!device) {
      return NextResponse.json({ error: 'Device not found for this access_token' }, { status: 404 });
    }
    resolvedDeviceId = device.id;
  }

  if (!resolvedDeviceId) {
    return NextResponse.json({ error: 'Missing device_id or access_token' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('device_history')
    .insert({ device_id: resolvedDeviceId, temperature, humidity })
    .select('id')
    .single();

  if (error) {
    console.error('[API /api/device] Insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
