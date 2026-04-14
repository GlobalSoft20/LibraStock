import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, BookOpen, Package, CheckCircle2, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  category: "library" | "stock" | "system";
  type: "warning" | "info" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { borrowRecords, stockItems, stockMovements, accounts } = useData();
  const { user } = useAuth();

  const autoNotifications = useMemo(() => {
    const notifs: Notification[] = [];

    // Overdue book alerts
    borrowRecords.filter(r => r.status === "overdue").forEach(r => {
      notifs.push({
        id: `overdue-${r.id}`,
        category: "library",
        type: "alert",
        title: "Overdue Book",
        message: `"${r.bookName}" borrowed by ${r.borrowerName} on ${r.borrowDate} is overdue.`,
        time: r.borrowDate,
        read: false,
      });
    });

    // Low stock alerts
    stockItems.filter(i => i.quantity <= i.lowStockQty).forEach(i => {
      notifs.push({
        id: `lowstock-${i.id}`,
        category: "stock",
        type: "warning",
        title: "Low Stock Alert",
        message: `"${i.name}" is running low — only ${i.quantity} left (threshold: ${i.lowStockQty}).`,
        time: i.addedDate,
        read: false,
      });
    });

    // Recent borrows
    borrowRecords.filter(r => r.status === "borrowed").slice(-3).forEach(r => {
      notifs.push({
        id: `borrow-${r.id}`,
        category: "library",
        type: "info",
        title: "Book Borrowed",
        message: `${r.borrowerName} borrowed "${r.bookName}" (Qty: ${r.quantity}) on ${r.borrowDate}.`,
        time: r.borrowDate,
        read: false,
      });
    });

    // Recent stock movements
    stockMovements.slice(-3).forEach(m => {
      notifs.push({
        id: `stock-${m.id}`,
        category: "stock",
        type: "info",
        title: m.type === "in" ? "Stock Added" : "Stock Removed",
        message: `${m.quantity}x "${m.itemName}" ${m.type === "in" ? `added by ${m.addedBy || "Unknown"}` : `taken by ${m.takenBy || "Unknown"}`} on ${m.date}.`,
        time: m.date,
        read: false,
      });
    });

    // New account created
    accounts.forEach(a => {
      notifs.push({
        id: `account-${a.id}`,
        category: "system",
        type: "info",
        title: "New Account Created",
        message: `${a.fullName} was added as ${a.role.replace("_", " ")} on ${a.createdAt}.`,
        time: a.createdAt,
        read: false,
      });
    });

    return notifs.sort((a, b) => b.time.localeCompare(a.time));
  }, [borrowRecords, stockItems, stockMovements, accounts]);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const visibleNotifs = autoNotifications
    .filter(n => {
      if (!user) return false;
      if (user.role === "admin") return true;
      if (user.role === "librarian") return n.category === "library";
      if (user.role === "stock_manager") return n.category === "stock";
      return false;
    })
    .filter(n => !dismissed.has(n.id));

  const unreadCount = visibleNotifs.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => setReadIds(new Set(autoNotifications.map(n => n.id)));
  const dismiss = (id: string) => setDismissed(prev => new Set(prev).add(id));
  const markRead = (id: string) => setReadIds(prev => new Set(prev).add(id));

  const iconMap = { warning: AlertTriangle, alert: BookOpen, info: Package };
  const colorMap = { warning: "text-warning bg-warning/10", alert: "text-destructive bg-destructive/10", info: "text-primary bg-primary/10" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
          </h1>
          <p className="text-muted-foreground mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={markAllRead} variant="outline" size="sm" className="gap-2">
            <CheckCircle2 className="w-4 h-4" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleNotifs.map(n => {
            const Icon = iconMap[n.type];
            const isRead = readIds.has(n.id);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className={`bg-card rounded-xl shadow-card border border-border p-4 flex items-start gap-4 transition-all ${!isRead ? "border-l-4 border-l-primary" : ""}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[n.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold text-card-foreground ${!isRead ? "" : "opacity-70"}`}>{n.title}</h3>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!isRead && (
                    <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Mark as read">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => dismiss(n.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Dismiss">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {visibleNotifs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
