-- Move fee_structures from class-based to level-based
-- Keeps the table usable for the new UI (Department + Level + Boarding Type + Amount)

ALTER TABLE IF EXISTS fee_structures
  ADD COLUMN IF NOT EXISTS level TEXT;

ALTER TABLE IF EXISTS fee_structures
  DROP COLUMN IF EXISTS class;

