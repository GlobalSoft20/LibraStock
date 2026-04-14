import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "librarian" | "stock_manager";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  emailConfirmed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  register: (email: string, password: string, fullName: string, phone: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (updates: Partial<User>) => void;
  changePassword: (newPass: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapSupabaseUser(su: SupabaseUser): User {
  const meta = su.user_metadata || {};
  return {
    id: su.id,
    username: meta.username || su.email || "",
    fullName: meta.full_name || "",
    email: su.email || "",
    phone: meta.phone || "",
    role: (meta.role as UserRole) || "admin",
    emailConfirmed: !!su.email_confirmed_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return { success: false, needsConfirmation: true, error: "Please confirm your email before signing in. Check your inbox." };
      }
      return { success: false, error: error.message };
    }
    if (data.user && !data.user.email_confirmed_at) {
      return { success: false, needsConfirmation: true, error: "Please confirm your email before signing in." };
    }
    return { success: true };
  };

  const register = async (email: string, password: string, fullName: string, phone: string, role: UserRole = "admin"): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          phone,
          role,
          username: email,
        },
      },
    });
    if (error) {
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes("already registered") || lowerMessage.includes("already exists") || lowerMessage.includes("duplicate")) {
        return { success: false, error: "This email is already registered. Please sign in or use a different email." };
      }
      return { success: false, error: error.message };
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: accountError } = await supabase.from("account_records").insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone,
        role,
      });
      if (accountError) {
        console.error("Failed to create account record:", accountError.message);
      }
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) setUser({ ...user, ...updates });
  };

  const changePassword = async (newPass: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    return !error;
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isAuthenticated: !!session && !!user?.emailConfirmed, isLoading, updateUser, changePassword }}>
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
