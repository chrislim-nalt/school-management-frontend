import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ==================== SHARED HELPERS ====================

const getSchoolName = () => {
  return localStorage.getItem("schoolName") || "School Management System";
};

// Consistent date formatting everywhere data is exported, so a report never
// shows "9/6/2026" in one row and "06 Sep 2026" in another. Anything that
// isn't a valid date is left exactly as-is (so non-date columns are untouched).
const formatExportValue = (value, key) => {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "object") {
    // Dates arrive as Date objects or ISO strings from the API — normalize both.
    if (value instanceof Date || /date/i.test(key || "")) {
      const d = value instanceof Date ? value : new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
      }
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" && /date/i.test(key || "") && !isNaN(Date.parse(value))) {
    const d = new Date(value);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }
  return String(value);
};

// If the dataset carries a recognizable date field, sort oldest→newest before
// export so records never appear shuffled/mixed in the final report — this
// was the root cause of "dates getting mixed" in downloaded activity reports.
const sortByDateIfPresent = (data, columns) => {
  const dateKey = columns.find(c => /date/i.test(c.key))?.key;
  if (!dateKey) return data;

  return [...data].sort((a, b) => {
    const da = new Date(a[dateKey]);
    const db = new Date(b[dateKey]);
    const va = isNaN(da.getTime()) ? 0 : da.getTime();
    const vb = isNaN(db.getTime()) ? 0 : db.getTime();
    return va - vb;
  });
};

// ==================== PDF EXPORT ====================

export const exportToPDF = async (data, columns, title, filename, subtitle = "") => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) {
        reject(new Error("No data to export"));
        return;
      }

      const schoolName = getSchoolName();
      const sortedData = sortByDateIfPresent(data, columns);

      const doc = new jsPDF({
        orientation: data.length > 20 || columns.length > 6 ? "landscape" : "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Header band
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(schoolName, pageWidth / 2, 16, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(title || "Report", pageWidth / 2, 25, { align: "center" });

      if (subtitle) {
        doc.setFontSize(9);
        doc.setTextColor(220, 235, 250);
        doc.text(subtitle, pageWidth / 2, 33, { align: "center" });
      }

      // Metadata
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 50);
      doc.text(`Total Records: ${sortedData.length}`, 14, 57);

      const startY = 65;

      const tableColumnHeaders = columns.map(col => col.label);
      const tableBody = sortedData.map(row =>
        columns.map(col => formatExportValue(row[col.key], col.key))
      );

      doc.autoTable({
        head: [tableColumnHeaders],
        body: tableBody,
        startY,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
          valign: "middle"
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3,
          valign: "middle"
        },
        alternateRowStyles: {
          fillColor: [245, 250, 255]
        },
        margin: { top: startY, left: 10, right: 10 },
        didDrawPage: (hookData) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${hookData.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" }
          );
          doc.setDrawColor(200, 200, 200);
          doc.line(10, doc.internal.pageSize.getHeight() - 12, pageWidth - 10, doc.internal.pageSize.getHeight() - 12);
        }
      });

      doc.save(`${filename}.pdf`);
      resolve(true);
    } catch (error) {
      console.error("PDF export error:", error);
      reject(error);
    }
  });
};

// ==================== EXCEL EXPORT ====================

export const exportToExcel = (data, columns, filename, subtitle = "") => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) {
        reject(new Error("No data to export"));
        return;
      }

      const schoolName = getSchoolName();
      const sortedData = sortByDateIfPresent(data, columns);

      const worksheetData = [
        [schoolName],
        ...(subtitle ? [[subtitle]] : []),
        [`Report Generated: ${new Date().toLocaleString()}`],
        [`Total Records: ${sortedData.length}`],
        [],
        columns.map(col => col.label),
        ...sortedData.map(row => columns.map(col => formatExportValue(row[col.key], col.key)))
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, filename.substring(0, 31));

      const headerRowIndex = subtitle ? 5 : 4; // 0-indexed row of the column headers
      const lastCol = columns.length - 1;

      if (!worksheet['!merges']) worksheet['!merges'] = [];
      worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } });
      if (subtitle) worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } });
      worksheet['!merges'].push({ s: { r: headerRowIndex - 2, c: 0 }, e: { r: headerRowIndex - 2, c: lastCol } });
      worksheet['!merges'].push({ s: { r: headerRowIndex - 1, c: 0 }, e: { r: headerRowIndex - 1, c: lastCol } });

      const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + (headerRowIndex + 1);
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2980B9" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      const maxWidth = columns.map((_, idx) => {
        let max = (columns[idx].label || "").length;
        sortedData.forEach(row => {
          const val = formatExportValue(row[columns[idx].key], columns[idx].key).length;
          if (val > max) max = val;
        });
        return { wch: Math.min(max + 3, 40) };
      });
      worksheet["!cols"] = maxWidth;

      XLSX.writeFile(workbook, `${filename}.xlsx`);
      resolve(true);
    } catch (error) {
      console.error("Excel export error:", error);
      reject(error);
    }
  });
};

// ==================== CSV EXPORT ====================

export const exportToCSV = (data, columns, filename) => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) {
        reject(new Error("No data to export"));
        return;
      }

      const sortedData = sortByDateIfPresent(data, columns);

      const headers = columns.map(col => `"${col.label}"`).join(",");
      const rows = sortedData.map(row =>
        columns.map(col => {
          let value = formatExportValue(row[col.key], col.key);
          if (value.includes(",") || value.includes('"')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      );

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `${filename}.csv`);
      resolve(true);
    } catch (error) {
      console.error("CSV export error:", error);
      reject(error);
    }
  });
};

// ==================== INVENTORY ITEMS PDF (unchanged behavior) ====================

export const exportItemsToPDF = (items) => {
  return new Promise((resolve, reject) => {
    try {
      const schoolName = getSchoolName();

      if (!items || items.length === 0) {
        reject(new Error("No items to export"));
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(schoolName, pageWidth / 2, 18, { align: "center" });

      doc.setFontSize(11);
      doc.text("Inventory Items Report", pageWidth / 2, 28, { align: "center" });

      doc.setTextColor(33, 33, 33);

      const columns = [
        { label: "Item Name", key: "name" },
        { label: "Category", key: "category" },
        { label: "Quantity", key: "quantity" },
        { label: "Unit", key: "unit" },
        { label: "Location", key: "location" }
      ];

      const tableData = items.map(item => ({
        name: item.name,
        category: item.category?.name || "-",
        quantity: item.quantity,
        unit: item.unit || "pcs",
        location: item.location || "-"
      }));

      const tableBody = tableData.map(row =>
        columns.map(col => String(row[col.key] || "-"))
      );

      doc.autoTable({
        head: [columns.map(c => c.label)],
        body: tableBody,
        startY: 45,
        theme: "striped",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold"
        },
        bodyStyles: { fontSize: 8 },
        margin: { top: 45, left: 10, right: 10 }
      });

      doc.save(`inventory_items_${new Date().toISOString().slice(0, 10)}.pdf`);
      resolve(true);
    } catch (error) {
      console.error("Items PDF export error:", error);
      reject(error);
    }
  });
};