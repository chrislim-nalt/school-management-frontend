// jspdf@2.5.1 + jspdf-autotable@3.8.2
import jsPDF from "jspdf";
import "jspdf-autotable"; // Side-effect import - this patches jsPDF prototype
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Safe text handler
const safe = (v) => {
  if (v === null || v === undefined) return "-";
  let str = String(v);
  // Remove emojis only, keep basic text
  str = str.replace(/[\u{1F000}-\u{1FFFF}]/gu, "");
  return str.trim() || "-";
};

const fmtDate = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Generic PDF Export (for any data)
export const exportToPDF = (data, columns, title, filename) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 20, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(safe(title), 14, 12);
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(fmtDate(), pageW - 14, 12, { align: "right" });

  // Table data
  const tableBody = data.map(row => columns.map(col => safe(row[col.key])));
  
  // Use doc.autoTable (patched by the side-effect import)
  doc.autoTable({
    head: [columns.map(col => col.label)],
    body: tableBody,
    startY: 25,
    margin: { left: 10, right: 10 },
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [241, 245, 249] }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, { align: "right" });
    doc.text("Confidential - G.S AGATEKO", 14, pageH - 8);
  }

  doc.save(`${filename}.pdf`);
};

// Items PDF Export (rich report with categories)
export const exportItemsToPDF = (items) => {
  if (!items || items.length === 0) {
    alert("No items to export");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 20, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("G.S AGATEKO - Items Report", 14, 12);
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(fmtDate(), pageW - 14, 12, { align: "right" });

  // Prepare table data
  const tableBody = items.map((item, idx) => [
    idx + 1,
    safe(item.name),
    safe(item.category?.name || "-"),
    safe(item.assetType?.replace(/_/g, " ") || "-"),
    item.currentQuantity || 0,
    safe(item.unit || "-"),
    safe(item.condition || "-"),
    safe(item.location || "-"),
    item.unitPrice ? `${item.unitPrice.toLocaleString()}` : "0",
    item.unitPrice && item.currentQuantity ? `${(item.unitPrice * item.currentQuantity).toLocaleString()}` : "0"
  ]);

  // Add table using doc.autoTable
  doc.autoTable({
    head: [["#", "Item Name", "Category", "Type", "Qty", "Unit", "Condition", "Location", "Unit Price", "Total Value"]],
    body: tableBody,
    startY: 25,
    margin: { left: 10, right: 10 },
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [241, 245, 249] }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, { align: "right" });
    doc.text("Confidential - G.S AGATEKO", 14, pageH - 8);
  }

  doc.save(`Items_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Export to Excel
export const exportToExcel = (data, columns, filename) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const worksheetData = [
    columns.map(col => col.label),
    ...data.map(row => columns.map(col => row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : "-"))
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  // Auto-size columns
  const maxWidth = columns.map((_, idx) => {
    let max = columns[idx].label.length;
    data.forEach((row) => {
      const val = String(row[columns[idx].key] || "-").length;
      if (val > max) max = val;
    });
    return { wch: Math.min(max + 2, 30) };
  });
  worksheet["!cols"] = maxWidth;
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export to CSV
export const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = columns.map(col => `"${col.label}"`).join(",");
  const rows = data.map(row => 
    columns.map(col => {
      let val = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : "-";
      val = String(val);
      if (val.includes(",") || val.includes('"')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(",")
  );
  
  const blob = new Blob(["\uFEFF" + [headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
};