import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Get school name from localStorage
const getSchoolName = () => {
  return localStorage.getItem("schoolName") || "School Management System";
};

// Export to PDF with dynamic school name
export const exportToPDF = async (data, columns, title, filename, subtitle = "") => {
  return new Promise((resolve, reject) => {
    try {
      const schoolName = getSchoolName();
      
      if (!data || data.length === 0) {
        reject(new Error("No data to export"));
        return;
      }
      
      const doc = new jsPDF({
        orientation: data.length > 20 ? "landscape" : "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add Header with school name
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(schoolName, pageWidth / 2, 18, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(title || "Report", pageWidth / 2, 28, { align: "center" });
      
      // Reset text color for body
      doc.setTextColor(33, 33, 33);
      
      // Add metadata
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 50);
      doc.text(`Total Records: ${data.length}`, 14, 57);
      
      if (subtitle) {
        doc.text(subtitle, 14, 64);
      }
      
      // Prepare table data
      const tableColumnHeaders = columns.map(col => col.label);
      const tableBody = data.map(row => 
        columns.map(col => {
          let value = row[col.key];
          if (value === undefined || value === null) return "-";
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
        })
      );
      
      // Add table
      doc.autoTable({
        head: [tableColumnHeaders],
        body: tableBody,
        startY: subtitle ? 70 : 65,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "center"
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 250, 255]
        },
        margin: { top: subtitle ? 70 : 65, left: 10, right: 10 },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
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

// Export to Excel with dynamic school name
export const exportToExcel = (data, columns, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const schoolName = getSchoolName();
      
      if (!data || data.length === 0) {
        reject(new Error("No data to export"));
        return;
      }
      
      const worksheetData = [
        [`${schoolName}`],
        [`Report Generated: ${new Date().toLocaleString()}`],
        [`Total Records: ${data.length}`],
        [],
        columns.map(col => col.label),
        ...data.map(row => columns.map(col => {
          let value = row[col.key];
          if (value === undefined || value === null) return "-";
          if (typeof value === "object") return JSON.stringify(value);
          return value;
        }))
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, filename.substring(0, 31));
      
      // Merge title cells
      if (!worksheet['!merges']) worksheet['!merges'] = [];
      const lastCol = columns.length - 1;
      worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } });
      worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } });
      worksheet['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } });
      
      // Style header row
      const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "5";
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2980B9" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      
      // Auto-size columns
      const maxWidth = columns.map((_, idx) => {
        let max = (columns[idx].label || "").length;
        data.forEach(row => {
          const val = String(row[columns[idx].key] || "-").length;
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

// Export to CSV
export const exportToCSV = (data, columns, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const headers = columns.map(col => `"${col.label}"`).join(",");
      const rows = data.map(row => 
        columns.map(col => {
          let value = row[col.key] || "-";
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
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

// Export items to PDF
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