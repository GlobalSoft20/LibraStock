-- Create fee_structures table (level-based, no class)

CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  boarding_type TEXT NOT NULL DEFAULT 'Day Scholar',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (academic_year, term, department, level, boarding_type)
);

ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users manage fee_structures" ON fee_structures
  FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_fee_structures_lookup
  ON fee_structures (academic_year, term, department, level, boarding_type);

