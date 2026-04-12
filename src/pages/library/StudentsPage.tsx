import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function StudentsPage() {
  const { students, setStudents, departments } = useData();
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
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStudent = () => {
    if (!fullName || !dept || !level || !cls) { toast.error("Fill all fields"); return; }
    const id = `STD${String(students.length + 1).padStart(4, "0")}`;
    setStudents(prev => [...prev, { id, fullName, department: dept, level, class: cls }]);
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
    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        let added = 0;
        lines.slice(1).forEach(line => {
          const cols = line.split(",").map(c => c.trim());
          if (cols[0]) {
            const id = `STD${String(students.length + added + 1).padStart(4, "0")}`;
            setStudents(prev => [...prev, {
              id,
              fullName: cols[0],
              department: uploadDept || cols[1] || "",
              level: uploadLevel || cols[2] || "",
              class: uploadClass || cols[3] || "",
            }]);
            added++;
          }
        });
        toast.success(`${added} students imported`);
        setUploadOpen(false);
      };
      reader.readAsText(file);
    } else {
      toast.info("File uploaded. CSV parsing supported for auto-import.");
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
                <Select value={uploadDept} onValueChange={setUploadDept}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={uploadLevel} onChange={e => setUploadLevel(e.target.value)} placeholder="Level" className="bg-secondary border-border" />
                <Input value={uploadClass} onChange={e => setUploadClass(e.target.value)} placeholder="Class" className="bg-secondary border-border" />
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
                  <Select value={dept} onValueChange={setDept}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-foreground">Level</Label><Input value={level} onChange={e => setLevel(e.target.value)} className="bg-secondary border-border" /></div>
                <div><Label className="text-foreground">Class</Label><Input value={cls} onChange={e => setCls(e.target.value)} className="bg-secondary border-border" /></div>
                <Button onClick={handleAddStudent} className="w-full gradient-primary text-primary-foreground">Add Student</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Department</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Level</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Class</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-muted-foreground">{s.id}</td>
                  <td className="p-4 font-medium text-card-foreground">{s.fullName}</td>
                  <td className="p-4 text-card-foreground">{s.department}</td>
                  <td className="p-4 text-muted-foreground">{s.level}</td>
                  <td className="p-4 text-muted-foreground">{s.class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
