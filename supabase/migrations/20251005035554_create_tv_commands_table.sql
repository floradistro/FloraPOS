-- ========================================
-- TV Commands Table
-- Command queue for iPad → TV communication
-- ========================================

CREATE TABLE tv_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_id UUID NOT NULL REFERENCES tv_devices(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL CHECK (command_type IN (
    'change_config',
    'refresh',
    'screenshot',
    'update_theme',
    'ping',
    'reboot',
    'clear_cache'
  )),
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tv_commands_tv_id ON tv_commands(tv_id);
CREATE INDEX idx_tv_commands_status ON tv_commands(status);
CREATE INDEX idx_tv_commands_created_at ON tv_commands(created_at);
CREATE INDEX idx_tv_commands_pending ON tv_commands(status, tv_id) WHERE status = 'pending';

-- Enable realtime for this table
ALTER TABLE tv_commands REPLICA IDENTITY FULL;

-- ========================================
-- Row Level Security (RLS)
-- ========================================
ALTER TABLE tv_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now
CREATE POLICY "Allow all operations on tv_commands"
  ON tv_commands
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Updated timestamp trigger
-- ========================================
CREATE TRIGGER update_tv_commands_updated_at
  BEFORE UPDATE ON tv_commands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Auto-cleanup old completed commands (keep last 24 hours)
-- ========================================
CREATE OR REPLACE FUNCTION cleanup_old_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM tv_commands
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Command Log Table (Analytics)
-- ========================================
CREATE TABLE tv_command_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_id UUID NOT NULL REFERENCES tv_devices(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  latency_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_tv_command_log_tv_id ON tv_command_log(tv_id);
CREATE INDEX idx_tv_command_log_executed_at ON tv_command_log(executed_at);
CREATE INDEX idx_tv_command_log_command_type ON tv_command_log(command_type);
CREATE INDEX idx_tv_command_log_success ON tv_command_log(success);

-- Enable realtime
ALTER TABLE tv_command_log REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE tv_command_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on tv_command_log"
  ON tv_command_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE tv_commands IS 'Command queue for iPad to TV communication';
COMMENT ON COLUMN tv_commands.command_type IS 'Type of command to execute';
COMMENT ON COLUMN tv_commands.payload IS 'Command-specific data (e.g., config_id for change_config)';
COMMENT ON COLUMN tv_commands.status IS 'Command execution status';

COMMENT ON TABLE tv_command_log IS 'Analytics log of all executed commands';
COMMENT ON COLUMN tv_command_log.latency_ms IS 'Time taken to execute command in milliseconds';

