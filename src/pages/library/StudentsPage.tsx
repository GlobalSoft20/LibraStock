import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function StudentsPage() {
  const { students, setStudents, departments, levels, classes } = useData();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dept, setDept] = useState("");
  const [level, setLevel] = useState("");
  const [cls, setCls] = useState("");
  const [uploadDept, setUploadDept] = useState("");
  const [uploadLevel, setUploadLevel] = useState("");
  const [uploadClass, setUploadClass] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredClasses = classes.filter(c => {
    const deptObj = departments.find(d => d.name === dept);
    const lvlObj = levels.find(l => l.name === level);
    return (!dept || c.departmentId === deptObj?.id) && (!level || c.levelId === lvlObj?.id);
  });

  const uploadFilteredClasses = classes.filter(c => {
    const deptObj = departments.find(d => d.name === uploadDept);
    const lvlObj = levels.find(l => l.name === uploadLevel);
    return (!uploadDept || c.departmentId === deptObj?.id) && (!uploadLevel || c.levelId === lvlObj?.id);
  });

  const filterClasses = classes.filter(c => {
    const deptObj = departments.find(d => d.name === filterDept);
    const lvlObj = levels.find(l => l.name === filterLevel);
    return (!filterDept || c.departmentId === deptObj?.id) && (!filterLevel || c.levelId === lvlObj?.id);
  });

  const filtered = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentNumber.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !filterDept || s.department === filterDept;
    const matchesLevel = !filterLevel || s.level === filterLevel;
    const matchesClass = !selectedClass || s.class === selectedClass;
    return matchesSearch && matchesDept && matchesLevel && matchesClass;
  });

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (filtered.every(s => selectedStudentIds.has(s.id))) {
      setSelectedStudentIds(new Set());
      return;
    }
    setSelectedStudentIds(new Set(filtered.map(s => s.id)));
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const hasActiveBorrow = borrowRecords.some(r => r.borrowerType === "student" && r.borrowerId === studentId && r.status === "borrowed");
    if (hasActiveBorrow) {
      toast.error(`${studentName} has an active borrowed book and cannot be deleted.`);
      return;
    }

    const confirmed = window.confirm(`Delete ${studentName}? This cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabase.from("students").delete().eq("id", studentId);
    if (error) {
      toast.error(error.message);
      return;
    }

    setStudents(prev => prev.filter(s => s.id !== studentId));
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
    toast.success(`${studentName} deleted successfully.`);
  };

  const handleDeleteSelected = async () => {
    if (selectedStudentIds.size === 0) {
      toast.error("No students selected for deletion.");
      return;
    }

    const selected = students.filter(s => selectedStudentIds.has(s.id));
    const blocked = selected.filter(s => borrowRecords.some(r => r.borrowerType === "student" && r.borrowerId === s.id && r.status === "borrowed"));
    if (blocked.length > 0) {
      toast.error(`${blocked.length} selected student(s) have active borrowed books and cannot be deleted.`);
      return;
    }

    const confirmed = window.confirm(`Delete ${selected.length} selected student(s)? This cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabase.from("students").delete().in("id", Array.from(selectedStudentIds));
    if (error) {
      toast.error(error.message);
      return;
    }

    setStudents(prev => prev.filter(s => !selectedStudentIds.has(s.id)));
    setSelectedStudentIds(new Set());
    toast.success(`${selected.length} student(s) deleted successfully.`);
  };

  const handleAddStudent = async () => {
    if (!fullName || !dept || !level || !cls) { toast.error("Fill all fields"); return; }
    const { data, error } = await supabase.from("students").insert({
      full_name: fullName,
      department: dept,
      level,
      class: cls,
    }).select().single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setStudents(prev => [...prev, {
        id: data.id,
        studentNumber: data.student_number,
        fullName: data.full_name,
        department: data.department,
        level: data.level,
        class: data.class,
      }] );
    }

    setFullName(""); setDept(""); setLevel(""); setCls("");
    setAddOpen(false);
    toast.success("Student added");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls", "doc", "docx", "pdf"].includes(ext || "")) {
      toast.error("Supported formats: CSV, Excel, DOC, PDF");
      return;
    }

    const reader = new FileReader();
    
    const parseStudentData = async (rows: any[]) => {
      const processedRows = rows
        .map((row) => ({
          full_name: row[0] || row.full_name || row["Name"] || "",
          department: uploadDept || row[1] || row.department || row["Department"] || "",
          level: uploadLevel || row[2] || row.level || row["Level"] || "",
          class: uploadClass || row[3] || row.class || row["Class"] || "",
        }))
        .filter(row => row.full_name && row.full_name.trim());

      if (processedRows.length === 0) {
        toast.error(`No valid student rows found in the ${ext?.toUpperCase()} file.`);
        return;
      }

      const { data, error } = await supabase.from("students").insert(processedRows).select();
      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        setStudents(prev => [...prev, ...data.map(row => ({
          id: row.id,
          studentNumber: row.student_number,
          fullName: row.full_name,
          department: row.department,
          level: row.level,
          class: row.class,
        }))]);
      }

      toast.success(`${data?.length ?? 0} students imported`);
      setUploadOpen(false);
    };

    if (ext === "csv") {
      reader.onload = async (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        const rows = lines.slice(1).map((line) => line.split(",").map(c => c.trim()));
        await parseStudentData(rows);
      };
      reader.readAsText(file);
    } else if (ext === "xlsx" || ext === "xls") {
      reader.onload = async (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const dataRows = rows.slice(1);
        await parseStudentData(dataRows);
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === "pdf") {
      reader.onload = async (ev) => {
        try {
          const pdf = await pdfjs.getDocument(new Uint8Array(ev.target?.result as ArrayBuffer)).promise;
          let rows: any[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            const lines = text.items.map((item: any) => item.str).join(" ");
            const studentLines = lines.split("\n").filter(l => l.trim());
            rows = rows.concat(studentLines.map(line => line.split(/\s+/)));
          }
          await parseStudentData(rows);
        } catch (err) {
          toast.error("Failed to parse PDF file");
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === "docx" || ext === "doc") {
      toast.info("Word document parsing: Please ensure data is in table format with headers (Full Name, Department, Level, Class)");
      setUploadOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">Manage student records</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border text-foreground"><Upload className="w-4 h-4 mr-2" /> Upload List</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="text-foreground">Upload Student List</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-foreground">Department</Label>
                  <Select value={uploadDept} onValueChange={(v) => { setUploadDept(v); setUploadLevel(""); setUploadClass(""); }}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-foreground">Level</Label>
                  <Select value={uploadLevel} onValueChange={(v) => { setUploadLevel(v); setUploadClass(""); }} disabled={!uploadDept}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Level" /></SelectTrigger>
                    <SelectContent>{levels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-foreground">Class</Label>
                  <Select value={uploadClass} onValueChange={setUploadClass} disabled={!uploadDept || !uploadLevel}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>{uploadFilteredClasses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground text-sm">Supports: CSV, Excel, DOC, PDF</Label>
                  <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls,.doc,.docx,.pdf" onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full mt-1 border-border text-foreground"><Upload className="w-4 h-4 mr-2" /> Choose File</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="text-foreground">Add New Student</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-foreground">Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-secondary border-border" /></div>
                <div><Label className="text-foreground">Department</Label>
                  <Select value={dept} onValueChange={(v) => { setDept(v); setLevel(""); setCls(""); }}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-foreground">Level</Label>
                  <Select value={level} onValueChange={(v) => { setLevel(v); setCls(""); }} disabled={!dept}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Level" /></SelectTrigger>
                    <SelectContent>{levels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-foreground">Class</Label>
                  <Select value={cls} onValueChange={setCls} disabled={!dept || !level}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>{filteredClasses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddStudent} className="w-full gradient-primary text-primary-foreground">Add Student</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 items-end">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Department</label>
          <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setFilterLevel(""); setSelectedClass(""); }} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Level</label>
          <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setSelectedClass(""); }} disabled={!filterDept} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
            <option value="">All Levels</option>
            {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={!filterDept || !filterLevel} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
            <option value="">All Classes</option>
            {filterClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          {(!filterDept || !filterLevel) && <p className="text-xs text-muted-foreground mt-1">Choose department and level first.</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="outline" className="border-border text-foreground">{filtered.every(s => selectedStudentIds.has(s.id) && filtered.length > 0) ? "Deselect All" : "Select All"}</Button>
          <Button onClick={handleDeleteSelected} className="text-destructive border border-destructive hover:bg-destructive/10">Delete Selected</Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground"><input type="checkbox" checked={filtered.length > 0 && filtered.every(s => selectedStudentIds.has(s.id))} onChange={handleSelectAll} className="h-4 w-4" /></th>
              <th className="text-left p-4 font-medium text-muted-foreground">Student #</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Department</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Level</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Class</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4"><input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => handleToggleStudent(s.id)} className="h-4 w-4" /></td>
                  <td className="p-4 font-medium text-primary">{s.studentNumber}</td>
                  <td className="p-4 font-medium text-card-foreground">{s.fullName}</td>
                  <td className="p-4 text-card-foreground">{s.department}</td>
                  <td className="p-4 text-muted-foreground">{s.level}</td>
                  <td className="p-4 text-muted-foreground">{s.class}</td>
                  <td className="p-4"><button onClick={() => handleDeleteStudent(s.id, s.fullName)} className="text-destructive hover:underline">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
