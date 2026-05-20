-- Convert students.id from UUID to text IDs like S001, S002, ... and drop student_number
-- Run this in Supabase with psql or the SQL editor.

BEGIN;

-- 1) Add a temporary text column for the new student IDs
ALTER TABLE students ADD COLUMN IF NOT EXISTS new_id TEXT;

-- 2) Populate new_id in student order (created_at, id)
WITH numbered AS (
  SELECT id AS old_id,
         'S' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at, id)::text, 3, '0') AS new_id
  FROM students
)
UPDATE students s
SET new_id = numbered.new_id
FROM numbered
WHERE s.id = numbered.old_id;

-- 3) Update dependent tables that reference students.id
ALTER TABLE borrow_records DROP CONSTRAINT IF EXISTS borrow_records_borrower_id_fkey;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_fees') THEN
    ALTER TABLE student_fees DROP CONSTRAINT IF EXISTS student_fees_student_id_fkey;
  END IF;
END$$;

UPDATE borrow_records br
SET borrower_id = s.new_id
FROM students s
WHERE br.borrower_type = 'student' AND br.borrower_id = s.id;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_fees') THEN
    UPDATE student_fees sf
    SET student_id = s.new_id
    FROM students s
    WHERE sf.student_id = s.id;
  END IF;
END$$;

-- 4) Replace the students primary key with the new text ID
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_pkey;
ALTER TABLE students DROP COLUMN IF EXISTS id;
ALTER TABLE students RENAME COLUMN new_id TO id;
ALTER TABLE students ALTER COLUMN id SET NOT NULL;
ALTER TABLE students ADD PRIMARY KEY (id);

-- 5) Drop the old student_number column if present
ALTER TABLE students DROP COLUMN IF EXISTS student_number;

-- 6) Recreate foreign keys for dependent tables
ALTER TABLE borrow_records
  ADD CONSTRAINT borrow_records_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES students(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_fees') THEN
    ALTER TABLE student_fees
      ADD CONSTRAINT student_fees_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;
END$$;

COMMIT;

-- Verify results
SELECT id, full_name FROM students ORDER BY id LIMIT 20;
