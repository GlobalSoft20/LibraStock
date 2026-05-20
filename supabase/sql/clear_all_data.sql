-- WARNING: This will remove ALL application data. Use with caution.
-- Truncate tables in dependency order (cascade where needed)
TRUNCATE TABLE borrow_records CASCADE;
TRUNCATE TABLE stock_movements CASCADE;
TRUNCATE TABLE stock_items CASCADE;
TRUNCATE TABLE books CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE teachers CASCADE;
TRUNCATE TABLE school_classes CASCADE;
TRUNCATE TABLE levels CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE account_records CASCADE;
TRUNCATE TABLE academic_years CASCADE;
TRUNCATE TABLE terms CASCADE;

-- Reset sequences
ALTER SEQUENCE students_number_seq RESTART WITH 1;

-- Optionally delete any other custom sequences resets here

SELECT 'Truncation complete' as result;
