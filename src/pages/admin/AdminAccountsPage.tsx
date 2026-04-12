import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData, AccountRecord } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function AdminAccountsPage() {
  const { accounts, setAccounts } = useData();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"librarian" | "stock_manager" | "">("");

  const handleCreate = () => {
    if (!fullName || !email || !phone || !role) { toast.error("Fill all fields"); return; }
    setAccounts(prev => [...prev, {
      id: Date.now().toString(), fullName, email, phone,
      role: role as "librarian" | "stock_manager",
      createdAt: new Date().toISOString().split("T")[0],
    }]);
    setFullName(""); setEmail(""); setPhone(""); setRole("");
    toast.success("Account created");
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Manage Accounts</h1><p className="text-muted-foreground mt-1">Create and manage staff accounts</p></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><UserPlus className="w-5 h-5" /> Create Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-foreground">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="librarian">Library Manager</SelectItem>
                <SelectItem value="stock_manager">Stock Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground">Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Phone Number</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <Button onClick={handleCreate} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Create Account</Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Staff Accounts</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {accounts.map(a => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{a.fullName}</td>
                  <td className="p-4 text-card-foreground">{a.email}</td>
                  <td className="p-4 text-muted-foreground">{a.phone}</td>
                  <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{a.role.replace("_", " ")}</span></td>
                  <td className="p-4 text-muted-foreground">{a.createdAt}</td>
                </tr>
              ))}
              {accounts.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No accounts created yet</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
