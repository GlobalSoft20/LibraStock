import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import DashboardLayout from "./components/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLibraryPage from "./pages/admin/AdminLibraryPage";
import AdminStockPage from "./pages/admin/AdminStockPage";
import AdminAccountsPage from "./pages/admin/AdminAccountsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import LibraryDashboard from "./pages/library/LibraryDashboard";
import SchoolInfoPage from "./pages/library/SchoolInfoPage";
import BooksPage from "./pages/library/BooksPage";
import StudentsPage from "./pages/library/StudentsPage";
import TeachersPage from "./pages/library/TeachersPage";
import BorrowPage from "./pages/library/BorrowPage";
import ReturnPage from "./pages/library/ReturnPage";
import LibraryReportsPage from "./pages/library/LibraryReportsPage";
import StockDashboard from "./pages/stock/StockDashboard";
import StockItemsPage from "./pages/stock/StockItemsPage";
import StockInPage from "./pages/stock/StockInPage";
import StockOutPage from "./pages/stock/StockOutPage";
import StockReportsPage from "./pages/stock/StockReportsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const defaultPath = user ? (user.role === "admin" ? "/admin" : user.role === "librarian" ? "/library" : "/stock") : "/";

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Index />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <RegisterPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/library" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLibraryPage /></ProtectedRoute>} />
      <Route path="/admin/stock" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStockPage /></ProtectedRoute>} />
      <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAccountsPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReportsPage /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["admin"]}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><SettingsPage /></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute allowedRoles={["librarian"]}><LibraryDashboard /></ProtectedRoute>} />
      <Route path="/library/school-info" element={<ProtectedRoute allowedRoles={["librarian"]}><SchoolInfoPage /></ProtectedRoute>} />
      <Route path="/library/books" element={<ProtectedRoute allowedRoles={["librarian"]}><BooksPage /></ProtectedRoute>} />
      <Route path="/library/students" element={<ProtectedRoute allowedRoles={["librarian"]}><StudentsPage /></ProtectedRoute>} />
      <Route path="/library/teachers" element={<ProtectedRoute allowedRoles={["librarian"]}><TeachersPage /></ProtectedRoute>} />
      <Route path="/library/borrow" element={<ProtectedRoute allowedRoles={["librarian"]}><BorrowPage /></ProtectedRoute>} />
      <Route path="/library/return" element={<ProtectedRoute allowedRoles={["librarian"]}><ReturnPage /></ProtectedRoute>} />
      <Route path="/library/reports" element={<ProtectedRoute allowedRoles={["librarian"]}><LibraryReportsPage /></ProtectedRoute>} />
      <Route path="/library/notifications" element={<ProtectedRoute allowedRoles={["librarian"]}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/library/settings" element={<ProtectedRoute allowedRoles={["librarian"]}><SettingsPage /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute allowedRoles={["stock_manager"]}><StockDashboard /></ProtectedRoute>} />
      <Route path="/stock/items" element={<ProtectedRoute allowedRoles={["stock_manager"]}><StockItemsPage /></ProtectedRoute>} />
      <Route path="/stock/in" element={<ProtectedRoute allowedRoles={["stock_manager"]}><StockInPage /></ProtectedRoute>} />
      <Route path="/stock/out" element={<ProtectedRoute allowedRoles={["stock_manager"]}><StockOutPage /></ProtectedRoute>} />
      <Route path="/stock/reports" element={<ProtectedRoute allowedRoles={["stock_manager"]}><StockReportsPage /></ProtectedRoute>} />
      <Route path="/stock/notifications" element={<ProtectedRoute allowedRoles={["stock_manager"]}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/stock/settings" element={<ProtectedRoute allowedRoles={["stock_manager"]}><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DataProvider>
              <AppRoutes />
            </DataProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
