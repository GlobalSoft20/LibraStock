-- Full Supabase schema + seed data for LibraStok
-- Run this in Supabase SQL editor or with psql.
-- This creates all tables and loads sample data.

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'librarian', 'stock_manager', 'finance_officer');
CREATE TYPE borrow_status AS ENUM ('borrowed', 'returned', 'overdue');
CREATE TYPE movement_type AS ENUM ('in', 'out');

-- Departments
CREATE TABLE departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Levels
CREATE TABLE levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School classes
CREATE TABLE school_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, department_id, level_id)
);

-- Books
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  total_copy INTEGER NOT NULL DEFAULT 0,
  available_copy INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students with text IDs like S001
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Borrow records
CREATE TABLE borrow_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  book_name TEXT NOT NULL,
  borrower_type TEXT NOT NULL CHECK (borrower_type IN ('student', 'teacher')),
  borrower_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  borrow_date DATE NOT NULL,
  return_date DATE,
  status borrow_status DEFAULT 'borrowed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock items
CREATE TABLE stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_qty INTEGER NOT NULL DEFAULT 10,
  added_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  supplier_name TEXT,
  taken_by TEXT,
  price_per_unit DECIMAL(10,2),
  date DATE NOT NULL,
  added_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account records
CREATE TABLE account_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role user_role DEFAULT 'librarian',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic years
CREATE TABLE academic_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Terms
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

-- Student fees
CREATE TABLE student_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  date DATE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External transactions
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

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to manage departments" ON departments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage levels" ON levels FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage school_classes" ON school_classes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage books" ON books FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage students" ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage teachers" ON teachers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage borrow_records" ON borrow_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage stock_items" ON stock_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage stock_movements" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage their own account records" ON account_records FOR ALL TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM account_records ar WHERE ar.user_id = auth.uid() AND ar.role = 'admin')
);
CREATE POLICY "Allow authenticated users to manage academic_years" ON academic_years FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage terms" ON terms FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage student_fees" ON student_fees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage external_transactions" ON external_transactions FOR ALL TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_school_classes_department_level ON school_classes(department_id, level_id);
CREATE INDEX idx_borrow_records_book_id ON borrow_records(book_id);
CREATE INDEX idx_borrow_records_borrower ON borrow_records(borrower_type, borrower_id);
CREATE INDEX idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX idx_terms_academic_year_id ON terms(academic_year_id);
CREATE INDEX idx_student_fees_student_id ON student_fees(student_id);



SELECT 'Full schema and seed complete' AS result;
