import { useState, useRef, useEffect } from "react";

/**
 * DownloadButton
 *
 * Props:
 *  - data        {Array}   — flat array of row objects (used for Excel/CSV and generic PDF)
 *  - items       {Array}   — raw item objects from the DB (used for the rich Items PDF)
 *  - columns     {Array}   — [{ key, label }]
 *  - title       {string}  — PDF report title
 *  - filename    {string}  — base filename (no extension)
 *  - variant     {string}  — "primary" | "secondary"
 *  - useItemsPDF {bool}    — if true, call exportItemsToPDF instead of generic exportToPDF
 */
export default function DownloadButton({
  data = [],
  items = [],
  columns = [],
  title = "Report",
  filename = "export",
  variant = "primary",
  useItemsPDF = false,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null); // "pdf" | "excel" | "csv" | null
  const ref = useRef(null);

  // Close on outside click
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
          const { exportItemsToPDF } = await import("./services/exportService");
          exportItemsToPDF(items.length ? items : data);
        } else {
          const { exportToPDF } = await import("./services/exportService");
          exportToPDF(data, columns, title, filename);
        }
      } else if (type === "excel") {
        const { exportToExcel } = await import("./services/exportService");
        exportToExcel(data, columns, filename);
      } else if (type === "csv") {
        const { exportToCSV } = await import("./services/exportService");
        exportToCSV(data, columns, filename);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const btnBase =
    variant === "primary"
      ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50";

  const formats = [
    {
      id: "pdf",
      label: "Export as PDF",
      sub: "Formatted report with categories",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: "text-rose-500 bg-rose-50",
      badge: "Recommended",
    },
    {
      id: "excel",
      label: "Export as Excel",
      sub: "Spreadsheet (.xlsx)",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "csv",
      label: "Export as CSV",
      sub: "Plain text, comma-separated",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      color: "text-slate-500 bg-slate-100",
    },
  ];

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!!loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-60 ${btnBase}`}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Exporting…</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl z-50 border border-slate-100 overflow-hidden animate-in">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Choose format</p>
          </div>
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => handle(f.id)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left group"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${f.color}`}>
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{f.label}</span>
                  {f.badge && (
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
              </div>
              <svg
                className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors mt-2 flex-shrink-0"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes animate-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .animate-in { animation: animate-in 0.15s ease-out; }
      `}</style>
    </div>
  );
}