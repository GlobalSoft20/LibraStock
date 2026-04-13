import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Users, BookOpen, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

export default function AdminReportsPage() {
  const { accounts, books, students, teachers, borrowRecords, stockItems, stockMovements } = useData();
  const [reportType, setReportType] = useState("overview");

  const totalBorrowed = borrowRecords.filter(r => r.status === "borrowed").length;
  const totalReturned = borrowRecords.filter(r => r.status === "returned").length;
  const totalOverdue = borrowRecords.filter(r => r.status === "overdue").length;
  const lowStockItems = stockItems.filter(i => i.quantity <= i.lowStockQty);
  const totalStockValue = stockMovements
    .filter(m => m.type === "in" && m.pricePerUnit)
    .reduce((sum, m) => sum + (m.pricePerUnit || 0) * m.quantity, 0);

  const handleDownload = (title: string, data: string[][]) => {
    const csv = data.map(row => row.join(",")).join("\n");
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
    handleDownload("Borrow_Records", [
      ["ID", "Book", "Borrower", "Type", "Quantity", "Borrow Date", "Return Date", "Status"],
      ...borrowRecords.map(r => [r.id, r.bookName, r.borrowerName, r.borrowerType, String(r.quantity), r.borrowDate, r.returnDate || "-", r.status]),
    ]);
  };

  const downloadStock = () => {
    handleDownload("Stock_Report", [
      ["Item", "Quantity", "Low Stock Threshold", "Status"],
      ...stockItems.map(i => [i.name, String(i.quantity), String(i.lowStockQty), i.quantity <= i.lowStockQty ? "LOW" : "OK"]),
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Admin Reports</h1>
        <p className="text-muted-foreground mt-1">View and download system reports</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "System Overview", desc: "Overall system statistics and metrics", action: downloadOverview, icon: TrendingUp },
          { title: "Staff Accounts Report", desc: "All created staff accounts and roles", action: downloadAccounts, icon: Users },
          { title: "Library Borrow Report", desc: "All borrow/return records with status", action: downloadBorrows, icon: BookOpen },
          { title: "Stock Inventory Report", desc: "Current stock levels and alerts", action: downloadStock, icon: Package },
        ].map(r => (
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
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.map(a => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-card-foreground">{a.fullName}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{a.role.replace("_", " ")}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">{a.createdAt}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
