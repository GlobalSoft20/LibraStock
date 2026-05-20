import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";

interface FeeStructure {
  id: string;
  academicYear: string;
  term: string;
  department: string;
  level: string;
  boardingType: string;
  amount: number;
}

const CY = new Date().getFullYear();
const DEFAULT_YEAR = `${CY}-${CY + 1}`;

const initial: FeeStructure[] = [];

export default function FeeStructurePage() {
  const { departments, levels, academicYears, terms } = useData();
  const [structures, setStructures] = useState<FeeStructure[]>(initial);
  const currentYearName = academicYears.find(y => y.isCurrent)?.name ?? DEFAULT_YEAR;
  const currentTermName = (() => {
    const currentYearId = academicYears.find(y => y.name === currentYearName)?.id;
    return terms.find(t => t.isCurrent && (!currentYearId || t.academicYearId === currentYearId))?.name ?? "Term 1";
  })();

  const [form, setForm] = useState({
    academicYear: currentYearName,
    term: currentTermName,
    department: "",
    level: "",
    boardingType: "Day Scholar",
    amount: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const years = academicYears.length ? academicYears.map(y => y.name) : [DEFAULT_YEAR];
  const selectedYearId = academicYears.find(y => y.name === form.academicYear)?.id;
  const DEFAULT_TERMS = ["Term 1", "Term 2", "Term 3"];
  const termOptionsRaw = selectedYearId
    ? terms.filter(t => t.academicYearId === selectedYearId).map(t => t.name)
    : terms.map(t => t.name);
  const termOptions = Array.from(new Set([...DEFAULT_TERMS, ...termOptionsRaw]));

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("fee_structures").select("id,academic_year,term,department,level,boarding_type,amount").order("academic_year", { ascending: false });
      if (error) {
        console.error("Failed to load fee structures:", error);
        return;
      }
      setStructures((data || []).map((r: any) => ({
        id: r.id,
        academicYear: r.academic_year,
        term: r.term,
        department: r.department,
        level: r.level ?? "",
        boardingType: r.boarding_type,
        amount: Number(r.amount),
      })));
    };
    load();
  }, []);

  const handleSave = () => {
    if (!form.department || !form.level || !form.amount) { toast.error("Fill all required fields"); return; }
    const payload = {
      academic_year: form.academicYear,
      term: form.term,
      department: form.department,
      level: form.level,
      boarding_type: form.boardingType,
      amount: Number(form.amount),
    };
    (async () => {
      if (editId) {
        const { error } = await supabase.from("fee_structures").update(payload).eq("id", editId);
        if (error) { toast.error(`Update failed: ${error.message}`); console.error(error); return; }
        toast.success("Fee structure updated");
      } else {
        const { error } = await supabase.from("fee_structures").insert(payload);
        if (error) { toast.error(`Create failed: ${error.message}`); console.error(error); return; }
        toast.success("Fee structure created");
      }
      setForm({ academicYear: currentYearName, term: currentTermName, department: "", level: "", boardingType: "Day Scholar", amount: "" });
      setEditId(null);
      const { data } = await supabase.from("fee_structures").select("id,academic_year,term,department,level,boarding_type,amount").order("academic_year", { ascending: false });
      if (data) setStructures((data || []).map((r: any) => ({
        id: r.id,
        academicYear: r.academic_year,
        term: r.term,
        department: r.department,
        level: r.level ?? "",
        boardingType: r.boarding_type,
        amount: Number(r.amount),
      })));
    })();
  };

  const handleEdit = (s: FeeStructure) => {
    setForm({ academicYear: s.academicYear, term: s.term, department: s.department, level: s.level, boardingType: s.boardingType, amount: String(s.amount) });
    setEditId(s.id);
  };

  const handleDelete = (id: string) => {
    (async () => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) { toast.error("Delete failed"); console.error(error); return; }
      setStructures(prev => prev.filter(s => s.id !== id));
      toast.success("Deleted");
    })();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Fee Structure Management</h1><p className="text-muted-foreground mt-1">Define fee amounts per level, term and academic year</p></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5" /> {editId ? "Edit" : "Create"} Fee Structure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label className="text-foreground">Academic Year</Label>
            <Select value={form.academicYear} onValueChange={v => setForm(p => ({ ...p, academicYear: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground">Term</Label>
            <Select value={form.term} onValueChange={v => setForm(p => ({ ...p, term: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(termOptions.length ? termOptions : ["Term 1", "Term 2", "Term 3"]).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground">Department</Label>
            <Select value={form.department} onValueChange={v => setForm(p => ({ ...p, department: v, level: "" }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-foreground">Level</Label>
            <Select value={form.level} onValueChange={v => setForm(p => ({ ...p, level: v }))} disabled={!form.department}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                {levels
                  .filter(l => {
                    const deptObj = departments.find(d => d.name === form.department);
                    if (!deptObj) return true;
                    return !l.departmentId || l.departmentId === deptObj.id;
                  })
                  .map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground">Boarding Type</Label>
            <Select value={form.boardingType} onValueChange={v => setForm(p => ({ ...p, boardingType: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Day Scholar">Day Scholar</SelectItem><SelectItem value="Boarding">Boarding</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground">Amount (FRW) *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="56000" className="bg-secondary border-border" /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> {editId ? "Update" : "Create"}</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ academicYear: currentYearName, term: currentTermName, department: "", level: "", boardingType: "Day Scholar", amount: "" }); }}>Cancel</Button>}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Fee Structures</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Year</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Term</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Department</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Level</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {structures.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-card-foreground">{s.academicYear}</td>
                  <td className="p-4 text-muted-foreground">{s.term}</td>
                  <td className="p-4 text-muted-foreground">{s.department}</td>
                  <td className="p-4 font-medium text-card-foreground">{s.level}</td>
                  <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{s.boardingType}</span></td>
                  <td className="p-4 font-semibold text-card-foreground">{s.amount.toLocaleString()} FRW</td>
                  <td className="p-4 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(s)} className="text-primary hover:text-primary"><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {structures.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No fee structures defined</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
