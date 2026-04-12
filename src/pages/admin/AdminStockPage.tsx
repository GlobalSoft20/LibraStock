import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "@/components/StatCard";
import { useData } from "@/contexts/DataContext";

export default function AdminStockPage() {
  const { stockItems, stockMovements } = useData();
  const [searchItem, setSearchItem] = useState("");
  const [period, setPeriod] = useState("week");

  const now = new Date();
  const periodMs = period === "day" ? 1 : period === "week" ? 7 : 30;
  const cutoff = new Date(now.getTime() - periodMs * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const lowStock = stockItems.filter(i => i.quantity <= i.lowStockQty);
  const stockInPeriod = stockMovements.filter(m => m.type === "in" && m.date >= cutoff);
  const stockOutPeriod = stockMovements.filter(m => m.type === "out" && m.date >= cutoff);

  const selectedItem = stockItems.find(i => i.name.toLowerCase().includes(searchItem.toLowerCase()));
  const itemMovements = selectedItem ? stockMovements.filter(m => m.itemId === selectedItem.id && m.date >= cutoff) : [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Stock Overview</h1><p className="text-muted-foreground mt-1">Admin stock management view</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={stockItems.length} icon={<Package className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Stock In" value={stockInPeriod.reduce((s, m) => s + m.quantity, 0)} icon={<TrendingUp className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
        <StatCard title="Stock Out" value={stockOutPeriod.reduce((s, m) => s + m.quantity, 0)} icon={<TrendingDown className="w-5 h-5 text-warning-foreground" />} gradient="warm" />
        <StatCard title="Low Stock Alerts" value={lowStock.length} icon={<AlertTriangle className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-5 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground">Search Item Movement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input value={searchItem} onChange={e => setSearchItem(e.target.value)} placeholder="Search item name" className="bg-secondary border-border" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {searchItem && selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
            <p className="text-sm font-medium text-foreground mb-2">Movements for: {selectedItem.name}</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-left p-3 font-medium text-muted-foreground">By</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {itemMovements.map(m => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.type === "in" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{m.type === "in" ? "In" : "Out"}</span></td>
                    <td className="p-3 text-muted-foreground">{m.quantity}</td>
                    <td className="p-3 text-card-foreground">{m.addedBy || m.takenBy || "-"}</td>
                    <td className="p-3 text-muted-foreground">{m.date}</td>
                  </tr>
                ))}
                {itemMovements.length === 0 && <tr><td colSpan={4} className="p-3 text-muted-foreground text-center">No movements found</td></tr>}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
