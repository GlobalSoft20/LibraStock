-- Reset existing students.student_number to S001..SNNN based on creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as rn
  FROM students
)
UPDATE students s
SET student_number = ('S' || LPAD(numbered.rn::text, 3, '0'))
FROM numbered
WHERE s.id = numbered.id;

-- Optionally set the sequence to next value
SELECT setval('students_number_seq', (SELECT COALESCE(MAX(CAST(substring(student_number from 2) as integer)), 0) FROM students));
