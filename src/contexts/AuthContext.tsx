import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "librarian" | "stock_manager";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: { id: "1", username: "admin", fullName: "System Administrator", email: "admin@lsms.com", phone: "+255700000000", role: "admin" },
  },
  librarian: {
    password: "lib123",
    user: { id: "2", username: "librarian", fullName: "Jane Librarian", email: "jane@lsms.com", phone: "+255711111111", role: "librarian" },
  },
  stockmgr: {
    password: "stock123",
    user: { id: "3", username: "stockmgr", fullName: "John Stock", email: "john@lsms.com", phone: "+255722222222", role: "stock_manager" },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [passwords, setPasswords] = useState<Record<string, string>>({
    admin: "admin123", librarian: "lib123", stockmgr: "stock123",
  });

  const login = (username: string, password: string): boolean => {
    const found = MOCK_USERS[username];
    if (found && passwords[username] === password) {
      setUser(found.user);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const updateUser = (updates: Partial<User>) => {
    if (user) setUser({ ...user, ...updates });
  };

  const changePassword = (oldPass: string, newPass: string): boolean => {
    if (user && passwords[user.username] === oldPass) {
      setPasswords(p => ({ ...p, [user.username]: newPass }));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, updateUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case "admin": return "/admin";
    case "librarian": return "/library";
    case "stock_manager": return "/stock";
  }
}
