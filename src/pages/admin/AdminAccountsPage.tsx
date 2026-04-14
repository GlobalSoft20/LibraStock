import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminAccountsPage() {
  const { accounts, setAccounts } = useData();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"librarian" | "stock_manager" | "">("");

  const handleCreate = async () => {
    if (!fullName || !email || !phone || !role || !username || !password) {
      toast.error("Fill all fields including username and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    // Register in auth system so they can log in
    const result = await register(email, password, fullName, phone, role as "librarian" | "stock_manager");
    if (!result.success) {
      toast.error(result.error || "Failed to create account");
      return;
    }
    setAccounts(prev => [...prev, {
      id: Date.now().toString(), fullName, email, phone,
      role: role as "librarian" | "stock_manager",
      createdAt: new Date().toISOString().split("T")[0],
    }]);
    setFullName(""); setEmail(""); setPhone(""); setRole(""); setUsername(""); setPassword("");
    toast.success("Account created — user can now log in");
  };

  const handleDelete = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    toast.success("Account removed");
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Manage Accounts</h1><p className="text-muted-foreground mt-1">Create librarian and stock manager accounts</p></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><UserPlus className="w-5 h-5" /> Create Staff Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label className="text-foreground">Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="librarian">Library Manager</SelectItem>
                <SelectItem value="stock_manager">Stock Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground">Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Phone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Username *</Label><Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Login username" className="bg-secondary border-border" /></div>
          <div><Label className="text-foreground">Password *</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="bg-secondary border-border" /></div>
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
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {accounts.map(a => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{a.fullName}</td>
                  <td className="p-4 text-card-foreground">{a.email}</td>
                  <td className="p-4 text-muted-foreground">{a.phone}</td>
                  <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{a.role.replace("_", " ")}</span></td>
                  <td className="p-4 text-muted-foreground">{a.createdAt}</td>
                  <td className="p-4"><Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></td>
                </tr>
              ))}
              {accounts.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No staff accounts created yet</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
