import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { user, updateUser, changePassword } = useAuth();
  const [phone, setPhone] = useState(user?.phone || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) return null;

  const handleUpdatePhone = () => {
    updateUser({ phone });
    toast.success("Phone number updated successfully");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    const success = await changePassword(newPassword);
    if (success) {
      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error("Current password is incorrect");
    }
  };

  // Academic year management
  const { academicYears, setAcademicYears, terms, setTerms, refreshData } = useData();
  const [newAY, setNewAY] = useState("");

  const createAcademicYear = async () => {
    if (!newAY.trim()) { toast.error("Enter academic year name"); return; }
    // set existing years is_current = false
    await supabase.from("academic_years").update({ is_current: false }).neq("name", "");
    const { data, error } = await supabase.from("academic_years").insert({ name: newAY.trim(), is_current: true }).select().single();
    if (error || !data) { toast.error("Failed to create academic year"); console.error(error); return; }
    const ayId = data.id;
    // create three terms by default
    const termRows = [1,2,3].map(n => ({ academic_year_id: ayId, term_number: n, name: `Term ${n}`, is_current: n === 1 }));
    const { error: termsErr } = await supabase.from("terms").insert(termRows);
    if (termsErr) { toast.error("Academic year created but failed to create terms"); console.error(termsErr); }
    else toast.success("Academic year and 3 terms created");
    setNewAY("");
    await refreshData();
  };

  const setCurrentTerm = async (termId: string, ayId: string) => {
    // unset other terms for this academic year
    await supabase.from("terms").update({ is_current: false }).eq("academic_year_id", ayId);
    const { error } = await supabase.from("terms").update({ is_current: true }).eq("id", termId);
    if (error) { toast.error("Failed to set current term"); console.error(error); return; }
    toast.success("Current term updated");
    await refreshData();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><User className="w-5 h-5" /> Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Full Name</Label>
            <p className="text-foreground font-medium">{user.fullName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Email</Label>
            <p className="text-foreground font-medium">{user.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Role</Label>
            <p className="text-foreground font-medium capitalize">{user.role.replace("_", " ")}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><Phone className="w-5 h-5" /> Phone Number</h2>
        <div className="flex gap-3">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="bg-secondary border-border max-w-xs" />
          <Button onClick={handleUpdatePhone} className="gradient-primary text-primary-foreground">Update</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-xs">
          <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Current password" className="bg-secondary border-border" required />
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="bg-secondary border-border" required />
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="bg-secondary border-border" required />
          <Button type="submit" className="gradient-primary text-primary-foreground">Change Password</Button>
        </form>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-card-foreground">Academic Year & Terms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Academic Year Name</Label>
            <Input value={newAY} onChange={e => setNewAY(e.target.value)} placeholder="e.g. 2026-2027" className="bg-secondary border-border" />
          </div>
          <div />
          <div className="flex gap-2">
            <Button onClick={createAcademicYear} className="gradient-primary text-primary-foreground">Create Academic Year (auto-create 3 terms)</Button>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Existing Academic Years</h3>
          <div className="space-y-2 mt-2">
            {academicYears.length === 0 && <p className="text-sm text-muted-foreground">No academic years defined</p>}
            {academicYears.map(ay => (
              <div key={ay.id} className="p-3 rounded-lg border border-border bg-secondary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ay.name} {ay.isCurrent ? <span className="text-xs text-success ml-2">(Current)</span> : null}</p>
                    <div className="text-xs text-muted-foreground">Terms:</div>
                    <div className="flex gap-2 mt-1">
                      {terms.filter(t => t.academicYearId === ay.id).map(t => (
                        <button key={t.id} onClick={() => setCurrentTerm(t.id, ay.id)} className={`px-2 py-1 rounded text-sm ${t.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {t.name}{t.isCurrent ? " (current)" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
