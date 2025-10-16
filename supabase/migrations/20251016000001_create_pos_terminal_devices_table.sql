-- ========================================
-- POS Terminal Devices Table (Supabase)
-- Real-time status tracking for Dejavoo WizarPOS QZ terminals
-- Mirrors pattern used for tv_devices
-- ========================================

CREATE TABLE pos_terminal_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Terminal Reference
  terminal_id BIGINT NOT NULL COMMENT 'References WordPress wp_flora_pos_terminals.id',
  terminal_serial TEXT NOT NULL,
  workstation_name TEXT NOT NULL,
  location_id INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'processing', 'error', 'maintenance')),
  connection_status TEXT DEFAULT 'unknown' CHECK (connection_status IN ('connected', 'disconnected', 'unknown')),
  
  -- Current Activity
  current_transaction_id TEXT COMMENT 'Active transaction reference',
  current_order_id TEXT COMMENT 'Current POS order being processed',
  is_busy BOOLEAN DEFAULT false,
  
  -- Connection Info
  ip_address TEXT,
  user_agent TEXT,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  
  -- Device Metadata
  metadata JSONB DEFAULT '{}'::jsonb COMMENT 'Device info, firmware version, etc',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pos_terminal_devices_location ON pos_terminal_devices(location_id);
CREATE INDEX idx_pos_terminal_devices_status ON pos_terminal_devices(status);
CREATE INDEX idx_pos_terminal_devices_terminal_id ON pos_terminal_devices(terminal_id);
CREATE INDEX idx_pos_terminal_devices_last_heartbeat ON pos_terminal_devices(last_heartbeat);
CREATE INDEX idx_pos_terminal_devices_workstation ON pos_terminal_devices(workstation_name);

-- Unique constraint: one terminal per workstation per location
CREATE UNIQUE INDEX idx_pos_terminal_devices_unique ON pos_terminal_devices(terminal_id, location_id);

-- Enable realtime for this table
ALTER TABLE pos_terminal_devices REPLICA IDENTITY FULL;

-- ========================================
-- Row Level Security (RLS)
-- ========================================
ALTER TABLE pos_terminal_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (can restrict later by location/user)
CREATE POLICY "Allow all operations on pos_terminal_devices"
  ON pos_terminal_devices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Updated timestamp trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_pos_terminal_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pos_terminal_devices_updated_at
  BEFORE UPDATE ON pos_terminal_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_pos_terminal_devices_updated_at();

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE pos_terminal_devices IS 'Real-time status tracking for POS payment terminals';
COMMENT ON COLUMN pos_terminal_devices.terminal_id IS 'References WordPress terminal ID';
COMMENT ON COLUMN pos_terminal_devices.status IS 'Current terminal status: online, offline, processing, error, maintenance';
COMMENT ON COLUMN pos_terminal_devices.is_busy IS 'True when terminal is processing a transaction';
COMMENT ON COLUMN pos_terminal_devices.last_heartbeat IS 'Last successful heartbeat/status check';
COMMENT ON COLUMN pos_terminal_devices.metadata IS 'Additional device metadata (firmware, model, features)';

-- Success message
SELECT '✅ POS Terminal Devices table created successfully!' as status;

