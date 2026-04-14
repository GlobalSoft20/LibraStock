import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

export default function AdminLibraryPage() {
  const { borrowRecords, books } = useData();
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const statusColors: Record<string, string> = {
    borrowed: "bg-info/10 text-info",
    returned: "bg-success/10 text-success",
    overdue: "bg-destructive/10 text-destructive",
  };

  const filtered = useMemo(() => {
    return borrowRecords.filter(r => {
      const matchesSearch =
        r.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
        r.bookName.toLowerCase().includes(search.toLowerCase());

      const matchesBook = selectedBook === "all" || r.bookId === selectedBook;
      const matchesType = selectedType === "all" || r.borrowerType === selectedType;
      const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
      const matchesFrom = !dateFrom || r.borrowDate >= dateFrom;
      const matchesTo = !dateTo || r.borrowDate <= dateTo;

      return matchesSearch && matchesBook && matchesType && matchesStatus && matchesFrom && matchesTo;
    });
  }, [borrowRecords, search, selectedBook, selectedType, selectedStatus, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Library Activity</h1>
        <p className="text-muted-foreground mt-1">View and filter borrowing movement for any book, student or teacher.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search book, borrower name, or ID..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Book</Label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="All books" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All books</SelectItem>
                {books.map(book => (
                  <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Borrower</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">From date</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-card border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To date</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-card border-border" />
            </div>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground">Showing</p>
            <p className="text-lg font-semibold text-card-foreground">{filtered.length} activity records</p>
          </div>
          <Button variant="outline" onClick={() => {
            setSearch("");
            setSelectedBook("all");
            setSelectedType("all");
            setSelectedStatus("all");
            setDateFrom("");
            setDateTo("");
          }}>Reset filters</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Book</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Borrower</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Borrow Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Return Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{r.bookName}</td>
                  <td className="p-4 text-muted-foreground">{r.borrowerName}</td>
                  <td className="p-4 text-muted-foreground capitalize">{r.borrowerType}</td>
                  <td className="p-4 text-muted-foreground">{r.borrowDate}</td>
                  <td className="p-4 text-muted-foreground">{r.returnDate || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No book movement records match the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
