-- Add category column for external transactions so expenses can store categories and work with the UI
ALTER TABLE external_transactions
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Expenses';
