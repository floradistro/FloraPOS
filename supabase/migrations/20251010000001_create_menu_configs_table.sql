-- ========================================
-- Menu Configurations Table (Migrated from WordPress)
-- Stores layout and theme configurations for TV menus
-- ========================================

CREATE TABLE IF NOT EXISTS menu_configs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location_id INTEGER,
  config_data JSONB NOT NULL,
  config_type TEXT CHECK (config_type IN ('layout', 'theme')),
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  parent_version_id BIGINT REFERENCES menu_configs(id) ON DELETE SET NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_configs_location ON menu_configs(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_configs_active ON menu_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_configs_template ON menu_configs(is_template);
CREATE INDEX IF NOT EXISTS idx_menu_configs_type ON menu_configs(config_type);
CREATE INDEX IF NOT EXISTS idx_menu_configs_display_order ON menu_configs(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_configs_created_at ON menu_configs(created_at);

-- ========================================
-- Menu Schedules Table
-- ========================================

CREATE TABLE IF NOT EXISTS menu_schedules (
  id BIGSERIAL PRIMARY KEY,
  config_id BIGINT NOT NULL REFERENCES menu_configs(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_schedules_config ON menu_schedules(config_id);
CREATE INDEX IF NOT EXISTS idx_menu_schedules_day ON menu_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_menu_schedules_time ON menu_schedules(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_menu_schedules_active ON menu_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_schedules_priority ON menu_schedules(priority);

-- ========================================
-- Menu Display Logs (Analytics)
-- ========================================

CREATE TABLE IF NOT EXISTS menu_display_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id BIGINT NOT NULL REFERENCES menu_configs(id) ON DELETE CASCADE,
  location_id INTEGER,
  display_duration INTEGER,
  user_agent TEXT,
  ip_address TEXT,
  displayed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_display_logs_config ON menu_display_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_menu_display_logs_location ON menu_display_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_display_logs_displayed_at ON menu_display_logs(displayed_at);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE menu_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_display_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all configs
CREATE POLICY "Allow read access to all configs"
  ON menu_configs FOR SELECT
  USING (true);

-- Allow authenticated users to create/update/delete configs
CREATE POLICY "Allow authenticated users to manage configs"
  ON menu_configs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Schedules policies
CREATE POLICY "Allow read access to all schedules"
  ON menu_schedules FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage schedules"
  ON menu_schedules FOR ALL
  USING (true)
  WITH CHECK (true);

-- Display logs policies
CREATE POLICY "Allow creating display logs"
  ON menu_display_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow reading display logs"
  ON menu_display_logs FOR SELECT
  USING (true);

-- ========================================
-- Functions and Triggers
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_menu_configs_updated_at
  BEFORE UPDATE ON menu_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_updated_at_column();

CREATE TRIGGER update_menu_schedules_updated_at
  BEFORE UPDATE ON menu_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_updated_at_column();

-- ========================================
-- Comments
-- ========================================

COMMENT ON TABLE menu_configs IS 'TV menu configurations (layouts and themes)';
COMMENT ON TABLE menu_schedules IS 'Scheduled menu activations by time/day';
COMMENT ON TABLE menu_display_logs IS 'Analytics for menu display tracking';

COMMENT ON COLUMN menu_configs.config_type IS 'Type of configuration: layout (structure) or theme (visuals)';
COMMENT ON COLUMN menu_configs.config_data IS 'JSON configuration data including orientation, colors, categories, etc.';
COMMENT ON COLUMN menu_configs.is_template IS 'Whether this is a reusable template available to all locations';


