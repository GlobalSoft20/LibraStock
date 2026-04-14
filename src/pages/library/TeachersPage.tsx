import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function TeachersPage() {
  const { teachers, setTeachers } = useData();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");

  const filtered = teachers.filter(t =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!fullName || !email || !phone || !subject) { toast.error("Fill all fields"); return; }
    const { data, error } = await supabase.from("teachers").insert({
      full_name: fullName,
      email,
      phone,
      subject,
    }).select().single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setTeachers(prev => [...prev, {
        id: data.id,
        fullName: data.full_name,
        email: data.email ?? "",
        phone: data.phone ?? "",
        subject: data.subject ?? "",
      }] );
    }

    setFullName(""); setEmail(""); setPhone(""); setSubject("");
    setOpen(false);
    toast.success("Teacher added");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage teacher records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Teacher</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Add New Teacher</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-foreground">Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-secondary border-border" /></div>
              <div><Label className="text-foreground">Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border" /></div>
              <div><Label className="text-foreground">Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary border-border" /></div>
              <div><Label className="text-foreground">Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-secondary border-border" /></div>
              <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground">Add Teacher</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Full Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Subject</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-muted-foreground">{t.id}</td>
                  <td className="p-4 font-medium text-card-foreground">{t.fullName}</td>
                  <td className="p-4 text-card-foreground">{t.email}</td>
                  <td className="p-4 text-muted-foreground">{t.phone}</td>
                  <td className="p-4 text-muted-foreground">{t.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
