import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

export default function StockDashboard() {
  const { user } = useAuth();
  const { stockItems, stockMovements } = useData();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekStr = weekAgo.toISOString().split("T")[0];
  const stockInWeek = stockMovements.filter(m => m.type === "in" && m.date >= weekStr);
  const stockOutWeek = stockMovements.filter(m => m.type === "out" && m.date >= weekStr);
  const lowStock = stockItems.filter(i => i.quantity <= i.lowStockQty);

  const statusColors: Record<string, string> = {
    "In Stock": "bg-success/10 text-success",
    "Low Stock": "bg-warning/10 text-warning",
    Critical: "bg-destructive/10 text-destructive",
  };

  const getStatus = (item: typeof stockItems[0]) => {
    if (item.quantity <= 0) return "Critical";
    if (item.quantity <= item.lowStockQty) return "Low Stock";
    return "In Stock";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back, {user?.fullName}</h1>
        <p className="text-muted-foreground mt-1">Stock Management Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={stockItems.length} icon={<Package className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Stock In (Week)" value={stockInWeek.reduce((s, m) => s + m.quantity, 0)} icon={<TrendingUp className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
        <StatCard title="Stock Out (Week)" value={stockOutWeek.reduce((s, m) => s + m.quantity, 0)} icon={<TrendingDown className="w-5 h-5 text-warning-foreground" />} gradient="warm" />
        <StatCard title="Low Stock" value={lowStock.length} icon={<AlertTriangle className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Inventory Overview</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Quantity</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {stockItems.map(item => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-card-foreground">{item.name}</td>
                    <td className="p-4 text-muted-foreground">{item.quantity}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
