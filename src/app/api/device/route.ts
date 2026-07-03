import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey || apiKey !== process.env.IOT_API_KEY) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  let body: { device_id?: string; temperature?: number; humidity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { device_id, temperature, humidity } = body;

  if (!device_id || temperature == null || humidity == null) {
    return NextResponse.json({ error: 'Missing required fields: device_id, temperature, humidity' }, { status: 400 });
  }

  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    return NextResponse.json({ error: 'temperature and humidity must be numbers' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('device_history')
    .insert({ device_id, temperature, humidity })
    .select('id')
    .single();

  if (error) {
    console.error('[API /api/device] Insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
