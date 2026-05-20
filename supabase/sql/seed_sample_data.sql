-- Sample seed data for Supabase (public schema)
-- Run with: psql "postgresql://<USER>:<PASS>@<HOST>:5432/<DB>" -f supabase/sql/seed_sample_data.sql

-- 1) Departments
INSERT INTO departments (id, name, description)
VALUES
  (gen_random_uuid(), 'Sciences', 'Science faculty'),
  (gen_random_uuid(), 'Arts', 'Arts faculty'),
  (gen_random_uuid(), 'Commerce', 'Commerce faculty'),
  (gen_random_uuid(), 'Technical', 'Technical faculty')
ON CONFLICT (name) DO NOTHING;

-- 2) Levels
INSERT INTO levels (id, name)
VALUES
  (gen_random_uuid(), 'Senior'),
  (gen_random_uuid(), 'Junior')
ON CONFLICT (name) DO NOTHING;

-- 3) Create a few school classes for combinations
INSERT INTO school_classes (id, name, department_id, level_id)
SELECT gen_random_uuid(), cls.name, d.id, l.id
FROM (
  VALUES ('S1','Sciences','Senior'),('S2','Sciences','Senior'),('S3','Sciences','Senior'),('J1','Sciences','Junior')
) AS cls(name, dept, lvl)
JOIN departments d ON d.name = cls.dept
JOIN levels l ON l.name = cls.lvl
ON CONFLICT (name, department_id, level_id) DO NOTHING;

-- 4) Teachers
INSERT INTO teachers (id, full_name, email, phone, subject)
VALUES
  (gen_random_uuid(), 'John Doe', 'johndoe@example.com', '+250788000001', 'Mathematics'),
  (gen_random_uuid(), 'Jane Smith', 'janesmith@example.com', '+250788000002', 'English')
ON CONFLICT DO NOTHING;

-- 5) Books
INSERT INTO books (id, name, author, category, total_copy, available_copy, cover_url)
VALUES
  (gen_random_uuid(), 'Mathematics for Beginners', 'A. Author', 'Mathematics', 5, 5, NULL),
  (gen_random_uuid(), 'English Grammar', 'B. Writer', 'English', 3, 3, NULL)
ON CONFLICT DO NOTHING;

-- 6) Create 50 students S001..S050
INSERT INTO students (id, student_number, full_name, department, level, class)
SELECT gen_random_uuid(), ('S' || LPAD(g::text,3,'0')), ('Student ' || g), 'Sciences', 'Senior', 'S1'
FROM generate_series(1,50) g
ON CONFLICT (student_number) DO NOTHING;

-- Ensure students_number_seq is advanced to avoid duplicate defaults
SELECT setval('students_number_seq', GREATEST((SELECT COALESCE(MAX(CAST(substring(student_number from 2) AS integer)),0) FROM students), 1));

-- 7) Academic year + 3 terms (make the inserted academic year current)
WITH ay AS (
  INSERT INTO academic_years (id, name, is_current)
  VALUES (gen_random_uuid(), '2026-2027', TRUE)
  ON CONFLICT (name) DO UPDATE SET is_current = EXCLUDED.is_current
  RETURNING id
)
INSERT INTO terms (id, academic_year_id, term_number, name, is_current)
SELECT gen_random_uuid(), ay.id, n, ('Term ' || n), (n = 1)
FROM ay, (VALUES (1),(2),(3)) AS t(n)
ON CONFLICT (academic_year_id, term_number) DO NOTHING;

-- 8) Sample student fees for first 6 students (Term 1)
INSERT INTO student_fees (id, student_id, academic_year_id, term_id, total_fee, amount_paid, payment_method, date)
SELECT gen_random_uuid(), s.id, ay.id, t.id, 56000, CASE WHEN (s.rn % 3) = 0 THEN 56000 WHEN (s.rn % 3) = 1 THEN 30000 ELSE 0 END, 
  CASE WHEN (s.rn % 3) = 0 THEN 'Mobile Money' WHEN (s.rn % 3) = 1 THEN 'Cash' ELSE '-' END,
  CURRENT_DATE - (s.rn % 10)
FROM (
  SELECT id, student_number, ROW_NUMBER() OVER (ORDER BY student_number) as rn FROM students
) s
CROSS JOIN LATERAL (SELECT id FROM academic_years WHERE name = '2026-2027' LIMIT 1) ay
CROSS JOIN LATERAL (SELECT id FROM terms WHERE term_number = 1 AND academic_year_id = ay.id LIMIT 1) t
WHERE s.rn <= 6
ON CONFLICT DO NOTHING;

-- 9) Sample external transactions
INSERT INTO external_transactions (id, receipt_no, name, total_amount, reason, date)
VALUES
  (gen_random_uuid(), 'EXT-2026-001', 'Kigali Stationery Ltd', 45000, 'Purchased chalk and exercise books', CURRENT_DATE - 5),
  (gen_random_uuid(), 'EXT-2026-002', 'RECO (Electricity)', 38000, 'Monthly electricity bill', CURRENT_DATE - 3)
ON CONFLICT (receipt_no) DO NOTHING;

-- 10) Sample stock items and movements
INSERT INTO stock_items (id, name, quantity, low_stock_qty, added_date)
VALUES
  (gen_random_uuid(), 'Chalk Box', 100, 10, CURRENT_DATE - 30),
  (gen_random_uuid(), 'Exercise Book', 500, 50, CURRENT_DATE - 30)
ON CONFLICT (name) DO NOTHING;

-- Movements referencing item by name
INSERT INTO stock_movements (id, item_id, item_name, type, quantity, supplier_name, price_per_unit, date, added_by)
SELECT gen_random_uuid(), si.id, si.name, 'in', CASE WHEN si.name = 'Chalk Box' THEN 100 ELSE 200 END, 'Kigali Stationery', 250.00, CURRENT_DATE - 29, 'admin'
FROM stock_items si
WHERE si.name IN ('Chalk Box','Exercise Book')
ON CONFLICT DO NOTHING;

-- 11) Sample borrow records (student borrows a book)
INSERT INTO borrow_records (id, book_id, book_name, borrower_type, borrower_id, borrower_name, quantity, borrow_date, status)
SELECT gen_random_uuid(), b.id, b.name, 'student', s.id, s.full_name, 1, CURRENT_DATE - 7, 'borrowed'
FROM books b, (SELECT id, full_name FROM students ORDER BY student_number LIMIT 2) s
ON CONFLICT DO NOTHING;

-- Done
SELECT 'Seed complete' AS result;
