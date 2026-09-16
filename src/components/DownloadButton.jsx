import { useState, useRef, useEffect } from "react";

export default function DownloadButton({
  data = [],
  items = [],
  columns = [],
  title = "Report",
  subtitle = "",
  filename = "export",
  variant = "primary",
  useItemsPDF = false,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handle = async (type) => {
    setLoading(type);
    setOpen(false);
    
    try {
      if (type === "pdf") {
        if (useItemsPDF) {
          const itemsToExport = items.length ? items : data;
          if (!itemsToExport.length) throw new Error("No items to export");
          const { exportItemsToPDF } = await import("../services/exportService");
          exportItemsToPDF(itemsToExport);
        } else {
          if (!data.length) throw new Error("No data to export");
          const { exportToPDF } = await import("../services/exportService");
          exportToPDF(data, columns, title, filename, subtitle);
        }
      } else if (type === "excel") {
        if (!data.length) throw new Error("No data to export");
        const { exportToExcel } = await import("../services/exportService");
        exportToExcel(data, columns, filename, subtitle);
      } else if (type === "csv") {
        if (!data.length) throw new Error("No data to export");
        const { exportToCSV } = await import("../services/exportService");
        exportToCSV(data, columns, filename);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert(err.message || "Export failed");
    } finally {
      setLoading(null);
    }
  };

  const btnBase = variant === "primary"
    ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={!!loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-60 ${btnBase}`}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-50 border border-slate-100 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500">Choose format</p>
          </div>
          <button
            onClick={() => handle("pdf")}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
          >
            <span className="text-rose-500">📄</span>
            <span className="text-sm font-medium">PDF Report</span>
          </button>
          <button
            onClick={() => handle("excel")}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
          >
            <span className="text-emerald-600">📊</span>
            <span className="text-sm font-medium">Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handle("csv")}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
          >
            <span className="text-slate-500">📋</span>
            <span className="text-sm font-medium">CSV</span>
          </button>
        </div>
      )}
    </div>
  );
}