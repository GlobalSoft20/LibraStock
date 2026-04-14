import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface Level {
  id: string;
  name: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  departmentId: string;
  levelId: string;
}

export interface Book {
  id: string;
  name: string;
  author: string;
  category: string;
  totalCopy: number;
  availableCopy: number;
  coverUrl?: string;
}

export interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
  department: string;
  level: string;
  class: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookName: string;
  borrowerType: "student" | "teacher";
  borrowerId: string;
  borrowerName: string;
  quantity: number;
  borrowDate: string;
  returnDate?: string;
  status: "borrowed" | "returned" | "overdue";
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  lowStockQty: number;
  addedDate: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: "in" | "out";
  quantity: number;
  supplierName?: string;
  takenBy?: string;
  pricePerUnit?: number;
  date: string;
  addedBy?: string;
}

export interface AccountRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "librarian" | "stock_manager";
  createdAt: string;
}

interface DataContextType {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  levels: Level[];
  setLevels: React.Dispatch<React.SetStateAction<Level[]>>;
  classes: SchoolClass[];
  setClasses: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  borrowRecords: BorrowRecord[];
  setBorrowRecords: React.Dispatch<React.SetStateAction<BorrowRecord[]>>;
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  accounts: AccountRecord[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountRecord[]>>;
}

const DataContext = createContext<DataContextType | null>(null);

function mapDepartment(row: any): Department {
  return { id: row.id, name: row.name, description: row.description ?? "" };
}

function mapLevel(row: any): Level {
  return { id: row.id, name: row.name };
}

function mapClass(row: any): SchoolClass {
  return { id: row.id, name: row.name, departmentId: row.department_id, levelId: row.level_id };
}

function mapBook(row: any): Book {
  return {
    id: row.id,
    name: row.name,
    author: row.author,
    category: row.category,
    totalCopy: row.total_copy,
    availableCopy: row.available_copy,
    coverUrl: row.cover_url ?? undefined,
  };
}

function mapStudent(row: any): Student {
  return {
    id: row.id,
    studentNumber: row.student_number ?? row.studentNumber ?? row.id,
    fullName: row.full_name,
    department: row.department,
    level: row.level,
    class: row.class,
  };
}

function mapTeacher(row: any): Teacher {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    subject: row.subject ?? "",
  };
}

function mapBorrowRecord(row: any): BorrowRecord {
  return {
    id: row.id,
    bookId: row.book_id,
    bookName: row.book_name,
    borrowerType: row.borrower_type,
    borrowerId: row.borrower_id,
    borrowerName: row.borrower_name,
    quantity: row.quantity,
    borrowDate: row.borrow_date,
    returnDate: row.return_date ?? undefined,
    status: row.status,
  };
}

function mapStockItem(row: any): StockItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    lowStockQty: row.low_stock_qty,
    addedDate: row.added_date,
  };
}

function mapStockMovement(row: any): StockMovement {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    type: row.type,
    quantity: row.quantity,
    supplierName: row.supplier_name ?? undefined,
    takenBy: row.taken_by ?? undefined,
    pricePerUnit: row.price_per_unit ?? undefined,
    date: row.date,
    addedBy: row.added_by ?? undefined,
  };
}

function mapAccount(row: any): AccountRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? "",
    role: row.role,
    createdAt: row.created_at,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [departmentsRes, levelsRes, classesRes, booksRes, studentsRes, teachersRes, borrowRes, stockItemsRes, stockMovementsRes, accountsRes] = await Promise.all([
        supabase.from("departments").select("*").order("name", { ascending: true }),
        supabase.from("levels").select("*").order("name", { ascending: true }),
        supabase.from("school_classes").select("*").order("name", { ascending: true }),
        supabase.from("books").select("*").order("name", { ascending: true }),
        supabase.from("students").select("*").order("full_name", { ascending: true }),
        supabase.from("teachers").select("*").order("full_name", { ascending: true }),
        supabase.from("borrow_records").select("*").order("borrow_date", { ascending: false }),
        supabase.from("stock_items").select("*").order("added_date", { ascending: false }),
        supabase.from("stock_movements").select("*").order("date", { ascending: false }),
        supabase.from("account_records").select("*").order("created_at", { ascending: false }),
      ]);

      if (!departmentsRes.error) setDepartments(departmentsRes.data.map(mapDepartment));
      if (!levelsRes.error) setLevels(levelsRes.data.map(mapLevel));
      if (!classesRes.error) setClasses(classesRes.data.map(mapClass));
      if (!booksRes.error) setBooks(booksRes.data.map(mapBook));
      if (!studentsRes.error) setStudents(studentsRes.data.map(mapStudent));
      if (!teachersRes.error) setTeachers(teachersRes.data.map(mapTeacher));
      if (!borrowRes.error) setBorrowRecords(borrowRes.data.map(mapBorrowRecord));
      if (!stockItemsRes.error) setStockItems(stockItemsRes.data.map(mapStockItem));
      if (!stockMovementsRes.error) setStockMovements(stockMovementsRes.data.map(mapStockMovement));
      if (!accountsRes.error) setAccounts(accountsRes.data.map(mapAccount));

      if (departmentsRes.error || levelsRes.error || classesRes.error || booksRes.error || studentsRes.error || teachersRes.error || borrowRes.error || stockItemsRes.error || stockMovementsRes.error || accountsRes.error) {
        console.error({ departmentsRes, levelsRes, classesRes, booksRes, studentsRes, teachersRes, borrowRes, stockItemsRes, stockMovementsRes, accountsRes });
      }
    };

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{
      departments,
      setDepartments,
      levels,
      setLevels,
      classes,
      setClasses,
      books,
      setBooks,
      students,
      setStudents,
      teachers,
      setTeachers,
      borrowRecords,
      setBorrowRecords,
      stockItems,
      setStockItems,
      stockMovements,
      setStockMovements,
      accounts,
      setAccounts,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
