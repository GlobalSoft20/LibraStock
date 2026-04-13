import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Users, BookOpen, Package, TrendingUp, GraduationCap, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

export default function AdminReportsPage() {
  const { accounts, books, students, teachers, borrowRecords, stockItems, stockMovements } = useData();
  const [reportType, setReportType] = useState("overview");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const inDateRange = (date: string) => {
    if (!date) return true;
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  };

  const totalBorrowed = borrowRecords.filter(r => r.status === "borrowed").length;
  const totalReturned = borrowRecords.filter(r => r.status === "returned").length;
  const totalOverdue = borrowRecords.filter(r => r.status === "overdue").length;
  const lowStockItems = stockItems.filter(i => i.quantity <= i.lowStockQty);
  const totalStockValue = stockMovements
    .filter(m => m.type === "in" && m.pricePerUnit)
    .reduce((sum, m) => sum + (m.pricePerUnit || 0) * m.quantity, 0);

  const handleDownload = (title: string, data: string[][]) => {
    const csv = data.map(row => row.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadOverview = () => {
    handleDownload("System_Overview", [
      ["Metric", "Value"],
      ["Total Books", String(books.length)],
      ["Total Students", String(students.length)],
      ["Total Teachers", String(teachers.length)],
      ["Active Borrows", String(totalBorrowed)],
      ["Returned Books", String(totalReturned)],
      ["Overdue Books", String(totalOverdue)],
      ["Stock Items", String(stockItems.length)],
      ["Low Stock Alerts", String(lowStockItems.length)],
      ["Total Stock Value", String(totalStockValue)],
      ["Staff Accounts", String(accounts.length)],
    ]);
  };

  const downloadAccounts = () => {
    handleDownload("Staff_Accounts", [
      ["Name", "Email", "Phone", "Role", "Created"],
      ...accounts.map(a => [a.fullName, a.email, a.phone, a.role.replace("_", " "), a.createdAt]),
    ]);
  };

  const downloadBorrows = () => {
    const filtered = borrowRecords.filter(r => inDateRange(r.borrowDate));
    handleDownload("Library_Borrow_Report", [
      ["ID", "Book", "Borrower", "Type", "Quantity", "Borrow Date", "Return Date", "Status"],
      ...filtered.map(r => [r.id, r.bookName, r.borrowerName, r.borrowerType, String(r.quantity), r.borrowDate, r.returnDate || "-", r.status]),
    ]);
  };

  const downloadStudents = () => {
    handleDownload("Students_Report", [
      ["ID", "Full Name", "Department", "Level", "Class"],
      ...students.map(s => [s.id, s.fullName, s.department, s.level, s.class]),
    ]);
  };

  const downloadTeachers = () => {
    handleDownload("Teachers_Report", [
      ["ID", "Full Name", "Email", "Phone", "Subject"],
      ...teachers.map(t => [t.id, t.fullName, t.email, t.phone, t.subject]),
    ]);
  };

  const downloadStock = () => {
    handleDownload("Stock_Inventory", [
      ["Item", "Quantity", "Low Stock Threshold", "Status", "Added Date"],
      ...stockItems.map(i => [i.name, String(i.quantity), String(i.lowStockQty), i.quantity <= i.lowStockQty ? "LOW" : "OK", i.addedDate]),
    ]);
  };

  const downloadStockIn = () => {
    const filtered = stockMovements.filter(m => m.type === "in" && inDateRange(m.date));
    handleDownload("Stock_In_Report", [
      ["Item", "Quantity", "Supplier", "Price/Unit", "Date", "Added By"],
      ...filtered.map(m => [m.itemName, String(m.quantity), m.supplierName || "-", String(m.pricePerUnit || "-"), m.date, m.addedBy || "-"]),
    ]);
  };

  const downloadStockOut = () => {
    const filtered = stockMovements.filter(m => m.type === "out" && inDateRange(m.date));
    handleDownload("Stock_Out_Report", [
      ["Item", "Quantity", "Taken By", "Date", "Added By"],
      ...filtered.map(m => [m.itemName, String(m.quantity), m.takenBy || "-", m.date, m.addedBy || "-"]),
    ]);
  };

  const downloadSuppliers = () => {
    const suppliers = stockMovements.filter(m => m.type === "in" && m.supplierName && inDateRange(m.date));
    handleDownload("Suppliers_Report", [
      ["Supplier", "Item", "Quantity", "Price/Unit", "Total", "Date"],
      ...suppliers.map(m => [m.supplierName || "", m.itemName, String(m.quantity), String(m.pricePerUnit || 0), String((m.pricePerUnit || 0) * m.quantity), m.date]),
    ]);
  };

  const downloadTakenBy = () => {
    const takenItems = stockMovements.filter(m => m.type === "out" && m.takenBy && inDateRange(m.date));
    handleDownload("Taken_By_Report", [
      ["Taken By", "Item", "Quantity", "Date"],
      ...takenItems.map(m => [m.takenBy || "", m.itemName, String(m.quantity), m.date]),
    ]);
  };

  const reportCards = [
    { title: "System Overview", desc: "Overall system statistics", action: downloadOverview, icon: TrendingUp, category: "general" },
    { title: "Staff Accounts", desc: "All staff accounts and roles", action: downloadAccounts, icon: Users, category: "general" },
    { title: "Students Report", desc: "All student records", action: downloadStudents, icon: GraduationCap, category: "library" },
    { title: "Teachers Report", desc: "All teacher records", action: downloadTeachers, icon: Users, category: "library" },
    { title: "Borrow Records", desc: "Library borrow/return records", action: downloadBorrows, icon: BookOpen, category: "library" },
    { title: "Stock Inventory", desc: "Current stock levels and alerts", action: downloadStock, icon: Package, category: "stock" },
    { title: "Stock In Report", desc: "All stock received entries", action: downloadStockIn, icon: Package, category: "stock" },
    { title: "Stock Out Report", desc: "All stock issued entries", action: downloadStockOut, icon: Package, category: "stock" },
    { title: "Suppliers Report", desc: "Stock by supplier", action: downloadSuppliers, icon: Users, category: "stock" },
    { title: "Taken By Report", desc: "Stock issued to individuals", action: downloadTakenBy, icon: Users, category: "stock" },
  ];

  const filteredReports = reportType === "all" ? reportCards : reportType === "overview" ? reportCards : reportCards.filter(r => reportType === "general" ? r.category === "general" : reportType === "library" ? r.category === "library" : r.category === "stock");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Admin Reports</h1>
        <p className="text-muted-foreground mt-1">View, filter, and download system reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Active Borrows", value: totalBorrowed, icon: BookOpen, color: "text-primary" },
          { title: "Overdue Books", value: totalOverdue, icon: TrendingUp, color: "text-destructive" },
          { title: "Low Stock Alerts", value: lowStockItems.length, icon: Package, color: "text-warning" },
          { title: "Staff Accounts", value: accounts.length, icon: Users, color: "text-accent-foreground" },
        ].map(s => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="text-2xl font-bold text-card-foreground mt-1">{s.value}</p>
              </div>
              <s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-5 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5" /> Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">All Reports</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="library">Library</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <Label className="text-xs text-muted-foreground">From Date</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">To Date</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(reportType === "overview" ? reportCards : filteredReports).map(r => (
          <motion.div key={r.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <r.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-card-foreground">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
              </div>
              <Button onClick={r.action} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> CSV
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {accounts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading font-semibold text-card-foreground">Account Performance Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Account</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Activity</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.map(a => {
                  const activity = a.role === "librarian"
                    ? `${borrowRecords.length} borrows managed`
                    : `${stockMovements.length} stock movements`;
                  return (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-card-foreground">{a.fullName}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{a.role.replace("_", " ")}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{a.createdAt}</td>
                      <td className="p-4 text-muted-foreground">{activity}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">Active</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
