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

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

const CATEGORIES = ["Salaries", "Utilities", "School Materials", "Transport", "Maintenance", "Purchases", "Other"];

const initial: Expense[] = [];

const categoryColors: Record<string, string> = {
  Salaries: "bg-primary/10 text-primary",
  Utilities: "bg-warning/10 text-warning",
  "School Materials": "bg-accent/10 text-accent-foreground",
  Transport: "bg-success/10 text-success",
  Maintenance: "bg-destructive/10 text-destructive",
  Purchases: "bg-muted text-muted-foreground",
  Other: "bg-muted text-muted-foreground",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initial);
  const [form, setForm] = useState({ title: "", category: "Salaries", amount: "", date: "", description: "" });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const loadExpenses = async () => {
      const { data, error } = await supabase
        .from("external_transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(200);
      if (error) {
        console.error("Failed to load expenses:", error);
        return;
      }
      setExpenses((data || []).map((row: any) => ({
        id: row.id,
        title: row.name,
        category: row.category ?? "Expenses",
        amount: Number(row.total_amount),
        date: row.date,
        description: row.reason || "",
      })));
    };
    loadExpenses();
  }, []);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleSave = () => {
    if (!form.title || !form.amount || !form.date) { toast.error("Fill required fields"); return; }

    (async () => {
      if (editId) {
        const { error } = await supabase
          .from("external_transactions")
          .update({ name: form.title, total_amount: Number(form.amount), reason: form.description, category: form.category, date: form.date })
          .eq("id", editId);
        if (error) {
          console.error(error);
          toast.error("Expense update failed");
          return;
        }
        toast.success("Expense updated");
      } else {
        const receipt = `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { error } = await supabase
          .from("external_transactions")
          .insert({ receipt_no: receipt, name: form.title, total_amount: Number(form.amount), reason: form.description, category: form.category, date: form.date });
        if (error) {
          console.error(error);
          toast.error("Expense add failed");
          return;
        }
        toast.success("Expense added");
      }
      setForm({ title: "", category: "Salaries", amount: "", date: "", description: "" });
      setEditId(null);
      const { data } = await supabase
        .from("external_transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(200);
      if (data) {
        setExpenses(data.map((row: any) => ({
          id: row.id,
          title: row.name,
          category: row.category ?? "Expenses",
          amount: Number(row.total_amount),
          date: row.date,
          description: row.reason || "",
        })));
      }
    })();
  };

  const handleEdit = (e: Expense) => {
    setForm({ title: e.title, category: e.category, amount: String(e.amount), date: e.date, description: e.description });
    setEditId(e.id);
  };

  const handleDelete = (id: string) => {
    (async () => {
      const { error } = await supabase.from("external_transactions").delete().eq("id", id);
      if (error) {
        console.error(error);
        toast.error("Delete failed");
        return;
      }
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success("Deleted");
    })();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Expense Management</h1><p className="text-muted-foreground mt-1">Track all school expenses by category</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CATEGORIES.slice(0, 4).map(cat => {
          const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
          return (
            <div key={cat} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <p className="text-xs text-muted-foreground">{cat}</p>
              <p className="text-lg font-bold text-card-foreground mt-1">{catTotal.toLocaleString()} FRW</p>
            </div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5" /> {editId ? "Edit" : "Add"} Expense</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><Label className="text-foreground">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Expense title" className="bg-secondary border-border" /></div>
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
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> {editId ? "Update" : "Add"} Expense</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ title: "", category: "Salaries", amount: "", date: "", description: "" }); }}>Cancel</Button>}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold text-card-foreground">Expense Records</h2>
          <span className="text-sm font-semibold text-destructive">Total: {total.toLocaleString()} FRW</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{e.title}</td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[e.category] || "bg-muted text-muted-foreground"}`}>{e.category}</span></td>
                  <td className="p-4 font-semibold text-destructive">{e.amount.toLocaleString()} FRW</td>
                  <td className="p-4 text-muted-foreground">{e.date}</td>
                  <td className="p-4 text-muted-foreground max-w-xs truncate">{e.description}</td>
                  <td className="p-4 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(e)} className="text-primary hover:text-primary"><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No expenses recorded</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
