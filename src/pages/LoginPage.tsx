import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Lock, User, ArrowRight } from "lucide-react";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import studentBg from "@/assets/student.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        const role = username === "admin" ? "admin" : username === "librarian" ? "librarian" : "stock_manager";
        navigate(getRoleDashboard(role));
      } else {
        setError("Invalid username or password");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img src={studentBg} alt="Students" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/60" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4">Library & Stock<br />Management System</h1>
          <p className="text-primary-foreground/80 text-lg max-w-md mx-auto">A centralized platform for managing school library books, students, teachers, and stock inventory.</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">LSMS</h2>
          </div>
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" className="pl-10 h-12 bg-secondary border-border" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="pl-10 h-12 bg-secondary border-border" required />
              </div>
            </div>
            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm font-medium">{error}</motion.p>}
            <Button type="submit" disabled={loading} className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3">Demo Credentials</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p><span className="font-semibold text-foreground">Admin:</span> admin / admin123</p>
              <p><span className="font-semibold text-foreground">Librarian:</span> librarian / lib123</p>
              <p><span className="font-semibold text-foreground">Stock Manager:</span> stockmgr / stock123</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
