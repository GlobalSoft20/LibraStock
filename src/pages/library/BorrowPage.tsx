import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function BorrowPage() {
  const { students, teachers, books, setBooks, borrowRecords, setBorrowRecords, departments } = useData();
  const [tab, setTab] = useState("student");

  // Student borrow
  const [sDept, setSDept] = useState("");
  const [sLevel, setSLevel] = useState("");
  const [sClass, setSClass] = useState("");
  const [sSearch, setSSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [sBookSearch, setSBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [sQty, setSQty] = useState("1");

  // Teacher borrow
  const [tSearch, setTSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [tBookSearch, setTBookSearch] = useState("");
  const [tSelectedBook, setTSelectedBook] = useState("");
  const [tQty, setTQty] = useState("1");

  const filteredStudents = students.filter(s => {
    const matchDept = !sDept || s.department === sDept;
    const matchLevel = !sLevel || s.level === sLevel;
    const matchClass = !sClass || s.class === sClass;
    const matchSearch = !sSearch || s.fullName.toLowerCase().includes(sSearch.toLowerCase()) || s.id.toLowerCase().includes(sSearch.toLowerCase());
    return matchDept && matchLevel && matchClass && matchSearch;
  });

  const filteredTeachers = teachers.filter(t =>
    !tSearch || t.fullName.toLowerCase().includes(tSearch.toLowerCase())
  );

  const searchBooks = (q: string) => books.filter(b =>
    b.availableCopy > 0 && (b.name.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()))
  );

  const handleStudentBorrow = () => {
    const student = students.find(s => s.id === selectedStudent);
    const book = books.find(b => b.id === selectedBook);
    const qty = parseInt(sQty) || 1;
    if (!student || !book) { toast.error("Select student and book"); return; }
    if (book.availableCopy < qty) { toast.error("Not enough copies available"); return; }

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, availableCopy: b.availableCopy - qty } : b));
    setBorrowRecords(prev => [...prev, {
      id: `BR${String(prev.length + 1).padStart(3, "0")}`,
      bookId: book.id, bookName: book.name, borrowerType: "student",
      borrowerId: student.id, borrowerName: student.fullName,
      quantity: qty, borrowDate: new Date().toISOString().split("T")[0], status: "borrowed",
    }]);
    toast.success(`${book.name} borrowed by ${student.fullName}`);
    setSelectedStudent(""); setSelectedBook(""); setSQty("1"); setSBookSearch("");
  };

  const handleTeacherBorrow = () => {
    const teacher = teachers.find(t => t.id === selectedTeacher);
    const book = books.find(b => b.id === tSelectedBook);
    const qty = parseInt(tQty) || 1;
    if (!teacher || !book) { toast.error("Select teacher and book"); return; }
    if (book.availableCopy < qty) { toast.error("Not enough copies available"); return; }

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, availableCopy: b.availableCopy - qty } : b));
    setBorrowRecords(prev => [...prev, {
      id: `BR${String(prev.length + 1).padStart(3, "0")}`,
      bookId: book.id, bookName: book.name, borrowerType: "teacher",
      borrowerId: teacher.id, borrowerName: teacher.fullName,
      quantity: qty, borrowDate: new Date().toISOString().split("T")[0], status: "borrowed",
    }]);
    toast.success(`${book.name} borrowed by ${teacher.fullName}`);
    setSelectedTeacher(""); setTSelectedBook(""); setTQty("1"); setTBookSearch("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Borrow Book</h1>
        <p className="text-muted-foreground mt-1">Issue books to students and teachers</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="student" className="data-[state=active]:bg-card">Student</TabsTrigger>
          <TabsTrigger value="teacher" className="data-[state=active]:bg-card">Teacher</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
            <h2 className="font-heading font-semibold text-card-foreground">Find Student</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select value={sDept} onValueChange={setSDept}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={sLevel} onChange={e => setSLevel(e.target.value)} placeholder="Level" className="bg-secondary border-border" />
              <Input value={sClass} onChange={e => setSClass(e.target.value)} placeholder="Class" className="bg-secondary border-border" />
              <Input value={sSearch} onChange={e => setSSearch(e.target.value)} placeholder="Search name/ID" className="bg-secondary border-border" />
            </div>
            {filteredStudents.length > 0 && (
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{filteredStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.id})</SelectItem>)}</SelectContent>
              </Select>
            )}

            <h2 className="font-heading font-semibold text-card-foreground mt-4">Search Book</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input value={sBookSearch} onChange={e => setSBookSearch(e.target.value)} placeholder="Search by title or author" className="bg-secondary border-border" />
              </div>
              <Input type="number" value={sQty} onChange={e => setSQty(e.target.value)} placeholder="Quantity" min="1" className="bg-secondary border-border" />
            </div>
            {sBookSearch && (
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select book" /></SelectTrigger>
                <SelectContent>{searchBooks(sBookSearch).map(b => <SelectItem key={b.id} value={b.id}>{b.name} by {b.author} ({b.availableCopy} avail)</SelectItem>)}</SelectContent>
              </Select>
            )}

            <Button onClick={handleStudentBorrow} className="gradient-primary text-primary-foreground"><BookOpen className="w-4 h-4 mr-2" /> Borrow Book</Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="teacher">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
            <h2 className="font-heading font-semibold text-card-foreground">Find Teacher</h2>
            <Input value={tSearch} onChange={e => setTSearch(e.target.value)} placeholder="Search teacher name" className="bg-secondary border-border max-w-sm" />
            {filteredTeachers.length > 0 && (
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="bg-secondary border-border max-w-sm"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>{filteredTeachers.map(t => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}</SelectContent>
              </Select>
            )}

            <h2 className="font-heading font-semibold text-card-foreground mt-4">Search Book</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input value={tBookSearch} onChange={e => setTBookSearch(e.target.value)} placeholder="Search by title or author" className="bg-secondary border-border" />
              </div>
              <Input type="number" value={tQty} onChange={e => setTQty(e.target.value)} placeholder="Quantity" min="1" className="bg-secondary border-border" />
            </div>
            {tBookSearch && (
              <Select value={tSelectedBook} onValueChange={setTSelectedBook}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select book" /></SelectTrigger>
                <SelectContent>{searchBooks(tBookSearch).map(b => <SelectItem key={b.id} value={b.id}>{b.name} by {b.author} ({b.availableCopy} avail)</SelectItem>)}</SelectContent>
              </Select>
            )}

            <Button onClick={handleTeacherBorrow} className="gradient-primary text-primary-foreground"><BookOpen className="w-4 h-4 mr-2" /> Borrow Book</Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
