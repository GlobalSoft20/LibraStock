import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import studentBg from "@/assets/student.png";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await register(email, password, fullName, phone, "admin");
    setLoading(false);
    if (result.success) {
      toast.success("Account created! Please check your email to confirm.");
      navigate("/confirm-email");
    } else {
      toast.error(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={studentBg} alt="Students" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/20" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-2xl font-heading font-bold">LSMS</span>
            </div>
            <h1 className="text-4xl font-heading font-bold mb-4">Create Admin Account</h1>
            <p className="text-lg opacity-90">Register a new administrator account to manage the system.</p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">LSMS</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-card border border-border p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-heading font-bold text-card-foreground">Register Admin</h2>
              <p className="text-sm text-muted-foreground mt-1">Create a new admin account</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div><Label className="text-foreground">Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter full name" className="bg-secondary border-border" /></div>
              <div><Label className="text-foreground">Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" className="bg-secondary border-border" /></div>
              <div><Label className="text-foreground">Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" className="bg-secondary border-border" /></div>
              <div className="relative">
                <Label className="text-foreground">Password *</Label>
                <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="bg-secondary border-border pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div><Label className="text-foreground">Confirm Password *</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="bg-secondary border-border" /></div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
                {loading ? "Creating..." : "Create Admin Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
