import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, LayoutDashboard, Users, GraduationCap, Package,
  FileText, LogOut, Menu, Bell, Search, User, Settings,
  Sun, Moon, ArrowDownToLine, ArrowUpFromLine, Building2, UserPlus
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/admin" },
    { label: "Library", icon: <BookOpen className="w-5 h-5" />, path: "/admin/library" },
    { label: "Stock", icon: <Package className="w-5 h-5" />, path: "/admin/stock" },
    { label: "Accounts", icon: <UserPlus className="w-5 h-5" />, path: "/admin/accounts" },
    { label: "Reports", icon: <FileText className="w-5 h-5" />, path: "/admin/reports" },
    { label: "Notifications", icon: <Bell className="w-5 h-5" />, path: "/admin/notifications" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, path: "/admin/settings" },
  ],
  librarian: [
    { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/library" },
    { label: "School Info", icon: <Building2 className="w-5 h-5" />, path: "/library/school-info" },
    { label: "Books", icon: <BookOpen className="w-5 h-5" />, path: "/library/books" },
    { label: "Students", icon: <GraduationCap className="w-5 h-5" />, path: "/library/students" },
    { label: "Teachers", icon: <Users className="w-5 h-5" />, path: "/library/teachers" },
    { label: "Borrow", icon: <ArrowUpFromLine className="w-5 h-5" />, path: "/library/borrow" },
    { label: "Return", icon: <ArrowDownToLine className="w-5 h-5" />, path: "/library/return" },
    { label: "Reports", icon: <FileText className="w-5 h-5" />, path: "/library/reports" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, path: "/library/settings" },
  ],
  stock_manager: [
    { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/stock" },
    { label: "Items", icon: <Package className="w-5 h-5" />, path: "/stock/items" },
    { label: "Stock In", icon: <ArrowDownToLine className="w-5 h-5" />, path: "/stock/in" },
    { label: "Stock Out", icon: <ArrowUpFromLine className="w-5 h-5" />, path: "/stock/out" },
    { label: "Reports", icon: <FileText className="w-5 h-5" />, path: "/stock/reports" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, path: "/stock/settings" },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        {sidebarOpen && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-heading font-bold text-sidebar-foreground">
            LSMS
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.fullName}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role.replace("_", " ")}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={`hidden lg:flex flex-col bg-sidebar transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25 }} className="fixed inset-y-0 left-0 w-64 bg-sidebar z-50 lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (window.innerWidth < 1024) setMobileOpen(true); else setSidebarOpen(!sidebarOpen); }}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 w-72">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors text-foreground" title="Toggle dark mode">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
