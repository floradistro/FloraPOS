-- ========================================
-- TV Devices Table
-- Tracks each TV display device in the system
-- ========================================

CREATE TABLE tv_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_number INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  device_name TEXT NOT NULL,
  current_config_id INTEGER,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tv_devices_location ON tv_devices(location_id);
CREATE INDEX idx_tv_devices_status ON tv_devices(status);
CREATE INDEX idx_tv_devices_last_seen ON tv_devices(last_seen);
CREATE INDEX idx_tv_devices_tv_number_location ON tv_devices(tv_number, location_id);

-- Unique constraint: one TV number per location
CREATE UNIQUE INDEX idx_tv_devices_unique_tv_per_location ON tv_devices(tv_number, location_id);

-- Enable realtime for this table
ALTER TABLE tv_devices REPLICA IDENTITY FULL;

-- ========================================
-- Row Level Security (RLS)
-- ========================================
ALTER TABLE tv_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (we can restrict later)
CREATE POLICY "Allow all operations on tv_devices"
  ON tv_devices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Updated timestamp trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tv_devices_updated_at
  BEFORE UPDATE ON tv_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE tv_devices IS 'Stores information about each TV display device';
COMMENT ON COLUMN tv_devices.tv_number IS 'TV number (1-6) at this location';
COMMENT ON COLUMN tv_devices.location_id IS 'References WordPress location ID';
COMMENT ON COLUMN tv_devices.current_config_id IS 'Currently displayed menu config ID';
COMMENT ON COLUMN tv_devices.status IS 'Current status: online, offline, or error';
COMMENT ON COLUMN tv_devices.last_seen IS 'Last heartbeat timestamp';
COMMENT ON COLUMN tv_devices.metadata IS 'Additional device metadata (resolution, browser, etc)';

