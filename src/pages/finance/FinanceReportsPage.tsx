import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, DollarSign, TrendingDown, Users, Receipt, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadExcel, downloadWord, downloadPDF } from "@/lib/exportUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  Paid:    "bg-success/10 text-success",
  Partial: "bg-warning/10 text-warning",
  Unpaid:  "bg-destructive/10 text-destructive",
};

const FEE_COLUMNS = [
  { header: "Student Number", key: "studentNumber" }, { header: "Student Name", key: "studentName" },
  { header: "Department", key: "department" }, { header: "Level", key: "level" },
  { header: "Class", key: "class" }, { header: "Term", key: "term" },
  { header: "Academic Year", key: "academicYear" }, { header: "Total Fee", key: "totalFee" },
  { header: "Amount Paid", key: "amountPaid" }, { header: "Balance", key: "balance" },
  { header: "Method", key: "method" }, { header: "Date", key: "date" }, { header: "Status", key: "status" },
];

// ── Reusable download bar ──────────────────────────────────────────────────────
function DownloadBar({ title, subtitle, columns, rows, filename }: {
  title: string; subtitle: string;
  columns: { header: string; key: string }[];
  rows: Record<string, string | number>[];
  filename: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-border">
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

// ── Collapsible other report card ─────────────────────────────────────────────
function ReportCard({ title, subtitle, icon: Icon, columns, rows, filename }: {
  title: string; subtitle: string; icon: any;
  columns: { header: string; key: string }[];
  rows: Record<string, string | number>[];
  filename: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-heading font-semibold text-card-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead><tr className="bg-primary/10 border-b border-border">
                    {columns.slice(0, 5).map(c => <th key={c.key} className="text-left px-3 py-2 font-semibold text-primary">{c.header}</th>)}
                    {columns.length > 5 && <th className="px-3 py-2 text-muted-foreground">+{columns.length - 5} more</th>}
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 4).map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                        {columns.slice(0, 5).map(c => <td key={c.key} className="px-3 py-2 text-card-foreground truncate max-w-[100px]">{String(row[c.key] ?? "")}</td>)}
                        {columns.length > 5 && <td className="px-3 py-2 text-muted-foreground">...</td>}
                      </tr>
                    ))}
                    {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-3 text-center text-muted-foreground">No data</td></tr>}
                  </tbody>
                </table>
              </div>
              <DownloadBar title={title} subtitle={subtitle} columns={columns} rows={rows} filename={filename} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function FinanceReportsPage() {
  // Student fee report filters
  const [dept, setDept]     = useState("");
  const [level, setLevel]   = useState("");
  const [cls, setCls]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Paid" | "Partial" | "Unpaid">("all");
  const [feeOpen, setFeeOpen] = useState(false);

  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [feeStructureData, setFeeStructureData] = useState<any[]>([]);
  const [otherIncomeData, setOtherIncomeData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      // student fees with student details, academic year and term
      const { data: fees, error: feesError } = await supabase
        .from("student_fees")
        .select(`id, total_fee, amount_paid, payment_method, date, students(id, full_name, student_number, department, level, class), academic_years(name), terms(name)`)
        .order("date", { ascending: false })
        .limit(500);
      if (!feesError && fees) {
        setStudentsData(fees.map((r: any) => ({
          studentNumber: r.students?.student_number ?? r.students?.id ?? "",
          studentName: r.students?.full_name ?? "",
          department: r.students?.department ?? "",
          level: r.students?.level ?? "",
          class: r.students?.class ?? "",
          term: r.terms?.name ?? "",
          academicYear: r.academic_years?.name ?? "",
          totalFee: `${Number(r.total_fee).toLocaleString()} FRW`,
          amountPaid: `${Number(r.amount_paid).toLocaleString()} FRW`,
          balance: `${(Number(r.total_fee) - Number(r.amount_paid)).toLocaleString()} FRW`,
          method: r.payment_method ?? "-",
          date: r.date ?? "",
          status: Number(r.amount_paid) >= Number(r.total_fee) ? "Paid" : (Number(r.amount_paid) > 0 ? "Partial" : "Unpaid"),
        })));
      }

      const { data: extTx, error: extErr } = await supabase.from("external_transactions").select("receipt_no,name,total_amount,reason,category,date").order("date", { ascending: false }).limit(200);
      if (!extErr && extTx) {
        // Use external_transactions for both expenses and transaction record downloads.
        setExpensesData(extTx.map((r: any) => ({
          receiptNo: r.receipt_no ?? "",
          paidTo: r.name ?? "",
          category: r.category ?? "Expenses",
          amount: `${Number(r.total_amount).toLocaleString()} FRW`,
          date: r.date ?? "",
          description: r.reason ?? "",
          title: r.name ?? "",
        })));
      }

      const { data: feestructs, error: fsErr } = await supabase.from("fee_structures").select("academic_year,term,department,level,boarding_type,amount").order("academic_year", { ascending: false });
      if (!fsErr && feestructs) {
        setFeeStructureData(feestructs.map((r: any) => ({ academicYear: r.academic_year, term: r.term, department: r.department, level: r.level ?? "", boardingType: r.boarding_type, amount: `${Number(r.amount).toLocaleString()} FRW` })));
      }

      const { data: otherInc, error: oiErr } = await supabase.from("other_incomes").select("source,category,amount,date,description").order("date", { ascending: false }).limit(200);
      if (!oiErr && otherInc) {
        setOtherIncomeData(otherInc.map((r: any) => ({ source: r.source, category: r.category, amount: `${Number(r.amount).toLocaleString()} FRW`, date: r.date, description: r.description })));
      }
    };
    load();
  }, []);

  const ALL_STUDENTS = studentsData;

  const deptOptions = useMemo(() => Array.from(new Set(ALL_STUDENTS.map(s => s.department))).filter(Boolean).sort(), [ALL_STUDENTS]);
  const levelOptions = useMemo(
    () => Array.from(new Set(ALL_STUDENTS.filter(s => !dept || s.department === dept).map(s => s.level))).filter(Boolean).sort(),
    [ALL_STUDENTS, dept]
  );
  const classOptions = useMemo(
    () => Array.from(new Set(ALL_STUDENTS.filter(s => (!dept || s.department === dept) && (!level || s.level === level)).map(s => s.class))).filter(Boolean).sort(),
    [ALL_STUDENTS, dept, level]
  );

  const filteredStudents = ALL_STUDENTS
    .filter(s =>
      (!dept  || s.department === dept) &&
      (!level || s.level      === level) &&
      (!cls   || s.class      === cls) &&
      (statusFilter === "all" || s.status === statusFilter)
    );

  const paidCount    = ALL_STUDENTS.filter(s => (!dept || s.department === dept) && (!level || s.level === level) && (!cls || s.class === cls) && s.status === "Paid").length;
  const partialCount = ALL_STUDENTS.filter(s => (!dept || s.department === dept) && (!level || s.level === level) && (!cls || s.class === cls) && s.status === "Partial").length;
  const unpaidCount  = ALL_STUDENTS.filter(s => (!dept || s.department === dept) && (!level || s.level === level) && (!cls || s.class === cls) && s.status === "Unpaid").length;

  const feeSubtitle = [
    dept && `Dept: ${dept}`, level && `Level: ${level}`, cls && `Class: ${cls}`,
    statusFilter !== "all" && `Status: ${statusFilter}`,
  ].filter(Boolean).join(" · ") || "All students";

  const summaryStats = [
    { label: "Total Collected", value: ALL_STUDENTS.reduce((s,a) => s + Number(String(a.amountPaid).replace(/[^0-9.-]+/g,"")||0), 0).toLocaleString() + " FRW", icon: DollarSign, color: "text-success" },
    { label: "Total Expenses",  value: expensesData.reduce((s,a) => s + Number(String(a.amount).replace(/[^0-9.-]+/g,"")||0), 0).toLocaleString() + " FRW",   icon: TrendingDown, color: "text-destructive" },
    { label: "Total Payroll",   value: "0 FRW",   icon: Users,        color: "text-warning" },
    { label: "Other Income",    value: otherIncomeData.reduce((s,a) => s + Number(String(a.amount).replace(/[^0-9.-]+/g,"")||0), 0).toLocaleString() + " FRW",   icon: Receipt,      color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Finance Reports</h1>
        <p className="text-muted-foreground mt-1">Filter and download financial reports as PDF, Excel or Word</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`w-7 h-7 ${s.color} opacity-50`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">

      {/* Student Fee Payments */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <button onClick={() => setFeeOpen(o => !o)} className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-heading font-semibold text-card-foreground">Student Fee Payments</p>
              <p className="text-xs text-muted-foreground">Filter by department, level, class and payment status</p>
            </div>
          </div>
          {feeOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        <AnimatePresence initial={false}>
          {feeOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="border-t border-border p-5 space-y-4">

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Department</Label>
                    <Select value={dept} onValueChange={v => { setDept(v === "__all__" ? "" : v); setLevel(""); setCls(""); }}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="All departments" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Departments</SelectItem>
                        {deptOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Level</Label>
                    <Select value={level} onValueChange={v => { setLevel(v === "__all__" ? "" : v); setCls(""); }} disabled={!dept}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="All levels" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Levels</SelectItem>
                        {levelOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Class</Label>
                    <Select value={cls} onValueChange={v => setCls(v === "__all__" ? "" : v)} disabled={!level}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="All classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Classes</SelectItem>
                        {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status summary + filter tabs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-xl font-bold text-success">{paidCount}</p>
                  </div>
                  <div className="bg-warning/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Partial</p>
                    <p className="text-xl font-bold text-warning">{partialCount}</p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Unpaid</p>
                    <p className="text-xl font-bold text-destructive">{unpaidCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(["all", "Paid", "Partial", "Unpaid"] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        statusFilter === s ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}>
                      {s === "all" ? `All (${ALL_STUDENTS.filter(st => (!dept || st.department === dept) && (!level || st.level === level) && (!cls || st.class === cls)).length})` : s}
                    </button>
                  ))}
                  {(dept || level || cls || statusFilter !== "all") && (
                    <button onClick={() => { setDept(""); setLevel(""); setCls(""); setStatusFilter("all"); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors ml-auto">
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Preview table */}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-primary/10 border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold text-primary">Student</th>
                      <th className="text-left px-3 py-2 font-semibold text-primary">Dept</th>
                      <th className="text-left px-3 py-2 font-semibold text-primary">Class</th>
                      <th className="text-left px-3 py-2 font-semibold text-primary">Total Fee</th>
                      <th className="text-left px-3 py-2 font-semibold text-primary">Paid</th>
                      <th className="text-left px-3 py-2 font-semibold text-primary">Balance</th>
                      <th className="text-left px-3 py-2 font-semibold text-primary">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {filteredStudents.map((s, i) => (
                        <tr key={`${s.studentNumber}-${i}`} className={i % 2 === 0 ? "bg-muted/20 hover:bg-muted/40" : "hover:bg-muted/20"}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-card-foreground text-xs">{s.studentName}</p>
                            <p className="text-xs text-muted-foreground">{s.studentNumber}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{s.department}</td>
                          <td className="px-3 py-2 text-xs text-card-foreground">{s.class}</td>
                          <td className="px-3 py-2 text-xs text-card-foreground">{s.totalFee}</td>
                          <td className="px-3 py-2 text-xs text-success font-medium">{s.amountPaid}</td>
                          <td className="px-3 py-2 text-xs text-destructive font-medium">{s.balance}</td>
                          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span></td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr><td colSpan={7} className="px-3 py-4 text-center text-muted-foreground text-sm">No students match the selected filters</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} — {feeSubtitle}
                  </p>
                </div>

                <DownloadBar
                  title={`Student Fee Payments — ${statusFilter === "all" ? "All" : statusFilter}`}
                  subtitle={feeSubtitle}
                  columns={FEE_COLUMNS}
                  rows={filteredStudents}
                  filename={`fee_payments_${dept || "all"}_${cls || "all"}_${statusFilter}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        <ReportCard
          title="Fee Structure" subtitle="Fee amounts per level, term and academic year"
          icon={FileText}
          columns={[{ header: "Academic Year", key: "academicYear" }, { header: "Term", key: "term" }, { header: "Department", key: "department" }, { header: "Level", key: "level" }, { header: "Boarding Type", key: "boardingType" }, { header: "Amount", key: "amount" }]}
          rows={feeStructureData} filename="fee_structure"
        />
        <ReportCard
          title="Expense Report" subtitle="All school expenses by category"
          icon={TrendingDown}
          columns={[{ header: "Title", key: "title" }, { header: "Category", key: "category" }, { header: "Amount", key: "amount" }, { header: "Date", key: "date" }, { header: "Description", key: "description" }]}
          rows={expensesData.map((r: any) => ({ title: r.title, category: r.category, amount: r.amount, date: r.date, description: r.description }))} filename="expenses_report"
        />
        <ReportCard
          title="Transaction Records" subtitle="All payments made by the school to suppliers and individuals"
          icon={Users}
          columns={[{ header: "Receipt No", key: "receiptNo" }, { header: "Paid To", key: "paidTo" }, { header: "Category", key: "category" }, { header: "Amount", key: "amount" }, { header: "Method", key: "paymentMethod" }, { header: "Date", key: "date" }, { header: "Description", key: "description" }]}
          rows={expensesData.map((r: any) => ({
            receiptNo: r.receiptNo,
            paidTo: r.paidTo,
            category: r.category,
            amount: r.amount,
            paymentMethod: "-", // external_transactions currently doesn't have method in schema
            date: r.date,
            description: r.description,
          }))} filename="transaction_records"
        />
        <ReportCard
          title="Other Income Sources" subtitle="Additional school income beyond student fees"
          icon={DollarSign}
          columns={[{ header: "Source", key: "source" }, { header: "Category", key: "category" }, { header: "Amount", key: "amount" }, { header: "Date", key: "date" }, { header: "Description", key: "description" }]}
          rows={otherIncomeData} filename="other_income_report"
        />
      </div>
    </div>
  );
}
