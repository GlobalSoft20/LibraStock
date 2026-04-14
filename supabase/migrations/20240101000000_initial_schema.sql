-- Enable Row Level Security

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'librarian', 'stock_manager');
CREATE TYPE borrow_status AS ENUM ('borrowed', 'returned', 'overdue');
CREATE TYPE movement_type AS ENUM ('in', 'out');

-- Departments table
CREATE TABLE departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Levels table
CREATE TABLE levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School classes table
CREATE TABLE school_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, department_id, level_id)
);

-- Books table
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

-- Students sequence for auto-incrementing student numbers
CREATE SEQUENCE students_number_seq START WITH 1 INCREMENT BY 1;

-- Students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_number TEXT NOT NULL UNIQUE DEFAULT ('S' || LPAD(nextval('students_number_seq')::text, 3, '0')),
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Borrow records table
CREATE TABLE borrow_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  book_name TEXT NOT NULL,
  borrower_type TEXT NOT NULL CHECK (borrower_type IN ('student', 'teacher')),
  borrower_id UUID NOT NULL,
  borrower_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  borrow_date DATE NOT NULL,
  return_date DATE,
  status borrow_status DEFAULT 'borrowed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock items table
CREATE TABLE stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_qty INTEGER NOT NULL DEFAULT 10,
  added_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements table
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

-- Account records table (for additional user info beyond auth.users)
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

-- Enable Row Level Security on all tables
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

-- Create policies (basic policies - adjust as needed)
-- For simplicity, allowing authenticated users to do everything
-- In production, you'd want more granular policies

CREATE POLICY "Allow authenticated users to read departments" ON departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage departments" ON departments
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read levels" ON levels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage levels" ON levels
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read school_classes" ON school_classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage school_classes" ON school_classes
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read books" ON books
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage books" ON books
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read students" ON students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage students" ON students
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read teachers" ON teachers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage teachers" ON teachers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read borrow_records" ON borrow_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage borrow_records" ON borrow_records
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read stock_items" ON stock_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage stock_items" ON stock_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read stock_movements" ON stock_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage stock_movements" ON stock_movements
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read their own account records" ON account_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own account records" ON account_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all account records" ON account_records
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM account_records ar
      WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_school_classes_department_level ON school_classes(department_id, level_id);
CREATE INDEX idx_borrow_records_book_id ON borrow_records(book_id);
CREATE INDEX idx_borrow_records_borrower ON borrow_records(borrower_type, borrower_id);
CREATE INDEX idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX idx_account_records_user_id ON account_records(user_id);