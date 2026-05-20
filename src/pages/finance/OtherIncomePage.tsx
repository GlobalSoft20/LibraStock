import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface IncomeRecord {
  id: string;
  source: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

const CATEGORIES = ["Donations", "School Events", "Uniform Sales", "Cafeteria Income", "Registration Income", "Other"];

const initial: IncomeRecord[] = [];

const categoryColors: Record<string, string> = {
  Donations: "bg-primary/10 text-primary",
  "School Events": "bg-accent/10 text-accent-foreground",
  "Uniform Sales": "bg-warning/10 text-warning",
  "Cafeteria Income": "bg-success/10 text-success",
  "Registration Income": "bg-muted text-muted-foreground",
  Other: "bg-muted text-muted-foreground",
};

export default function OtherIncomePage() {
  const [records, setRecords] = useState<IncomeRecord[]>(initial);
  const [form, setForm] = useState({ source: "", category: "Donations", amount: "", date: "", description: "" });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      // try plural table then singular
      const tryTables = ["other_incomes", "other_income"];
      for (const tbl of tryTables) {
        const { data, error } = await supabase.from(tbl).select("id,source,category,amount,date,description").order("date", { ascending: false }).limit(100);
        if (!error && data) {
          setRecords((data || []).map((r: any) => ({ id: r.id, source: r.source, category: r.category, amount: Number(r.amount), date: r.date, description: r.description })));
          return;
        }
      }
      // fallback: use nothing (empty)
    };
    load();
  }, []);

  const total = records.reduce((s, r) => s + r.amount, 0);

  const handleSave = () => {
    if (!form.source || !form.amount || !form.date) { toast.error("Fill required fields"); return; }

    (async () => {
      if (editId) {
        const { error } = await supabase.from("other_incomes").update({ source: form.source, category: form.category, amount: Number(form.amount), date: form.date, description: form.description }).eq("id", editId);
        if (error) {
          // fallback local update
          setRecords(prev => prev.map(r => r.id === editId ? { ...r, ...form, amount: Number(form.amount) } : r));
          setEditId(null);
          toast.success("Updated (local)");
          return;
        }
        toast.success("Updated");
      } else {
        const { error } = await supabase.from("other_incomes").insert({ source: form.source, category: form.category, amount: Number(form.amount), date: form.date, description: form.description });
        if (error) {
          setRecords(prev => [{ id: Date.now().toString(), ...form, amount: Number(form.amount) }, ...prev]);
          toast.success("Income recorded (local)");
        } else {
          toast.success("Income recorded");
        }
      }

      setForm({ source: "", category: "Donations", amount: "", date: "", description: "" });

      const { data } = await supabase.from("other_incomes").select("id,source,category,amount,date,description").order("date", { ascending: false }).limit(100);
      if (data) setRecords((data || []).map((r: any) => ({ id: r.id, source: r.source, category: r.category, amount: Number(r.amount), date: r.date, description: r.description })));
    })();
  };

  const handleEdit = (r: IncomeRecord) => {
    setForm({ source: r.source, category: r.category, amount: String(r.amount), date: r.date, description: r.description });
    setEditId(r.id);
  };

  const handleDelete = (id: string) => {
    (async () => {
      const { error } = await supabase.from("other_incomes").delete().eq("id", id);
      if (error) {
        setRecords(prev => prev.filter(r => r.id !== id));
        toast.success("Deleted (local)");
        return;
      }
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success("Deleted");
    })();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Other Income Sources</h1><p className="text-muted-foreground mt-1">Track additional school income beyond student fees</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIES.map(cat => {
          const catTotal = records.filter(r => r.category === cat).reduce((s, r) => s + r.amount, 0);
          return (
            <div key={cat} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <p className="text-xs text-muted-foreground truncate">{cat}</p>
              <p className="text-base font-bold text-card-foreground mt-1">{catTotal.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">FRW</p>
            </div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5" /> {editId ? "Edit" : "Add"} Income</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><Label className="text-foreground">Source *</Label><Input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="Income source" className="bg-secondary border-border" /></div>
          <div>
            <Label className="text-foreground">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground">Amount (FRW) *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="50000" className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Date *</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-secondary border-border" /></div>
          <div className="sm:col-span-2"><Label className="text-foreground">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" className="bg-secondary border-border resize-none" rows={2} /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> {editId ? "Update" : "Add"} Income</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ source: "", category: "Donations", amount: "", date: "", description: "" }); }}>Cancel</Button>}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold text-card-foreground">Income Records</h2>
          <span className="text-sm font-semibold text-success">Total: {total.toLocaleString()} FRW</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Source</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{r.source}</td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[r.category] || "bg-muted text-muted-foreground"}`}>{r.category}</span></td>
                  <td className="p-4 font-semibold text-success">{r.amount.toLocaleString()} FRW</td>
                  <td className="p-4 text-muted-foreground">{r.date}</td>
                  <td className="p-4 text-muted-foreground max-w-xs truncate">{r.description}</td>
                  <td className="p-4 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(r)} className="text-primary hover:text-primary"><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No income records</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
