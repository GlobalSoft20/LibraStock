import { BookOpen, Users, Package, GraduationCap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { books, students, teachers, stockItems, borrowRecords, stockMovements } = useData();
  const recentActivities = [
    ...borrowRecords.slice(-3).reverse().map(r => ({ action: r.status === "returned" ? "Book returned" : "Book borrowed", detail: `${r.bookName} by ${r.borrowerName}`, time: r.borrowDate })),
    ...stockMovements.slice(-2).reverse().map(m => ({ action: m.type === "in" ? "Stock added" : "Stock removed", detail: `${m.quantity}x ${m.itemName}`, time: m.date })),
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-card border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold text-card-foreground">Recent Activity</h2>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {recentActivities.map((a, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div><p className="text-sm font-medium text-card-foreground">{a.action}</p><p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p></div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{a.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
