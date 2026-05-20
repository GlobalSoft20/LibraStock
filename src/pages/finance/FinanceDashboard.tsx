import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Users, Receipt } from "lucide-react";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type RecentTransaction = {
  paidTo: string;
  amount: number;
  date: string;
  category: string;
};

const initialRecentTransactions: RecentTransaction[] = [];

export default function FinanceDashboard() {
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>(initialRecentTransactions);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalExpected, setTotalExpected] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [todayCollected, setTodayCollected] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const loadFinanceData = async () => {
      const { data, error } = await supabase
        .from("student_fees")
        .select(`id, total_fee, amount_paid, payment_method, date, students(full_name)`)
        .order("date", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to load student fees:", error);
        return;
      }

      const transactions = (data || []).map((row: any) => {
        const paid = Number(row.amount_paid ?? 0);
        const total = Number(row.total_fee ?? 0);
        const status = paid >= total ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
        return {
          id: row.id,
          student: row.students?.full_name ?? "Unknown",
          amount: paid,
          method: row.payment_method || "-",
          date: row.date ? new Date(row.date).toISOString().split("T")[0] : "-",
          status,
        };
      });

      setRecentTransactions(transactions);
      setTotalCollected(transactions.reduce((sum, item) => sum + item.amount, 0));
      setTotalExpected((data || []).reduce((sum: number, row: any) => sum + Number(row.total_fee ?? 0), 0));
      setTotalUnpaid((data || []).reduce((sum: number, row: any) => sum + Math.max(0, Number(row.total_fee ?? 0) - Number(row.amount_paid ?? 0)), 0));
      const today = new Date().toISOString().split("T")[0];
      setTodayCollected((data || []).reduce((sum: number, row: any) => sum + ((row.date === today) ? Number(row.amount_paid ?? 0) : 0), 0));
      setPendingPaymentsCount((data || []).filter((row: any) => Number(row.amount_paid ?? 0) < Number(row.total_fee ?? 0)).length);

      // Recent external transactions (receipt_no)
      const { data: extTx, error: extErr } = await supabase
        .from("external_transactions")
        .select("receipt_no,name,total_amount,category,date")
        .order("date", { ascending: false })
        .limit(10);

      if (extErr) {
        console.error("Failed to load external transactions:", extErr);
        return;
      }

      setRecentTransactions((extTx || []).map((r: any) => ({
        paidTo: r.name ?? "",
        amount: Number(r.total_amount ?? 0),
        date: r.date ? new Date(r.date).toISOString().split("T")[0] : "-",
        category: r.category ?? "Expenses",
      })));
    };

    loadFinanceData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back, {user?.fullName}</h1>
        <p className="text-muted-foreground mt-1">Finance Dashboard — Academic Year 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Collected" value={`${totalCollected.toLocaleString()} FRW`} icon={<DollarSign className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Expected Fees" value={`${totalExpected.toLocaleString()} FRW`} icon={<TrendingUp className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
        <StatCard title="Unpaid Balance" value={`${totalUnpaid.toLocaleString()} FRW`} icon={<AlertCircle className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Total Expenses" value="450,000 FRW" icon={<TrendingDown className="w-5 h-5 text-accent-foreground" />} gradient="warm" />
        <StatCard title="Today's Collections" value={`${todayCollected.toLocaleString()} FRW`} icon={<Receipt className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Pending Payments" value={`${pendingPaymentsCount}`} icon={<Users className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading font-semibold text-card-foreground">Fee Collection Summary</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Collected", value: totalCollected, total: totalExpected || 1, color: "bg-success" },
              { label: "Pending", value: totalUnpaid, total: totalExpected || 1, color: "bg-warning" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-card-foreground">{(item.value / 1000).toFixed(0)}K FRW</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.value / item.total) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Total Income</p><p className="font-semibold text-success">{totalCollected.toLocaleString()} FRW</p></div>
              <div><p className="text-muted-foreground">Total Expenses</p><p className="font-semibold text-destructive">450,000 FRW</p></div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Recent Transactions</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Paid To</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {recentTransactions.map(t => (
                  <tr key={`${t.paidTo}-${t.date}-${t.amount}`} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-card-foreground">{t.paidTo}</td>
                    <td className="p-3 text-card-foreground">{t.amount.toLocaleString()} FRW</td>
                    <td className="p-3 text-muted-foreground">{t.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
