import { useState } from "react";
import { motion } from "framer-motion";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function ReturnPage() {
  const { students, teachers, books, setBooks, borrowRecords, setBorrowRecords, departments } = useData();
  const [tab, setTab] = useState("student");

  const [sDept, setSDept] = useState("");
  const [sLevel, setSLevel] = useState("");
  const [sClass, setSClass] = useState("");
  const [sSearch, setSSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedRecord, setSelectedRecord] = useState("");

  const [tSearch, setTSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [tSelectedRecord, setTSelectedRecord] = useState("");

  const filteredStudents = students.filter(s => {
    const matchDept = !sDept || s.department === sDept;
    const matchLevel = !sLevel || s.level === sLevel;
    const matchClass = !sClass || s.class === sClass;
    const matchSearch = !sSearch || s.fullName.toLowerCase().includes(sSearch.toLowerCase());
    return matchDept && matchLevel && matchClass && matchSearch;
  });

  const filteredTeachers = teachers.filter(t =>
    !tSearch || t.fullName.toLowerCase().includes(tSearch.toLowerCase())
  );

  const studentBorrows = borrowRecords.filter(r => r.borrowerType === "student" && r.borrowerId === selectedStudent && r.status === "borrowed");
  const teacherBorrows = borrowRecords.filter(r => r.borrowerType === "teacher" && r.borrowerId === selectedTeacher && r.status === "borrowed");

  const handleReturn = (recordId: string) => {
    const record = borrowRecords.find(r => r.id === recordId);
    if (!record) return;
    setBorrowRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: "returned", returnDate: new Date().toISOString().split("T")[0] } : r));
    setBooks(prev => prev.map(b => b.id === record.bookId ? { ...b, availableCopy: b.availableCopy + record.quantity } : b));
    toast.success(`${record.bookName} returned by ${record.borrowerName}`);
    setSelectedRecord("");
    setTSelectedRecord("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Return Book</h1>
        <p className="text-muted-foreground mt-1">Process book returns</p>
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
              <Input value={sSearch} onChange={e => setSSearch(e.target.value)} placeholder="Search name" className="bg-secondary border-border" />
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{filteredStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.id})</SelectItem>)}</SelectContent>
            </Select>

            {selectedStudent && studentBorrows.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Borrowed Books:</h3>
                {studentBorrows.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.bookName}</p>
                      <p className="text-xs text-muted-foreground">Borrowed: {r.borrowDate} • Qty: {r.quantity}</p>
                    </div>
                    <Button onClick={() => handleReturn(r.id)} size="sm" className="gradient-primary text-primary-foreground"><RotateCcw className="w-3 h-3 mr-1" /> Return</Button>
                  </div>
                ))}
              </div>
            )}
            {selectedStudent && studentBorrows.length === 0 && <p className="text-sm text-muted-foreground">No borrowed books found.</p>}
          </motion.div>
        </TabsContent>

        <TabsContent value="teacher">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
            <h2 className="font-heading font-semibold text-card-foreground">Find Teacher</h2>
            <Input value={tSearch} onChange={e => setTSearch(e.target.value)} placeholder="Search teacher name" className="bg-secondary border-border max-w-sm" />
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="bg-secondary border-border max-w-sm"><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>{filteredTeachers.map(t => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}</SelectContent>
            </Select>

            {selectedTeacher && teacherBorrows.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Borrowed Books:</h3>
                {teacherBorrows.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.bookName}</p>
                      <p className="text-xs text-muted-foreground">Borrowed: {r.borrowDate} • Qty: {r.quantity}</p>
                    </div>
                    <Button onClick={() => handleReturn(r.id)} size="sm" className="gradient-primary text-primary-foreground"><RotateCcw className="w-3 h-3 mr-1" /> Return</Button>
                  </div>
                ))}
              </div>
            )}
            {selectedTeacher && teacherBorrows.length === 0 && <p className="text-sm text-muted-foreground">No borrowed books found.</p>}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
