import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, Search, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExternalTransaction {
  id: string;
  receiptNo: string;
  name: string;
  totalAmount: number;
  reason: string;
  date: string;
}

const CY = new Date().getFullYear();
const today = () => new Date().toISOString().split("T")[0];

const initial: ExternalTransaction[] = [];

export default function PayrollPage() {
  const [transactions, setTransactions] = useState<ExternalTransaction[]>(initial);
  const [form, setForm] = useState({ name: "", totalAmount: "", reason: "", date: today() });
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("external_transactions").select("id,receipt_no,name,total_amount,reason,date").order("date", { ascending: false }).limit(50);
      if (error) { console.error("Failed to load external transactions:", error); return; }
      setTransactions((data || []).map((r: any) => ({ id: r.id, receiptNo: r.receipt_no, name: r.name, totalAmount: Number(r.total_amount), reason: r.reason, date: r.date })));
    };
    load();
  }, []);

  const filtered = transactions.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    t.reason.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => setForm({ name: "", totalAmount: "", reason: "", date: today() });

  const handleSave = () => {
    const recordDate = form.date || today();
    if (!form.name || !form.totalAmount || !form.reason) {
      toast.error("Fill all required fields");
      return;
    }

    (async () => {
      if (editId) {
        const { error } = await supabase.from("external_transactions").update({ name: form.name, total_amount: Number(form.totalAmount), reason: form.reason, date: recordDate, updated_at: 'NOW()' }).eq("id", editId);
        if (error) { toast.error("Update failed"); console.error(error); return; }
        toast.success("Transaction updated");
      } else {
        const receipt = `EXT-${CY}-${Date.now()}`;
        const { error } = await supabase.from("external_transactions").insert({ receipt_no: receipt, name: form.name, total_amount: Number(form.totalAmount), reason: form.reason, date: recordDate });
        if (error) { toast.error("Create failed"); console.error(error); return; }
        toast.success("Transaction recorded");
      }
      resetForm();
      const { data } = await supabase.from("external_transactions").select("id,receipt_no,name,total_amount,reason,date").order("date", { ascending: false }).limit(50);
      if (data) setTransactions((data || []).map((r: any) => ({ id: r.id, receiptNo: r.receipt_no, name: r.name, totalAmount: Number(r.total_amount), reason: r.reason, date: r.date })));
    })();
  };

  const handleEdit = (t: ExternalTransaction) => {
    setForm({ name: t.name, totalAmount: String(t.totalAmount), reason: t.reason, date: t.date });
    setEditId(t.id);
  };

  const handleDelete = (id: string) => {
    (async () => {
      const { error } = await supabase.from("external_transactions").delete().eq("id", id);
      if (error) { toast.error("Delete failed"); console.error(error); return; }
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success("Deleted");
    })();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">External Transactions</h1>
        <p className="text-muted-foreground mt-1">Record all payments made by the school to external persons or companies</p>
      </div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5" /> {editId ? "Edit" : "Record"} Transaction
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label className="text-foreground">Name *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Person or company name" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-foreground">Total Amount (FRW) *</Label>
            <Input type="number" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: e.target.value }))} placeholder="50000" className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-foreground">Date *</Label>
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label className="text-foreground">Reason *</Label>
            <Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Why was this payment made?" className="bg-secondary border-border resize-none" rows={2} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> {editId ? "Update" : "Record"} Transaction
          </Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); resetForm(); }}>Cancel</Button>}
        </div>
      </motion.div>

      {/* Records table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-heading font-semibold text-card-foreground">External Transaction Records</h2>
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Receipt No</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Total Amount</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Reason</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-primary font-medium">{t.receiptNo}</td>
                  <td className="p-4 font-medium text-card-foreground">{t.name}</td>
                  <td className="p-4 font-semibold text-destructive">{t.totalAmount.toLocaleString()} FRW</td>
                  <td className="p-4 text-muted-foreground max-w-[240px]">{t.reason}</td>
                  <td className="p-4 text-muted-foreground">{t.date}</td>
                  <td className="p-4 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="text-primary hover:text-primary"><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No transactions found</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
