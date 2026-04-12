import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

export default function StockReportsPage() {
  const { stockMovements, stockItems } = useData();
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("all");

  const filtered = stockMovements.filter(m => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (dateFilter && m.date !== dateFilter) return false;
    if (itemFilter !== "all" && m.itemId !== itemFilter) return false;
    return true;
  });

  const exportExcel = () => {
    const headers = ["Item,Type,Quantity,Supplier/Taken By,Price/Unit,Date,Added By"];
    const rows = filtered.map(m =>
      `"${m.itemName}",${m.type},${m.quantity},"${m.supplierName || m.takenBy || ""}",${m.pricePerUnit || ""},${m.date},"${m.addedBy || ""}"`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Stock Reports</h1>
        <p className="text-muted-foreground mt-1">View and export stock reports</p>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (In & Out)</SelectItem>
              <SelectItem value="in">Stock In</SelectItem>
              <SelectItem value="out">Stock Out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={itemFilter} onValueChange={setItemFilter}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="All Items" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              {stockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-secondary border-border" />
          <Button onClick={exportExcel} className="gradient-primary text-primary-foreground"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Results ({filtered.length})</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Qty</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Supplier/Taken By</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Price/Unit</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Added By</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{m.itemName}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.type === "in" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{m.type === "in" ? "Stock In" : "Stock Out"}</span></td>
                  <td className="p-4 text-muted-foreground">{m.quantity}</td>
                  <td className="p-4 text-card-foreground">{m.supplierName || m.takenBy || "-"}</td>
                  <td className="p-4 text-muted-foreground">{m.pricePerUnit || "-"}</td>
                  <td className="p-4 text-muted-foreground">{m.date}</td>
                  <td className="p-4 text-muted-foreground">{m.addedBy || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
