import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentRecord {
  id: string;
  receiptNo: string;
  studentName: string;
  studentId: string;
  date: string;
  amount: number;
  method: string;
  balance: number;
}

const initialRecords: PaymentRecord[] = [];

export default function PaymentRecordsPage() {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<PaymentRecord[]>(initialRecords);

  useEffect(() => {
    const loadRecords = async () => {
      const { data, error } = await supabase
        .from("student_fees")
        .select(`id, total_fee, amount_paid, payment_method, date, students(id, full_name, student_number)`)
        .order("date", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to load payment records:", error);
        return;
      }

      const formatted = (data || []).map((row: any) => {
        const student = row.students;
        const studentId = student?.student_number ?? student?.id ?? row.student_id ?? "Unknown";
        return {
          id: row.id,
          receiptNo: `PF-${row.id?.slice?.(0, 8) ?? "00000000"}`,
          studentName: student?.full_name ?? "Unknown",
          studentId,
          date: row.date ?? "",
          amount: Number(row.amount_paid ?? 0),
          method: row.payment_method ?? "-",
          balance: Math.max(0, Number(row.total_fee ?? 0) - Number(row.amount_paid ?? 0)),
        };
      });
      setRecords(formatted);
    };
    loadRecords();
  }, []);

  const filtered = records.filter(r =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) ||
    r.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    r.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = (r: PaymentRecord) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${r.receiptNo}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:400px;margin:auto}h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:8px 4px;border-bottom:1px solid #eee}.total{font-weight:bold;font-size:1.1em}.footer{text-align:center;margin-top:30px;font-size:0.85em;color:#666}</style>
      </head><body>
      <h2>PAYMENT RECEIPT</h2>
      <p style="text-align:center;color:#666">School Management System</p>
      <table>
        <tr><td>Receipt No</td><td><b>${r.receiptNo}</b></td></tr>
        <tr><td>Student</td><td>${r.studentName}</td></tr>
        <tr><td>Student ID</td><td>${r.studentId}</td></tr>
        <tr><td>Date</td><td>${r.date}</td></tr>
        <tr><td>Payment Method</td><td>${r.method}</td></tr>
        <tr><td class="total">Amount Paid</td><td class="total">${r.amount.toLocaleString()} FRW</td></tr>
        <tr><td>Remaining Balance</td><td style="color:${r.balance === 0 ? "green" : "red"}">${r.balance.toLocaleString()} FRW</td></tr>
      </table>
      <p class="footer">Thank you for your payment.<br/>Keep this receipt for your records.</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownload = (r: PaymentRecord) => {
    const content = `PAYMENT RECEIPT\n\nReceipt No: ${r.receiptNo}\nStudent: ${r.studentName}\nStudent ID: ${r.studentId}\nDate: ${r.date}\nPayment Method: ${r.method}\nAmount Paid: ${r.amount.toLocaleString()} FRW\nRemaining Balance: ${r.balance.toLocaleString()} FRW\n\nThank you for your payment.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${r.receiptNo}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Payment Records</h1><p className="text-muted-foreground mt-1">View transaction history and print receipts</p></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-heading font-semibold text-card-foreground">All Transactions</h2>
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipt or student..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Receipt No</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Amount Paid</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Balance</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-primary">{r.receiptNo}</td>
                  <td className="p-4 text-card-foreground">{r.studentName}<br /><span className="text-xs text-muted-foreground">{r.studentId}</span></td>
                  <td className="p-4 text-muted-foreground">{r.date}</td>
                  <td className="p-4 font-semibold text-success">{r.amount.toLocaleString()} FRW</td>
                  <td className="p-4 text-muted-foreground">{r.method}</td>
                  <td className="p-4"><span className={r.balance === 0 ? "text-success font-medium" : "text-destructive font-medium"}>{r.balance.toLocaleString()} FRW</span></td>
                  <td className="p-4 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handlePrint(r)} className="text-primary hover:text-primary" title="Print"><Printer className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(r)} className="text-muted-foreground hover:text-foreground" title="Download"><Download className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
