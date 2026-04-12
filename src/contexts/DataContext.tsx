import { createContext, useContext, useState, ReactNode } from "react";

export interface Department {
  id: string;
  name: string;
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

export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([
    { id: "1", name: "Computer Science" },
    { id: "2", name: "Business" },
    { id: "3", name: "Engineering" },
  ]);
  const [levels, setLevels] = useState<Level[]>([
    { id: "1", name: "Level 1" },
    { id: "2", name: "Level 2" },
    { id: "3", name: "Level 3" },
    { id: "4", name: "Level 4" },
  ]);
  const [classes, setClasses] = useState<SchoolClass[]>([
    { id: "1", name: "CS-1A", departmentId: "1", levelId: "1" },
    { id: "2", name: "CS-2A", departmentId: "1", levelId: "2" },
    { id: "3", name: "BUS-1A", departmentId: "2", levelId: "1" },
  ]);
  const [books, setBooks] = useState<Book[]>([
    { id: "1", name: "Java Programming", author: "Herbert Schildt", category: "Science", totalCopy: 15, availableCopy: 12 },
    { id: "2", name: "Database Systems", author: "Thomas Connolly", category: "Science", totalCopy: 10, availableCopy: 7 },
    { id: "3", name: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Fiction", totalCopy: 8, availableCopy: 8 },
    { id: "4", name: "Physics Principles", author: "Raymond Serway", category: "Science", totalCopy: 12, availableCopy: 9 },
    { id: "5", name: "Organic Chemistry", author: "John McMurry", category: "Science", totalCopy: 6, availableCopy: 3 },
  ]);
  const [students, setStudents] = useState<Student[]>([
    { id: "STD0001", fullName: "John Kamau", department: "Computer Science", level: "Level 3", class: "CS-3A" },
    { id: "STD0002", fullName: "Mary Wanjiku", department: "Business", level: "Level 2", class: "BUS-2B" },
    { id: "STD0003", fullName: "Peter Ochieng", department: "Engineering", level: "Level 4", class: "ENG-4A" },
    { id: "STD0004", fullName: "Grace Muthoni", department: "Computer Science", level: "Level 1", class: "CS-1A" },
  ]);
  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: "TCH0001", fullName: "Dr. Alice Mwangi", email: "alice@school.com", phone: "+255700111111", subject: "Mathematics" },
    { id: "TCH0002", fullName: "Prof. James Otieno", email: "james@school.com", phone: "+255700222222", subject: "Physics" },
  ]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([
    { id: "BR001", bookId: "1", bookName: "Java Programming", borrowerType: "student", borrowerId: "STD0001", borrowerName: "John Kamau", quantity: 1, borrowDate: "2025-04-10", status: "borrowed" },
    { id: "BR002", bookId: "2", bookName: "Database Systems", borrowerType: "teacher", borrowerId: "TCH0001", borrowerName: "Dr. Alice Mwangi", quantity: 1, borrowDate: "2025-04-08", returnDate: "2025-04-11", status: "returned" },
    { id: "BR003", bookId: "3", bookName: "The Great Gatsby", borrowerType: "student", borrowerId: "STD0002", borrowerName: "Mary Wanjiku", quantity: 1, borrowDate: "2025-03-20", status: "overdue" },
  ]);
  const [stockItems, setStockItems] = useState<StockItem[]>([
    { id: "SI001", name: "A4 Paper Reams", quantity: 50, lowStockQty: 10, addedDate: "2025-04-01" },
    { id: "SI002", name: "Whiteboard Markers", quantity: 120, lowStockQty: 20, addedDate: "2025-04-01" },
    { id: "SI003", name: "Printer Ink", quantity: 8, lowStockQty: 5, addedDate: "2025-04-02" },
  ]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([
    { id: "SM001", itemId: "SI001", itemName: "A4 Paper Reams", type: "in", quantity: 50, supplierName: "Office Supplies Ltd", pricePerUnit: 5000, date: "2025-04-01", addedBy: "John Stock" },
    { id: "SM002", itemId: "SI002", itemName: "Whiteboard Markers", type: "in", quantity: 120, supplierName: "Stationery World", pricePerUnit: 1500, date: "2025-04-01", addedBy: "John Stock" },
    { id: "SM003", itemId: "SI001", itemName: "A4 Paper Reams", type: "out", quantity: 10, takenBy: "Library Dept", date: "2025-04-05" },
  ]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);

  return (
    <DataContext.Provider value={{
      departments, setDepartments, levels, setLevels, classes, setClasses,
      books, setBooks, students, setStudents, teachers, setTeachers,
      borrowRecords, setBorrowRecords, stockItems, setStockItems,
      stockMovements, setStockMovements, accounts, setAccounts,
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
