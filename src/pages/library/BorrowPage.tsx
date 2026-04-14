import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function BorrowPage() {
  const { students, teachers, books, setBooks, borrowRecords, setBorrowRecords, departments, levels, classes } = useData();
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

  const filteredClasses = classes.filter(c => {
    const deptObj = departments.find(d => d.name === sDept);
    const lvlObj = levels.find(l => l.name === sLevel);
    return (!sDept || c.departmentId === deptObj?.id) && (!sLevel || c.levelId === lvlObj?.id);
  });

  const filteredTeachers = teachers.filter(t =>
    !tSearch || t.fullName.toLowerCase().includes(tSearch.toLowerCase())
  );

  const searchBooks = (q: string) => books.filter(b =>
    b.availableCopy > 0 && (b.name.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()))
  );

  const handleStudentBorrow = async () => {
    const student = students.find(s => s.id === selectedStudent);
    const book = books.find(b => b.id === selectedBook);
    const qty = parseInt(sQty) || 1;
    if (!student || !book) { toast.error("Select student and book"); return; }
    if (book.availableCopy < qty) { toast.error("Not enough copies available"); return; }

    const borrowDate = new Date().toISOString().split("T")[0];
    const { data: borrowData, error: borrowError } = await supabase.from("borrow_records").insert({
      book_id: book.id,
      book_name: book.name,
      borrower_type: "student",
      borrower_id: student.id,
      borrower_name: student.fullName,
      quantity: qty,
      borrow_date: borrowDate,
      status: "borrowed",
    }).select().single();

    if (borrowError || !borrowData) {
      toast.error(borrowError?.message || "Failed to record borrow transaction.");
      return;
    }

    const { error: bookError } = await supabase.from("books").update({ available_copy: book.availableCopy - qty }).eq("id", book.id);
    if (bookError) {
      toast.error(bookError.message);
      return;
    }

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, availableCopy: b.availableCopy - qty } : b));
    setBorrowRecords(prev => [...prev, {
      id: borrowData.id,
      bookId: borrowData.book_id,
      bookName: borrowData.book_name,
      borrowerType: borrowData.borrower_type,
      borrowerId: borrowData.borrower_id,
      borrowerName: borrowData.borrower_name,
      quantity: borrowData.quantity,
      borrowDate: borrowData.borrow_date,
      status: borrowData.status,
    }]);

    toast.success(`${book.name} borrowed by ${student.fullName}`);
    setSelectedStudent(""); setSelectedBook(""); setSQty("1"); setSBookSearch("");
  };

  const handleTeacherBorrow = async () => {
    const teacher = teachers.find(t => t.id === selectedTeacher);
    const book = books.find(b => b.id === tSelectedBook);
    const qty = parseInt(tQty) || 1;
    if (!teacher || !book) { toast.error("Select teacher and book"); return; }
    if (book.availableCopy < qty) { toast.error("Not enough copies available"); return; }

    const borrowDate = new Date().toISOString().split("T")[0];
    const { data: borrowData, error: borrowError } = await supabase.from("borrow_records").insert({
      book_id: book.id,
      book_name: book.name,
      borrower_type: "teacher",
      borrower_id: teacher.id,
      borrower_name: teacher.fullName,
      quantity: qty,
      borrow_date: borrowDate,
      status: "borrowed",
    }).select().single();

    if (borrowError || !borrowData) {
      toast.error(borrowError?.message || "Failed to record borrow transaction.");
      return;
    }

    const { error: bookError } = await supabase.from("books").update({ available_copy: book.availableCopy - qty }).eq("id", book.id);
    if (bookError) {
      toast.error(bookError.message);
      return;
    }

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, availableCopy: b.availableCopy - qty } : b));
    setBorrowRecords(prev => [...prev, {
      id: borrowData.id,
      bookId: borrowData.book_id,
      bookName: borrowData.book_name,
      borrowerType: borrowData.borrower_type,
      borrowerId: borrowData.borrower_id,
      borrowerName: borrowData.borrower_name,
      quantity: borrowData.quantity,
      borrowDate: borrowData.borrow_date,
      status: borrowData.status,
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
              <Select value={sDept} onValueChange={(value) => { setSDept(value); setSLevel(""); setSClass(""); }}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={sLevel} onValueChange={(value) => { setSLevel(value); setSClass(""); }} disabled={!sDept}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>{levels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={sClass} onValueChange={setSClass} disabled={!sDept || !sLevel}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>{filteredClasses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
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
