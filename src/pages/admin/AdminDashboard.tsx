import { BookOpen, Users, Package, GraduationCap, TrendingUp, AlertTriangle, Bell, DollarSign, TrendingDown, Receipt, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { books, students, teachers, stockItems, borrowRecords, stockMovements, accounts } = useData();

  const lowStockItems = stockItems.filter(i => i.quantity <= i.lowStockQty);

  const [totalCollected, setTotalCollected] = useState<number>(0);
  const [unpaidBalance, setUnpaidBalance] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);

  const fmt = (n: number) => `${Math.round(n).toLocaleString()} FRW`;

  useEffect(() => {
    const loadFinance = async () => {
      const [{ data: fees, error: feesErr }, { data: tx, error: txErr }, { data: inc, error: incErr }] = await Promise.all([
        supabase.from("student_fees").select("total_fee,amount_paid").limit(5000),
        supabase.from("external_transactions").select("total_amount,category").limit(5000),
        supabase.from("other_incomes").select("amount").limit(5000),
      ]);

      if (feesErr) console.error("Failed to load student fees for admin dashboard:", feesErr);
      if (txErr) console.error("Failed to load transactions for admin dashboard:", txErr);
      if (incErr) console.error("Failed to load other incomes for admin dashboard:", incErr);

      if (fees) {
        const collected = fees.reduce((sum: number, r: any) => sum + Number(r.amount_paid ?? 0), 0);
        const unpaid = fees.reduce((sum: number, r: any) => sum + Math.max(0, Number(r.total_fee ?? 0) - Number(r.amount_paid ?? 0)), 0);
        setTotalCollected(collected);
        setUnpaidBalance(unpaid);
      }

      if (tx) {
        const expenses = tx
          .filter((r: any) => (r.category ?? "Expenses") === "Expenses")
          .reduce((sum: number, r: any) => sum + Number(r.total_amount ?? 0), 0);
        setTotalExpenses(expenses);
      }

      if (inc) {
        setOtherIncome(inc.reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0));
      }
    };

    loadFinance();
  }, []);

  const recentActivities = [
    ...borrowRecords.slice(-3).reverse().map(r => ({
      action: r.status === "returned" ? "Book returned" : r.status === "overdue" ? "Book overdue" : "Book borrowed",
      detail: `${r.bookName} by ${r.borrowerName}`,
      time: r.borrowDate,
      type: r.status === "overdue" ? "alert" : "info" as string,
    })),
    ...stockMovements.slice(-2).reverse().map(m => ({
      action: m.type === "in" ? "Stock added" : "Stock removed",
      detail: `${m.quantity}x ${m.itemName}`,
      time: m.date,
      type: "info" as string,
    })),
    ...lowStockItems.map(i => ({
      action: "⚠️ Low Stock Alert",
      detail: `${i.name} — only ${i.quantity} left`,
      time: i.addedDate,
      type: "warning" as string,
    })),
    ...accounts.slice(-2).reverse().map(a => ({
      action: "Account created",
      detail: `${a.fullName} (${a.role.replace("_", " ")})`,
      time: a.createdAt,
      type: "info" as string,
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back, {user?.fullName}</h1>
        <p className="text-muted-foreground mt-1">Admin Dashboard - Overview of all system activities</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Books" value={books.length} icon={<BookOpen className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Students" value={students.length} icon={<GraduationCap className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
        <StatCard title="Teachers" value={teachers.length} icon={<Users className="w-5 h-5 text-warning-foreground" />} gradient="warm" />
        <StatCard title="Stock Items" value={stockItems.length} icon={<Package className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
      </div>

      {/* Finance Summary */}
      <div>
        <h2 className="text-base font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" /> Finance Overview
          <Link to="/admin/finance" className="ml-auto text-xs text-primary hover:underline">View details →</Link>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Collected" value={fmt(totalCollected)} icon={<DollarSign className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
          <StatCard title="Unpaid Balance" value={fmt(unpaidBalance)} icon={<Receipt className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
          <StatCard title="Total Expenses" value={fmt(totalExpenses)} icon={<TrendingDown className="w-5 h-5 text-warning-foreground" />} gradient="warm" />
          <StatCard title="Other Income" value={fmt(otherIncome)} icon={<Banknote className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-heading font-semibold text-destructive">Low Stock Alerts ({lowStockItems.length})</h3>
          </div>
          <div className="space-y-2">
            {lowStockItems.map(i => (
              <div key={i.id} className="flex items-center justify-between bg-card rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-card-foreground">{i.name}</span>
                <span className="text-sm text-destructive font-semibold">{i.quantity} remaining (min: {i.lowStockQty})</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-card border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold text-card-foreground">Recent Activity</h2>
          <Link to="/admin/notifications" className="text-xs text-primary hover:underline flex items-center gap-1">
            <Bell className="w-3 h-3" /> View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentActivities.slice(0, 8).map((a, i) => (
            <div key={i} className={`p-4 flex items-center justify-between hover:bg-muted/50 transition-colors ${a.type === "warning" ? "bg-destructive/5" : ""}`}>
              <div>
                <p className={`text-sm font-medium ${a.type === "warning" ? "text-destructive" : "text-card-foreground"}`}>{a.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{a.time}</span>
            </div>
          ))}
          {recentActivities.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">No recent activity</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
