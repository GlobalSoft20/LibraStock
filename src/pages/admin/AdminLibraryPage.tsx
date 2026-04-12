import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

export default function AdminLibraryPage() {
  const { borrowRecords, students, teachers } = useData();
  const [search, setSearch] = useState("");
  const filtered = borrowRecords.filter(r =>
    r.borrowerName.toLowerCase().includes(search.toLowerCase()) || r.bookName.toLowerCase().includes(search.toLowerCase())
  );
  const statusColors: Record<string, string> = { borrowed: "bg-info/10 text-info", returned: "bg-success/10 text-success", overdue: "bg-destructive/10 text-destructive" };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Library Overview</h1><p className="text-muted-foreground mt-1">Search and view borrowing activity</p></div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or teacher name..." className="pl-10 bg-card border-border" />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Book</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Borrow Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Return Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{r.borrowerName}</td>
                  <td className="p-4 text-muted-foreground capitalize">{r.borrowerType}</td>
                  <td className="p-4 text-card-foreground">{r.bookName}</td>
                  <td className="p-4 text-muted-foreground">{r.borrowDate}</td>
                  <td className="p-4 text-muted-foreground">{r.returnDate || "-"}</td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
