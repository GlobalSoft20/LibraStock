import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Phone } from "lucide-react";
import { toast } from "sonner";

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

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    const success = changePassword(oldPassword, newPassword);
    if (success) {
      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error("Current password is incorrect");
    }
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
    </div>
  );
}
