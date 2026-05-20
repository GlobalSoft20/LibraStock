-- Create academic_years and terms tables

CREATE TABLE academic_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  term_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(academic_year_id, term_number)
);

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users manage academic_years" ON academic_years
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users manage terms" ON terms
  FOR ALL TO authenticated USING (true);

CREATE INDEX idx_terms_academic_year_id ON terms(academic_year_id);
