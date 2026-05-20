import * as XLSX from "xlsx";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, ShadingType,
} from "docx";

export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportOptions {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
  filename: string;
}

// ─── Excel ────────────────────────────────────────────────────────────────────
export function downloadExcel({ title, columns, rows, filename }: ExportOptions) {
  const header = columns.map(c => c.header);
  const data = rows.map(r => columns.map(c => r[c.key] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws["!cols"] = columns.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `${filename}_${today()}.xlsx`);
}

// ─── Word ─────────────────────────────────────────────────────────────────────
export async function downloadWord({ title, subtitle, columns, rows, filename }: ExportOptions) {
  const colWidth = Math.floor(9000 / columns.length);

  const headerRow = new TableRow({
    children: columns.map(c => new TableCell({
      shading: { type: ShadingType.SOLID, fill: "4F46E5", color: "4F46E5" },
      width: { size: colWidth, type: WidthType.DXA },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: c.header, bold: true, color: "FFFFFF", size: 20 })],
      })],
    })),
  });

  const dataRows = rows.map((r, idx) => new TableRow({
    children: columns.map(c => new TableCell({
      shading: { type: ShadingType.SOLID, fill: idx % 2 === 0 ? "F5F3FF" : "FFFFFF", color: "auto" },
      width: { size: colWidth, type: WidthType.DXA },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: String(r[c.key] ?? ""), size: 18 })],
      })],
    })),
  }));

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: title, bold: true, size: 32, color: "4F46E5" })],
        }),
        ...(subtitle ? [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: subtitle, size: 20, color: "6B7280" })],
        })] : []),
        new Paragraph({
          children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 18, color: "9CA3AF" })],
        }),
        new Paragraph({ children: [new TextRun({ text: "" })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${filename}_${today()}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

// ─── PDF (styled print window) ────────────────────────────────────────────────
export function downloadPDF({ title, subtitle, columns, rows }: ExportOptions) {
  const win = window.open("", "_blank");
  if (!win) return;

  const tableRows = rows.map((r, i) =>
    `<tr style="background:${i % 2 === 0 ? "#f5f3ff" : "#ffffff"}">
      ${columns.map(c => `<td>${r[c.key] ?? ""}</td>`).join("")}
    </tr>`
  ).join("");

  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;color:#111827;max-width:1100px;margin:auto}
      h1{color:#4F46E5;font-size:22px;margin-bottom:4px}
      .sub{color:#6B7280;font-size:13px;margin-bottom:4px}
      .date{color:#9CA3AF;font-size:12px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      thead tr{background:#4F46E5}
      thead th{color:#fff;padding:10px 12px;text-align:left;font-size:12px;border:1px solid #4338CA}
      tbody td{padding:8px 12px;border:1px solid #e5e7eb;font-size:12px}
      .btn{margin-top:20px;padding:8px 20px;background:#4F46E5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px}
      @media print{.btn{display:none}}
    </style></head><body>
    <h1>${title}</h1>
    ${subtitle ? `<p class="sub">${subtitle}</p>` : ""}
    <p class="date">Generated: ${new Date().toLocaleDateString()}</p>
    <table>
      <thead><tr>${columns.map(c => `<th>${c.header}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </body></html>`);
  win.document.close();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }

function triggerDownload(blob: Blob, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([blob], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
