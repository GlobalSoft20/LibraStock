import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Users, BookOpen, Package, TrendingUp,
  GraduationCap, Calendar, DollarSign, TrendingDown, Receipt,
  ChevronLeft, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { downloadExcel, downloadWord, downloadPDF } from "@/lib/exportUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type FinancePaymentRow = {
  receiptNo: string;
  studentName: string;
  studentNumber: string;
  department: string;
  level: string;
  class: string;
  academicYear: string;
  term: string;
  totalFee: string;
  amountPaid: string;
  balance: string;
  method: string;
  date: string;
  status: string;
};

type FinanceExpenseRow = {
  title: string;
  category: string;
  amount: string;
  date: string;
  description: string;
};

type FinanceOtherIncomeRow = {
  source: string;
  category: string;
  amount: string;
  date: string;
  description: string;
};

type Department = "library" | "stock" | "finance";

const DEPARTMENTS = [
  {
    id: "library" as Department,
    label: "Library",
    description: "Students, teachers, books and borrow records",
    icon: BookOpen,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    activeBg: "bg-primary",
    reports: 3,
  },
  {
    id: "stock" as Department,
    label: "Stock",
    description: "Inventory, stock in/out and supplier records",
    icon: Package,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    activeBg: "bg-warning",
    reports: 3,
  },
  {
    id: "finance" as Department,
    label: "Finance",
    description: "Fee payments, expenses, payroll and income",
    icon: DollarSign,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    activeBg: "bg-success",
    reports: 4,
  },
];

export default function AdminReportsPage() {
  const { accounts, students, teachers, borrowRecords, stockItems, stockMovements } = useData();
  const [selected, setSelected] = useState<Department | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [financePayments, setFinancePayments] = useState<FinancePaymentRow[]>([]);
  const [financeExpenses, setFinanceExpenses] = useState<FinanceExpenseRow[]>([]);
  const [financeOtherIncome, setFinanceOtherIncome] = useState<FinanceOtherIncomeRow[]>([]);

  const inDateRange = (date: string) => {
    if (!date) return true;
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  };

  useEffect(() => {
    const loadFinance = async () => {
      const [{ data: fees, error: feesErr }, { data: tx, error: txErr }, { data: inc, error: incErr }] = await Promise.all([
        supabase
          .from("student_fees")
          .select(`id,total_fee,amount_paid,payment_method,date,students(full_name,student_number,id,department,level,class),academic_years(name),terms(name)`)
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("external_transactions")
          .select("name,category,total_amount,reason,date")
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("other_incomes")
          .select("source,category,amount,date,description")
          .order("date", { ascending: false })
          .limit(2000),
      ]);

      if (feesErr) console.error("Failed to load finance payments:", feesErr);
      if (txErr) console.error("Failed to load finance expenses:", txErr);
      if (incErr) console.error("Failed to load finance other income:", incErr);

      if (fees) {
        setFinancePayments(
          fees
            .filter((r: any) => inDateRange(r.date ?? ""))
            .map((r: any) => {
              const total = Number(r.total_fee ?? 0);
              const paid = Number(r.amount_paid ?? 0);
              const balance = Math.max(0, total - paid);
              const status = paid >= total ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
              return {
                receiptNo: r.id,
                studentName: r.students?.full_name ?? "",
                studentNumber: r.students?.student_number ?? r.students?.id ?? "",
                department: r.students?.department ?? "",
                level: r.students?.level ?? "",
                class: r.students?.class ?? "",
                academicYear: r.academic_years?.name ?? "",
                term: r.terms?.name ?? "",
                totalFee: `${total.toLocaleString()} FRW`,
                amountPaid: `${paid.toLocaleString()} FRW`,
                balance: `${balance.toLocaleString()} FRW`,
                method: r.payment_method ?? "-",
                date: r.date ?? "",
                status,
              };
            })
        );
      }

      if (tx) {
        setFinanceExpenses(
          tx
            .filter((r: any) => inDateRange(r.date ?? ""))
            .map((r: any) => ({
              title: r.name ?? "",
              category: r.category ?? "Expenses",
              amount: `${Number(r.total_amount ?? 0).toLocaleString()} FRW`,
              date: r.date ?? "",
              description: r.reason ?? "",
            }))
        );
      }

      if (inc) {
        setFinanceOtherIncome(
          inc
            .filter((r: any) => inDateRange(r.date ?? ""))
            .map((r: any) => ({
              source: r.source ?? "",
              category: r.category ?? "",
              amount: `${Number(r.amount ?? 0).toLocaleString()} FRW`,
              date: r.date ?? "",
              description: r.description ?? "",
            }))
        );
      }
    };

    loadFinance();
    // re-run when date filters change so exports match range
  }, [dateFrom, dateTo]);

  // ── All report definitions grouped by department ───────────────────────────
  const allReports: Record<Department, { title: string; subtitle: string; icon: any; columns: { header: string; key: string }[]; rows: Record<string, string | number>[]; filename: string }[]> = {
    library: [
      {
        title: "Students Report", subtitle: "All registered student records",
        icon: GraduationCap,
        columns: [{ header: "ID", key: "id" }, { header: "Full Name", key: "fullName" }, { header: "Department", key: "department" }, { header: "Level", key: "level" }, { header: "Class", key: "class" }],
        rows: students,
        filename: "students_report",
      },
      {
        title: "Teachers Report", subtitle: "All registered teacher records",
        icon: Users,
        columns: [{ header: "ID", key: "id" }, { header: "Full Name", key: "fullName" }, { header: "Email", key: "email" }, { header: "Phone", key: "phone" }, { header: "Subject", key: "subject" }],
        rows: teachers,
        filename: "teachers_report",
      },
      {
        title: "Borrow Records", subtitle: "Library borrow and return history",
        icon: BookOpen,
        columns: [{ header: "Book", key: "bookName" }, { header: "Borrower", key: "borrowerName" }, { header: "Type", key: "borrowerType" }, { header: "Qty", key: "quantity" }, { header: "Borrow Date", key: "borrowDate" }, { header: "Return Date", key: "returnDate" }, { header: "Status", key: "status" }],
        rows: borrowRecords.filter(r => inDateRange(r.borrowDate)).map(r => ({ ...r, returnDate: r.returnDate || "-" })),
        filename: "borrow_records",
      },
    ],
    stock: [
      {
        title: "Stock Inventory", subtitle: "Current stock levels and low stock alerts",
        icon: Package,
        columns: [{ header: "Item", key: "name" }, { header: "Quantity", key: "quantity" }, { header: "Low Stock Threshold", key: "lowStockQty" }, { header: "Status", key: "stockStatus" }, { header: "Added Date", key: "addedDate" }],
        rows: stockItems.map(i => ({ ...i, stockStatus: i.quantity <= i.lowStockQty ? "LOW" : "OK" })),
        filename: "stock_inventory",
      },
      {
        title: "Stock In Report", subtitle: "All stock received from suppliers",
        icon: TrendingUp,
        columns: [{ header: "Item", key: "itemName" }, { header: "Qty", key: "quantity" }, { header: "Supplier", key: "supplierName" }, { header: "Price/Unit", key: "pricePerUnit" }, { header: "Date", key: "date" }, { header: "Added By", key: "addedBy" }],
        rows: stockMovements.filter(m => m.type === "in" && inDateRange(m.date)).map(m => ({ ...m, supplierName: m.supplierName || "-", pricePerUnit: m.pricePerUnit || "-", addedBy: m.addedBy || "-" })),
        filename: "stock_in",
      },
      {
        title: "Stock Out Report", subtitle: "All stock issued to individuals",
        icon: TrendingDown,
        columns: [{ header: "Item", key: "itemName" }, { header: "Qty", key: "quantity" }, { header: "Taken By", key: "takenBy" }, { header: "Date", key: "date" }, { header: "Added By", key: "addedBy" }],
        rows: stockMovements.filter(m => m.type === "out" && inDateRange(m.date)).map(m => ({ ...m, takenBy: m.takenBy || "-", addedBy: m.addedBy || "-" })),
        filename: "stock_out",
      },
    ],
    finance: [
      {
        title: "Student Fee Payments", subtitle: "All student fee payment records",
        icon: Receipt,
        columns: [
          { header: "Receipt No", key: "receiptNo" },
          { header: "Student", key: "studentName" },
          { header: "Student Number", key: "studentNumber" },
          { header: "Department", key: "department" },
          { header: "Level", key: "level" },
          { header: "Class", key: "class" },
          { header: "Academic Year", key: "academicYear" },
          { header: "Term", key: "term" },
          { header: "Total Fee", key: "totalFee" },
          { header: "Paid", key: "amountPaid" },
          { header: "Balance", key: "balance" },
          { header: "Method", key: "method" },
          { header: "Date", key: "date" },
          { header: "Status", key: "status" },
        ],
        rows: financePayments,
        filename: "student_fee_payments",
      },
      {
        title: "Expense Report", subtitle: "All school expenses by category",
        icon: TrendingDown,
        columns: [{ header: "Title", key: "title" }, { header: "Category", key: "category" }, { header: "Amount", key: "amount" }, { header: "Date", key: "date" }, { header: "Description", key: "description" }],
        rows: financeExpenses,
        filename: "expenses_report",
      },
      {
        title: "Staff Payroll", subtitle: "Not configured (no payroll table found)",
        icon: Users,
        columns: [{ header: "Staff Name", key: "staffName" }, { header: "Position", key: "position" }, { header: "Salary", key: "salary" }, { header: "Payment Date", key: "paymentDate" }, { header: "Status", key: "status" }],
        rows: [],
        filename: "payroll_report",
      },
      {
        title: "Other Income Sources", subtitle: "Additional school income beyond fees",
        icon: DollarSign,
        columns: [{ header: "Source", key: "source" }, { header: "Category", key: "category" }, { header: "Amount", key: "amount" }, { header: "Date", key: "date" }, { header: "Description", key: "description" }],
        rows: financeOtherIncome,
        filename: "other_income_report",
      },
    ],
  };

  const currentDept = DEPARTMENTS.find(d => d.id === selected);
  const currentReports = selected ? allReports[selected] : [];

  function makeExport(r: typeof currentReports[0]) {
    return {
      pdf: () => downloadPDF({ title: r.title, subtitle: r.subtitle, columns: r.columns, rows: r.rows, filename: r.filename }),
      excel: () => { downloadExcel({ title: r.title, subtitle: r.subtitle, columns: r.columns, rows: r.rows, filename: r.filename }); toast.success(`${r.title} — Excel downloaded`); },
      word: async () => { await downloadWord({ title: r.title, subtitle: r.subtitle, columns: r.columns, rows: r.rows, filename: r.filename }); toast.success(`${r.title} — Word downloaded`); },
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {selected && (
          <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {selected ? `${currentDept?.label} Reports` : "Admin Reports"}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {selected ? `Download ${currentDept?.label.toLowerCase()} documents as PDF, Excel or Word` : "Select a department to view and download its reports"}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Department selection ─────────────────────────────────── */}
        {!selected && (
          <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Choose a department</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {DEPARTMENTS.map(dept => (
                <motion.button
                  key={dept.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(dept.id)}
                  className={`bg-card rounded-2xl shadow-card border ${dept.border} p-6 text-left space-y-4 hover:shadow-card-hover transition-all group`}
                >
                  <div className={`w-14 h-14 rounded-xl ${dept.bg} flex items-center justify-center`}>
                    <dept.icon className={`w-7 h-7 ${dept.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-bold text-card-foreground">{dept.label}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${dept.bg} ${dept.color}`}>
                      {dept.reports} reports available
                    </span>
                    <ArrowRight className={`w-4 h-4 ${dept.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Reports for selected department ───────────────────────── */}
        {selected && (
          <motion.div key="reports" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">

            {/* Date filter */}
            <div className="bg-card rounded-xl shadow-card border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">Filter by date range</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">From Date</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To Date</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-secondary border-border" />
                </div>
              </div>
            </div>

            {/* Report cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentReports.map((r, idx) => {
                const exp = makeExport(r);
                return (
                  <motion.div
                    key={r.filename}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${currentDept?.bg} flex items-center justify-center flex-shrink-0`}>
                        <r.icon className={`w-5 h-5 ${currentDept?.color}`} />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-card-foreground">{r.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</p>
                      </div>
                    </div>

                    {/* Preview table */}
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`${currentDept?.bg} border-b border-border`}>
                            {r.columns.slice(0, 4).map(c => (
                              <th key={c.key} className={`text-left px-3 py-2 font-semibold ${currentDept?.color}`}>{c.header}</th>
                            ))}
                            {r.columns.length > 4 && (
                              <th className="px-3 py-2 text-muted-foreground">+{r.columns.length - 4} more</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {r.rows.slice(0, 3).map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                              {r.columns.slice(0, 4).map(c => (
                                <td key={c.key} className="px-3 py-2 text-card-foreground truncate max-w-[90px]">
                                  {String(row[c.key] ?? "")}
                                </td>
                              ))}
                              {r.columns.length > 4 && <td className="px-3 py-2 text-muted-foreground">...</td>}
                            </tr>
                          ))}
                          {r.rows.length === 0 && (
                            <tr><td colSpan={5} className="px-3 py-3 text-center text-muted-foreground">No data available</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Row count */}
                    <p className="text-xs text-muted-foreground">{r.rows.length} record{r.rows.length !== 1 ? "s" : ""} found</p>

                    {/* Download buttons */}
                    <div className="flex gap-2 flex-wrap pt-1 border-t border-border">
                      <Button onClick={exp.pdf} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                      <Button onClick={exp.excel} size="sm" variant="outline" className="gap-1.5 border-success/50 text-success hover:bg-success/10">
                        <Download className="w-3.5 h-3.5" /> Excel
                      </Button>
                      <Button onClick={exp.word} size="sm" variant="outline" className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10">
                        <Download className="w-3.5 h-3.5" /> Word
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Back button at bottom */}
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to departments
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
