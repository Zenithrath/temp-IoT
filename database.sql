-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Devices table (linked to auth.users via user_id)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  thingsboard_device_id TEXT,
  thingsboard_access_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Device history table (linked to devices)
CREATE TABLE IF NOT EXISTS device_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  temperature NUMERIC NOT NULL,
  humidity NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Devices policies (user only sees/edits own devices)
CREATE POLICY "Users can view own devices" ON devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devices" ON devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devices" ON devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own devices" ON devices FOR DELETE USING (auth.uid() = user_id);

-- Device history policies (scoped to user's devices)
CREATE POLICY "Users can view own device history" ON device_history FOR SELECT
  USING (device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own device history" ON device_history FOR INSERT
  WITH CHECK (device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own device history" ON device_history FOR DELETE
  USING (device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_history_created_at ON device_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_history_device_id ON device_history(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- Settings table (ThingsBoard global config)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thingsboard_device_id TEXT,
  thingsboard_access_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migration: rename old columns if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'entitytype') THEN
    ALTER TABLE settings RENAME COLUMN entityType TO thingsboard_device_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'entityid') THEN
    ALTER TABLE settings RENAME COLUMN entityId TO thingsboard_access_token;
  END IF;
END $$;
