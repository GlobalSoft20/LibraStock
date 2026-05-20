-- Create external_transactions table
CREATE TABLE external_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  reason TEXT,
  category TEXT NOT NULL DEFAULT 'Expenses',
  date DATE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE external_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users manage external_transactions" ON external_transactions FOR ALL TO authenticated USING (true);
CREATE INDEX idx_external_transactions_receipt_no ON external_transactions(receipt_no);
