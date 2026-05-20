    -- Drop all public schema tables, sequences, and types used by the app.
    -- Run this in Supabase SQL editor or with psql.

    DROP TABLE IF EXISTS external_transactions CASCADE;
    DROP TABLE IF EXISTS student_fees CASCADE;
    DROP TABLE IF EXISTS terms CASCADE;
    DROP TABLE IF EXISTS academic_years CASCADE;
    DROP TABLE IF EXISTS account_records CASCADE;
    DROP TABLE IF EXISTS stock_movements CASCADE;
    DROP TABLE IF EXISTS stock_items CASCADE;
    DROP TABLE IF EXISTS borrow_records CASCADE;
    DROP TABLE IF EXISTS teachers CASCADE;
    DROP TABLE IF EXISTS students CASCADE;
    DROP TABLE IF EXISTS books CASCADE;
    DROP TABLE IF EXISTS school_classes CASCADE;
    DROP TABLE IF EXISTS levels CASCADE;
    DROP TABLE IF EXISTS departments CASCADE;

    DROP SEQUENCE IF EXISTS students_number_seq CASCADE;

    DROP TYPE IF EXISTS movement_type CASCADE;
    DROP TYPE IF EXISTS borrow_status CASCADE;
    DROP TYPE IF EXISTS user_role CASCADE;

    SELECT 'All tables, sequences, and types dropped' AS result;
