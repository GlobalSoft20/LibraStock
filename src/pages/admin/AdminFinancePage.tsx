import { DollarSign, TrendingDown, Receipt, PiggyBank, Download, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import { downloadExcel, downloadWord, downloadPDF } from "@/lib/exportUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type StudentFeeRow = {
  receiptNo: string;
  studentName: string;
  studentNumber: string;
  class: string;
  department: string;
  level: string;
  term: string;
  academicYear: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  method: string;
  date: string;
  status: "Paid" | "Partial" | "Unpaid";
};

type ExpenseRow = {
  title: string;
  category: string;
  amount: string;
  date: string;
  description: string;
};

type OtherIncomeRow = {
  source: string;
  category: string;
  amount: string;
  date: string;
  description: string;
};

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Partial: "bg-warning/10 text-warning",
  Unpaid: "bg-destructive/10 text-destructive",
};

type ActiveView = "student-fees" | "expenses" | "other-income" | null;

function DownloadBar({ title, subtitle, columns, rows, filename }: {
  title: string; subtitle: string;
  columns: { header: string; key: string }[];
  rows: Record<string, string | number>[];
  filename: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-border mt-4">
      <span className="text-xs text-muted-foreground font-medium">Download:</span>
      <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5 h-8 text-xs"
        onClick={() => downloadPDF({ title, subtitle, columns, rows, filename })}>
        <Download className="w-3 h-3" /> PDF
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-success/50 text-success hover:bg-success/10"
        onClick={() => { downloadExcel({ title, subtitle, columns, rows, filename }); toast.success("Excel downloaded"); }}>
        <Download className="w-3 h-3" /> Excel
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-primary/50 text-primary hover:bg-primary/10"
        onClick={async () => { await downloadWord({ title, subtitle, columns, rows, filename }); toast.success("Word downloaded"); }}>
        <Download className="w-3 h-3" /> Word
      </Button>
    </div>
  );
}

export default function AdminFinancePage() {
  const [active, setActive] = useState<ActiveView>(null);
  const [feeFilter, setFeeFilter] = useState<"all" | "paid" | "unpaid">("all");

  const [studentFees, setStudentFees] = useState<StudentFeeRow[]>([]);
  const [expensesData, setExpensesData] = useState<ExpenseRow[]>([]);
  const [otherIncomeData, setOtherIncomeData] = useState<OtherIncomeRow[]>([]);

  const [totalCollected, setTotalCollected] = useState(0);
  const [unpaidBalance, setUnpaidBalance] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [otherIncomeTotal, setOtherIncomeTotal] = useState(0);

  const fmt = (n: number) => `${Math.round(n).toLocaleString()} FRW`;

  useEffect(() => {
    const load = async () => {
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

      if (feesErr) console.error("Failed to load student_fees:", feesErr);
      if (txErr) console.error("Failed to load external_transactions:", txErr);
      if (incErr) console.error("Failed to load other_incomes:", incErr);

      if (fees) {
        const mapped: StudentFeeRow[] = fees.map((r: any) => {
          const paid = Number(r.amount_paid ?? 0);
          const total = Number(r.total_fee ?? 0);
          const status: StudentFeeRow["status"] = paid >= total ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
          const balance = Math.max(0, total - paid);
          return {
            receiptNo: r.id,
            studentName: r.students?.full_name ?? "",
            studentNumber: r.students?.student_number ?? r.students?.id ?? "",
            class: r.students?.class ?? "",
            department: r.students?.department ?? "",
            level: r.students?.level ?? "",
            term: r.terms?.name ?? "",
            academicYear: r.academic_years?.name ?? "",
            totalFee: total,
            amountPaid: paid,
            balance,
            method: r.payment_method ?? "-",
            date: r.date ?? "",
            status,
          };
        });
        setStudentFees(mapped);
        setTotalCollected(mapped.reduce((sum, r) => sum + r.amountPaid, 0));
        setUnpaidBalance(mapped.reduce((sum, r) => sum + r.balance, 0));
      }

      if (tx) {
        const mappedExpenses: ExpenseRow[] = tx.map((r: any) => ({
          title: r.name ?? "",
          category: r.category ?? "Expenses",
          amount: `${Number(r.total_amount ?? 0).toLocaleString()} FRW`,
          date: r.date ?? "",
          description: r.reason ?? "",
        }));
        setExpensesData(mappedExpenses);
        setTotalExpenses(mappedExpenses
          .filter(r => (r.category ?? "Expenses") === "Expenses")
          .reduce((sum, r: any) => sum + Number(String(r.amount).replace(/[^0-9.-]+/g, "") || 0), 0));
      }

      if (inc) {
        const mappedIncome: OtherIncomeRow[] = inc.map((r: any) => ({
          source: r.source ?? "",
          category: r.category ?? "",
          amount: `${Number(r.amount ?? 0).toLocaleString()} FRW`,
          date: r.date ?? "",
          description: r.description ?? "",
        }));
        setOtherIncomeData(mappedIncome);
        setOtherIncomeTotal(mappedIncome.reduce((sum, r: any) => sum + Number(String(r.amount).replace(/[^0-9.-]+/g, "") || 0), 0));
      }
    };

    load();
  }, []);

  const paidStudents = useMemo(() => studentFees.filter(s => s.status === "Paid"), [studentFees]);
  const unpaidStudents = useMemo(() => studentFees.filter(s => s.status !== "Paid"), [studentFees]);
  const displayedFees = feeFilter === "paid" ? paidStudents : feeFilter === "unpaid" ? unpaidStudents : studentFees;

  const BUTTONS = [
    { id: "student-fees" as ActiveView, label: "Student Fees", icon: Receipt, bg: "bg-primary/10", text: "text-primary", border: "border-primary/30", activeBg: "gradient-primary", count: studentFees.length },
    { id: "expenses" as ActiveView, label: "Expenses", icon: TrendingDown, bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", activeBg: "bg-destructive", count: expensesData.length },
    { id: "other-income" as ActiveView, label: "Other Income", icon: PiggyBank, bg: "bg-success/10", text: "text-success", border: "border-success/30", activeBg: "bg-success", count: otherIncomeData.length },

  ];

  const feeColumns = [
    { header: "Receipt No", key: "receiptNo" }, { header: "Student Name", key: "studentName" },
    { header: "Student Number", key: "studentNumber" }, { header: "Department", key: "department" },
    { header: "Level", key: "level" }, { header: "Class", key: "class" },
    { header: "Academic Year", key: "academicYear" }, { header: "Term", key: "term" },
    { header: "Total Fee (FRW)", key: "totalFee" }, { header: "Amount Paid (FRW)", key: "amountPaid" },
    { header: "Balance (FRW)", key: "balance" }, { header: "Method", key: "method" },
    { header: "Date", key: "date" }, { header: "Status", key: "status" },
  ];
  const expenseColumns = [
    { header: "Title", key: "title" }, { header: "Category", key: "category" },
    { header: "Amount", key: "amount" }, { header: "Date", key: "date" }, { header: "Description", key: "description" },
  ];
  const incomeColumns = [
    { header: "Source", key: "source" }, { header: "Category", key: "category" },
    { header: "Amount", key: "amount" }, { header: "Date", key: "date" }, { header: "Description", key: "description" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Finance Overview</h1>
        <p className="text-muted-foreground mt-1">Admin view of all finance module activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Collected" value={fmt(totalCollected)} icon={<DollarSign className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
        <StatCard title="Unpaid Balance" value={fmt(unpaidBalance)} icon={<Receipt className="w-5 h-5 text-accent-foreground" />} gradient="accent" />
        <StatCard title="Total Expenses" value={fmt(totalExpenses)} icon={<TrendingDown className="w-5 h-5 text-warning-foreground" />} gradient="warm" />
        <StatCard title="Other Income" value={fmt(otherIncomeTotal)} icon={<PiggyBank className="w-5 h-5 text-primary-foreground" />} gradient="primary" />
      </div>

      {/* ── 4 horizontal buttons ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {BUTTONS.map(btn => {
          const isActive = active === btn.id && btn.id !== null;
          return (
            <motion.button
              key={btn.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setActive(active === btn.id ? null : btn.id);
                setFeeFilter("all");
              }}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all shadow-card hover:shadow-card-hover ${
                isActive
                  ? "border-primary bg-primary/5"
                  : `${btn.border} bg-card`
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? "gradient-primary" : btn.bg}`}>
                <btn.icon className={`w-6 h-6 ${isActive ? "text-primary-foreground" : btn.text}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-card-foreground"}`}>{btn.label}</p>
                {btn.count !== null && (
                  <p className="text-xs text-muted-foreground mt-0.5">{btn.count} records</p>
                )}
                {btn.isLink && (
                  <p className="text-xs text-muted-foreground mt-0.5">View reports →</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Content panel — only shown after clicking a button ───────────────── */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
          >
            {/* Panel header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-heading font-semibold text-card-foreground">
                {active === "student-fees" && "Student Fees"}
                {active === "expenses" && "Expenses"}
                {active === "other-income" && "Other Income Sources"}
              </h2>
              <button onClick={() => setActive(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {/* ── Student Fees ─────────────────────────────────────────────── */}
              {active === "student-fees" && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-success/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Fully Paid</p>
                      <p className="text-xl font-bold text-success">{paidStudents.length}</p>
                    </div>
                    <div className="bg-warning/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Partial</p>
                      <p className="text-xl font-bold text-warning">{studentFees.filter(s => s.status === "Partial").length}</p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Unpaid</p>
                      <p className="text-xl font-bold text-destructive">{studentFees.filter(s => s.status === "Unpaid").length}</p>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["all", "paid", "unpaid"] as const).map(f => (
                      <button key={f} onClick={() => setFeeFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          feeFilter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}>
                        {f === "all" ? `All (${studentFees.length})` : f === "paid" ? `Paid (${paidStudents.length})` : `Unpaid / Partial (${unpaidStudents.length})`}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Class</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Total Fee</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Paid</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Balance</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {displayedFees.map(s => (
                          <tr key={s.receiptNo} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <p className="font-medium text-card-foreground">{s.studentName}</p>
                              <p className="text-xs text-muted-foreground">{s.studentNumber}</p>
                            </td>
                            <td className="p-3 text-card-foreground">{s.class}</td>
                            <td className="p-3 text-card-foreground">{s.totalFee.toLocaleString()} FRW</td>
                            <td className="p-3 font-medium text-success">{s.amountPaid.toLocaleString()} FRW</td>
                            <td className="p-3 font-medium text-destructive">{s.balance.toLocaleString()} FRW</td>
                            <td className="p-3 text-muted-foreground">{s.method}</td>
                            <td className="p-3 text-muted-foreground">{s.date}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span></td>
                          </tr>
                        ))}
                        {displayedFees.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No records</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <DownloadBar
                    title={`Student Fee Payments — ${feeFilter === "all" ? "All" : feeFilter === "paid" ? "Paid" : "Unpaid/Partial"}`}
                    subtitle="Filtered student fee payments"
                    columns={feeColumns}
                    rows={displayedFees.map(s => ({ ...s, totalFee: `${s.totalFee.toLocaleString()} FRW`, amountPaid: `${s.amountPaid.toLocaleString()} FRW`, balance: `${s.balance.toLocaleString()} FRW` }))}
                    filename={`student_fees_${feeFilter}`}
                  />
                </div>
              )}

              {/* ── Expenses ─────────────────────────────────────────────────── */}
              {active === "expenses" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {expensesData.map((e, i) => (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium text-card-foreground">{e.title}</td>
                            <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">{e.category}</span></td>
                            <td className="p-3 font-semibold text-destructive">{e.amount}</td>
                            <td className="p-3 text-muted-foreground">{e.date}</td>
                            <td className="p-3 text-muted-foreground">{e.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <DownloadBar title="Expense Report" subtitle="All school expenses by category" columns={expenseColumns} rows={expensesData} filename="expenses_report" />
                </div>
              )}

              {/* ── Other Income ─────────────────────────────────────────────── */}
              {active === "other-income" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Source</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {otherIncomeData.map((r, i) => (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium text-card-foreground">{r.source}</td>
                            <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">{r.category}</span></td>
                            <td className="p-3 font-semibold text-success">{r.amount}</td>
                            <td className="p-3 text-muted-foreground">{r.date}</td>
                            <td className="p-3 text-muted-foreground">{r.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <DownloadBar title="Other Income Sources" subtitle="Additional school income beyond student fees" columns={incomeColumns} rows={otherIncomeData} filename="other_income_report" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
