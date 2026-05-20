-- Create student_fees table
CREATE TABLE student_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  date DATE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users manage student_fees" ON student_fees FOR ALL TO authenticated USING (true);
CREATE INDEX idx_student_fees_student_id ON student_fees(student_id);
