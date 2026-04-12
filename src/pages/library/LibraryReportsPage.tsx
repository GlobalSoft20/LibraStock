import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

export default function LibraryReportsPage() {
  const { borrowRecords } = useData();
  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = borrowRecords.filter(r => {
    if (filterType === "student" && r.borrowerType !== "student") return false;
    if (filterType === "teacher" && r.borrowerType !== "teacher") return false;
    if (statusFilter === "borrowed" && r.status !== "borrowed") return false;
    if (statusFilter === "returned" && r.status !== "returned") return false;
    if (dateFilter && r.borrowDate !== dateFilter) return false;
    if (searchQuery && !r.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) && !r.bookName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    borrowed: "bg-info/10 text-info",
    returned: "bg-success/10 text-success",
    overdue: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Library Reports</h1>
        <p className="text-muted-foreground mt-1">View borrowing and return records</p>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="student">By Student</SelectItem>
              <SelectItem value="teacher">By Teacher</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="borrowed">Borrowed Only</SelectItem>
              <SelectItem value="returned">Returned Only</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-secondary border-border" />
          <div className="flex gap-2">
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-secondary border-border" />
            <Button className="gradient-primary text-primary-foreground flex-shrink-0"><Search className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold text-card-foreground">Results ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Borrower</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Book</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Qty</th>
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
                  <td className="p-4 text-muted-foreground">{r.quantity}</td>
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
