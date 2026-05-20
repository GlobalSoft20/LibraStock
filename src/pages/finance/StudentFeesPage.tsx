import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, ChevronLeft, User, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/contexts/DataContext";

interface FeeRecord {
  id: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  department: string;
  level: string;
  class: string;
  academicYear: string;
  semester: string;
  totalFee: number;
  amountPaid: number;
  paymentMethod: string;
  date: string;
}

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Money", "Card"];
const statusColors: Record<string, string> = {
  Paid:    "bg-success/10 text-success",
  Partial: "bg-warning/10 text-warning",
  Unpaid:  "bg-destructive/10 text-destructive",
};

function getStatus(r: FeeRecord) {
  if (r.amountPaid >= r.totalFee) return "Paid";
  if (r.amountPaid > 0) return "Partial";
  return "Unpaid";
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ["Select Class", "Find Student", "Make Payment"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            i + 1 === current ? "gradient-primary text-primary-foreground" :
            i + 1 < current  ? "bg-success/10 text-success" :
            "bg-muted text-muted-foreground"
          }`}>
            {i + 1 < current ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

export default function StudentFeesPage() {
  const { students, academicYears, terms } = useData();
  const [step, setStep] = useState(1);

  // Step 1
  const [department, setDepartment] = useState("");
  const [level, setLevel]           = useState("");
  const [cls, setCls]               = useState("");

  // Step 2
  const [search, setSearch]             = useState("");
  const [pickMode, setPickMode]         = useState<"search" | "random">("search");
  const [selectedStudent, setSelectedStudent] = useState<typeof students[number] | null>(null);

  // Step 3
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId]                 = useState("");
  const [totalFee, setTotalFee]             = useState("");
  const [amountPaid, setAmountPaid]         = useState("");
  const [paymentMethod, setPaymentMethod]   = useState("Cash");
  const [isLoadingTotalFee, setIsLoadingTotalFee] = useState(false);

  // Records list
  const [records, setRecords] = useState<FeeRecord[]>([]);

  const departmentOptions = useMemo(() => Array.from(new Set(students.map((s: any) => s.department))).filter(Boolean).sort(), [students]);
  const levelOptions = useMemo(() => Array.from(new Set(students.filter((s: any) => !department || s.department === department).map((s: any) => s.level))).filter(Boolean).sort(), [students, department]);
  const classOptions = useMemo(() => Array.from(new Set(students.filter((s: any) => (!department || s.department === department) && (!level || s.level === level)).map((s: any) => s.class))).filter(Boolean).sort(), [students, department, level]);

  const classStudents = students.filter((s: any) =>
    (!department || s.department === department) &&
    (!level || s.level === level) &&
    (!cls || s.class === cls)
  );
  const filteredStudents = classStudents.filter((s: any) =>
    search === "" ||
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const loadRecords = async () => {
      const { data, error } = await supabase
        .from("student_fees")
        .select(`id, total_fee, amount_paid, payment_method, date, academic_years(name), terms(name), students(id, full_name, student_number, department, level, class)`)
        .order("date", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Failed to load fee records:", error);
        return;
      }

      setRecords((data || []).map((row: any) => {
        const student = row.students;
        const studentNumber = student?.student_number ?? student?.studentNumber ?? student?.id ?? row.student_id ?? "Unknown";
        return {
          id: row.id,
          studentId: row.student_id ?? student?.id ?? "Unknown",
          studentNumber,
          studentName: student?.full_name ?? "Unknown",
          department: student?.department ?? "",
          level: student?.level ?? "",
          class: student?.class ?? "",
          academicYear: row.academic_years?.name ?? "",
          semester: row.terms?.name ?? "",
          totalFee: Number(row.total_fee ?? 0),
          amountPaid: Number(row.amount_paid ?? 0),
          paymentMethod: row.payment_method ?? "-",
          date: row.date ?? "",
        };
      }));
    };

    loadRecords();
  }, []);

  useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const current = academicYears.find(y => y.isCurrent) ?? academicYears[0];
      setAcademicYearId(current.id);
    }
  }, [academicYears, academicYearId]);

  useEffect(() => {
    if (!termId && academicYearId) {
      const yearTerms = terms.filter(t => t.academicYearId === academicYearId);
      const current = yearTerms.find(t => t.isCurrent) ?? yearTerms[0];
      if (current) setTermId(current.id);
    }
  }, [terms, academicYearId, termId]);

  // Auto-fetch total fee from fee_structures (by year + term + dept + level)
  useEffect(() => {
    const academicYearName = academicYears.find(y => y.id === academicYearId)?.name;
    const termName = terms.find(t => t.id === termId)?.name;

    if (!academicYearName || !termName || !department || !level) return;

    let cancelled = false;
    (async () => {
      setIsLoadingTotalFee(true);
      const { data, error } = await supabase
        .from("fee_structures")
        .select("amount")
        .eq("academic_year", academicYearName)
        .eq("term", termName)
        .eq("department", department)
        .eq("level", level)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      setIsLoadingTotalFee(false);

      if (error) {
        console.error("Failed to fetch fee structure amount:", error);
        return;
      }

      if (data?.amount != null) {
        setTotalFee(String(Number(data.amount)));
      }
    })();

    return () => { cancelled = true; };
  }, [academicYearId, termId, academicYears, terms, department, level]);

  const handleStep1Next = () => {
    if (!department || !level || !cls) { toast.error("Please select Department, Level and Class"); return; }
    setSearch(""); setSelectedStudent(null); setPickMode("search");
    setStep(2);
  };

  const handleSelectStudent = (s: any) => {
    setSelectedStudent(s);
    setStep(3);
    setTotalFee(""); setAmountPaid(""); setPaymentMethod("Cash");
  };

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from("student_fees")
      .select(`id, total_fee, amount_paid, payment_method, date, academic_years(name), terms(name), students(id, full_name, student_number, department, level, class)`)
      .order("date", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Failed to load fee records:", error);
      return;
    }

    setRecords((data || []).map((row: any) => {
      const student = row.students;
      const studentNumber = student?.student_number ?? student?.studentNumber ?? student?.id ?? row.student_id ?? "Unknown";
      return {
        id: row.id,
        studentId: row.student_id ?? student?.id ?? "Unknown",
        studentNumber,
        studentName: student?.full_name ?? "Unknown",
        department: student?.department ?? "",
        level: student?.level ?? "",
        class: student?.class ?? "",
        academicYear: row.academic_years?.name ?? "",
        semester: row.terms?.name ?? "",
        totalFee: Number(row.total_fee ?? 0),
        amountPaid: Number(row.amount_paid ?? 0),
        paymentMethod: row.payment_method ?? "-",
        date: row.date ?? "",
      };
    }));
  };

  const handlePayment = async () => {
    if (!selectedStudent) return;
    if (!totalFee || !amountPaid) { toast.error("Enter total fee and amount paid"); return; }
    if (!academicYearId || !termId) { toast.error("Select an academic year and term"); return; }

    const { error } = await supabase.from("student_fees").insert({
      student_id: selectedStudent.id,
      academic_year_id: academicYearId,
      term_id: termId,
      total_fee: Number(totalFee),
      amount_paid: Number(amountPaid),
      payment_method: paymentMethod,
      date: new Date().toISOString().split("T")[0],
    });

    if (error) {
      console.error("Failed to record fee payment:", error);
      toast.error("Payment recording failed");
      return;
    }

    toast.success(`Payment recorded for ${selectedStudent.fullName ?? selectedStudent.full_name ?? selectedStudent.fullName}`);
    setStep(1); setDepartment(""); setLevel(""); setCls("");
    setSelectedStudent(null); setSearch(""); setTotalFee(""); setAmountPaid(""); setPaymentMethod("Cash");

    await loadRecords();
  };

  const [tableSearch, setTableSearch] = useState("");
  const filteredRecords = records.filter(r =>
    r.studentName.toLowerCase().includes(tableSearch.toLowerCase()) ||
    r.studentNumber.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // ── Fee status overview filters ────────────────────────────────────────────
  const [ovDept, setOvDept]   = useState("");
  const [ovLevel, setOvLevel] = useState("");
  const [ovCls, setOvCls]     = useState("");
  const [ovStatus, setOvStatus] = useState<"all" | "Paid" | "Partial" | "Unpaid">("all");

  const overviewStudents = useMemo(() => {
    return students
      .filter((s: any) =>
        (!ovDept  || s.department === ovDept) &&
        (!ovLevel || s.level      === ovLevel) &&
        (!ovCls   || s.class      === ovCls)
      )
      .map((s: any) => {
        const rec = records.find(r => r.studentId === s.id);
        const status = rec ? getStatus(rec) : "Unpaid";
        return { ...s, status, amountPaid: rec?.amountPaid ?? 0, totalFee: rec?.totalFee ?? 0, balance: rec ? rec.totalFee - rec.amountPaid : 0 };
      })
      .filter((s: any) => ovStatus === "all" || s.status === ovStatus);
  }, [students, ovDept, ovLevel, ovCls, ovStatus, records]);

  const ovPaid = useMemo(() => students.filter((s: any) => (!ovDept || s.department === ovDept) && (!ovLevel || s.level === ovLevel) && (!ovCls || s.class === ovCls)).filter((s: any) => { const r = records.find(r => r.studentId === s.id); return r ? getStatus(r) === "Paid" : false; }).length, [students, ovDept, ovLevel, ovCls, records]);
  const ovPartial = useMemo(() => students.filter((s: any) => (!ovDept || s.department === ovDept) && (!ovLevel || s.level === ovLevel) && (!ovCls || s.class === ovCls)).filter((s: any) => { const r = records.find(r => r.studentId === s.id); return r ? getStatus(r) === "Partial" : false; }).length, [students, ovDept, ovLevel, ovCls, records]);
  const ovUnpaid = useMemo(() => students.filter((s: any) => (!ovDept || s.department === ovDept) && (!ovLevel || s.level === ovLevel) && (!ovCls || s.class === ovCls)).filter((s: any) => { const r = records.find(r => r.studentId === s.id); return !r || getStatus(r) === "Unpaid"; }).length, [students, ovDept, ovLevel, ovCls, records]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Student Fees Management</h1>
        <p className="text-muted-foreground mt-1">Record and track student fee payments</p>
      </div>

      {/* ── Payment wizard ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-heading font-semibold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5" /> New Payment</h2>
          <Steps current={step} />
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Select Department / Level / Class ─────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Select the department, level and class before searching for a student.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-foreground">Department *</Label>
                  <Select value={department} onValueChange={v => { setDepartment(v); setLevel(""); setCls(""); }}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{departmentOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Level *</Label>
                  <Select value={level} onValueChange={v => { setLevel(v); setCls(""); }} disabled={!department}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>{levelOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Class *</Label>
                  <Select value={cls} onValueChange={setCls} disabled={!level}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleStep1Next} className="gradient-primary text-primary-foreground gap-2">
                Next — Find Student <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Search & pick student ────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{department}</span>
                <span className="text-muted-foreground">›</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{level}</span>
                <span className="text-muted-foreground">›</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{cls}</span>
                <span className="text-xs text-muted-foreground ml-1">({classStudents.length} students)</span>
              </div>

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPickMode("search"); setSearch(""); }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    pickMode === "search"
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <Search className="w-4 h-4" /> Search Student
                </button>
                <button
                  onClick={() => { setPickMode("random"); setSearch(""); }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    pickMode === "random"
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <User className="w-4 h-4" /> Pick Randomly
                </button>
              </div>

              {/* Search mode */}
              {pickMode === "search" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Type name or student ID..."
                      className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                      autoFocus
                    />
                  </div>
                  {search.trim() === "" ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Start typing to search students in {cls}</p>
                  ) : filteredStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No students match "{search}"</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {filteredStudents.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{s.fullName ?? s.full_name}</p>
                              <p className="text-xs text-muted-foreground">{s.studentNumber ?? s.student_number ?? s.id} · {s.class} · {s.department}</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleSelectStudent(s)} className="gradient-primary text-primary-foreground h-7 text-xs gap-1">
                            Pick <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Random pick mode — show all students in class */}
              {pickMode === "random" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">All students in {cls} — {department}</p>
                  {classStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No students found in this class</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {classStudents.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{s.fullName ?? s.full_name}</p>
                              <p className="text-xs text-muted-foreground">{s.studentNumber ?? s.student_number ?? s.id} · {s.class} · {s.department}</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleSelectStudent(s)} className="gradient-primary text-primary-foreground h-7 text-xs gap-1">
                            Pick <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </motion.div>
          )}

          {/* ── Step 3: Make payment ──────────────────────────────────────── */}
          {step === 3 && selectedStudent && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Selected student card */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">{selectedStudent.fullName ?? selectedStudent.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedStudent.studentNumber ?? selectedStudent.student_number ?? selectedStudent.id} · {selectedStudent.class} · {selectedStudent.department}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-success ml-auto" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label className="text-foreground">Academic Year</Label>
                  <Select value={academicYearId} onValueChange={setAcademicYearId}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Term</Label>
                  <Select value={termId} onValueChange={setTermId}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {terms.filter(t => t.academicYearId === academicYearId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Total Fee (FRW) *</Label>
                  <Input
                    type="number"
                    value={totalFee}
                    onChange={e => setTotalFee(e.target.value)}
                    placeholder={isLoadingTotalFee ? "Fetching..." : "56000"}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLoadingTotalFee ? "Fetching fee from fee structure..." : "Auto-filled from Fee Structure (you can still edit if needed)."}
                  </p>
                </div>
                <div>
                  <Label className="text-foreground">Amount Paid (FRW) *</Label>
                  <Input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="56000" className="bg-secondary border-border" />
                </div>
                {totalFee && amountPaid && (
                  <div className="flex flex-col justify-end">
                    <Label className="text-foreground">Balance</Label>
                    <div className={`px-3 py-2 rounded-lg text-sm font-semibold border ${Number(totalFee) - Number(amountPaid) <= 0 ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                      {Math.max(0, Number(totalFee) - Number(amountPaid)).toLocaleString()} FRW
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handlePayment} className="gradient-primary text-primary-foreground gap-2">
                  <CheckCircle className="w-4 h-4" /> Record Payment
                </Button>
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-3">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      {/* ── Payment Records table ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-heading font-semibold text-card-foreground">Payment Records</h2>
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={tableSearch} onChange={e => setTableSearch(e.target.value)} placeholder="Search student..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Class</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Term</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Total Fee</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Paid</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Balance</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map(r => {
                const status = getStatus(r);
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-card-foreground">{r.studentName}</p>
                      <p className="text-xs text-muted-foreground">{r.studentId}</p>
                    </td>
                    <td className="p-4 text-card-foreground">{r.class}</td>
                    <td className="p-4 text-muted-foreground">{r.semester}</td>                    <td className="p-4 text-card-foreground">{r.totalFee.toLocaleString()} FRW</td>
                    <td className="p-4 text-success font-medium">{r.amountPaid.toLocaleString()} FRW</td>
                    <td className="p-4 text-destructive font-medium">{(r.totalFee - r.amountPaid).toLocaleString()} FRW</td>
                    <td className="p-4 text-muted-foreground">{r.paymentMethod}</td>
                    <td className="p-4 text-muted-foreground">{r.date}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>{status}</span></td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
