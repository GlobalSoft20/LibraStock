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
  register: (username: string, password: string, fullName: string, email: string, phone: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_USERS: Record<string, { password: string; user: User }> = {
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
  const [users, setUsers] = useState<Record<string, { password: string; user: User }>>(DEFAULT_USERS);

  const login = (username: string, password: string): boolean => {
    const found = users[username];
    if (found && found.password === password) {
      setUser(found.user);
      return true;
    }
    return false;
  };

  const register = (username: string, password: string, fullName: string, email: string, phone: string): boolean => {
    if (users[username]) return false;
    const newUser: User = {
      id: Date.now().toString(),
      username,
      fullName,
      email,
      phone,
      role: "admin",
    };
    setUsers(prev => ({ ...prev, [username]: { password, user: newUser } }));
    return true;
  };

  const logout = () => setUser(null);

  const updateUser = (updates: Partial<User>) => {
    if (user) setUser({ ...user, ...updates });
  };

  const changePassword = (oldPass: string, newPass: string): boolean => {
    if (user && users[user.username]?.password === oldPass) {
      setUsers(prev => ({ ...prev, [user.username]: { ...prev[user.username], password: newPass } }));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, updateUser, changePassword }}>
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
