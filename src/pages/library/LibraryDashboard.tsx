import { BookOpen, GraduationCap, Users, ArrowRightLeft, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

export default function LibraryDashboard() {
  const { user } = useAuth();
  const { books, students, teachers, borrowRecords } = useData();
  const borrowed = borrowRecords.filter(r => r.status === "borrowed");
  const returned = borrowRecords.filter(r => r.status === "returned");
  const overdue = borrowRecords.filter(r => r.status === "overdue");
  const totalAvailable = books.reduce((sum, b) => sum + b.availableCopy, 0);
  const recentBorrowed = [...borrowRecords].filter(r => r.status === "borrowed").slice(-5).reverse();
  const recentReturned = [...borrowRecords].filter(r => r.status === "returned").slice(-5).reverse();

  const statusColors: Record<string, string> = {
    borrowed: "bg-info/10 text-info",
    returned: "bg-success/10 text-success",
    overdue: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back, {user?.email || user?.fullName}</h1>
        <p className="text-muted-foreground mt-1">Library Management Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Borrowed" value={borrowed.length} icon={<ArrowRightLeft className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Available Books" value={totalAvailable} icon={<BookOpen className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
        <StatCard title="Returned" value={returned.length} icon={<GraduationCap className="w-5 h-5 text-warning-foreground" />} gradient="warm" />
        <StatCard title="Overdue Alerts" value={overdue.length} icon={<AlertTriangle className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-card border border-border">
          <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Recent Borrowed</h2></div>
          <div className="divide-y divide-border">
            {recentBorrowed.length === 0 && <p className="p-4 text-sm text-muted-foreground">No recent borrows</p>}
            {recentBorrowed.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{r.borrowerName}</p>
                  <p className="text-xs text-muted-foreground">{r.bookName} • {r.borrowDate}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl shadow-card border border-border">
          <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">Recent Returned</h2></div>
          <div className="divide-y divide-border">
            {recentReturned.length === 0 && <p className="p-4 text-sm text-muted-foreground">No recent returns</p>}
            {recentReturned.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{r.borrowerName}</p>
                  <p className="text-xs text-muted-foreground">{r.bookName} • {r.returnDate}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-xl shadow-card border border-border">
        <div className="p-5 border-b border-border"><h2 className="font-heading font-semibold text-card-foreground">System Activity</h2></div>
        <div className="divide-y divide-border">
          {borrowRecords.slice(-5).reverse().map(r => (
            <div key={r.id} className="p-4 hover:bg-muted/50 transition-colors">
              <p className="text-sm text-card-foreground"><span className="font-medium">{r.borrowerName}</span> {r.status === "returned" ? "returned" : "borrowed"} <span className="font-medium">{r.bookName}</span></p>
              <p className="text-xs text-muted-foreground">{r.status === "returned" ? r.returnDate : r.borrowDate}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
