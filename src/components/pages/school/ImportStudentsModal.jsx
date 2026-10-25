import React, { useEffect, useMemo, useRef, useState } from "react";
import { importStudents } from "../../services/schoolService";
import {
  parseStudentSheet,
  loadSpreadsheetLibrary,
  downloadTemplate,
  MAX_FILE_SIZE_MB,
  MAX_IMPORT_ROWS,
} from "./parseStudentSheet";

const STATUS_STYLES = {
  new: { label: "New", chip: "bg-emerald-100 text-emerald-700" },
  duplicate: { label: "Already exists", chip: "bg-amber-100 text-amber-700" },
  duplicate_in_file: { label: "Repeated in file", chip: "bg-amber-100 text-amber-700" },
  invalid: { label: "Problem", chip: "bg-rose-100 text-rose-700" },
};

const selectClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400";

export default function ImportStudentsModal({
  grades,
  classes,
  defaultGrade = "P1",
  defaultClass = "A",
  onClose,
  onImported,
}) {
  const [grade, setGrade] = useState(defaultGrade);
  const [className, setClassName] = useState(defaultClass);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [reading, setReading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("ALL");
  const [dragOver, setDragOver] = useState(false);

  const requestId = useRef(0);
  const fileInputRef = useRef(null);

  const busy = reading || previewing || importing;

  // Ask the server what WOULD happen (nothing is saved). Runs whenever the file
  // or the selected grade/class changes, so the numbers always match the target.
  useEffect(() => {
    if (parsedRows.length === 0) {
      setPreview(null);
      return undefined;
    }
    const myRequest = ++requestId.current;
    setPreviewing(true);
    setError("");
    importStudents({ grade, className, students: parsedRows, dryRun: true })
      .then((res) => {
        if (myRequest !== requestId.current) return; // a newer request replaced this one
        setPreview(res.data);
      })
      .catch((err) => {
        if (myRequest !== requestId.current) return;
        setPreview(null);
        setError(err.response?.data?.message || "Could not check the file. Please try again.");
      })
      .finally(() => {
        if (myRequest === requestId.current) setPreviewing(false);
      });
    return undefined;
  }, [parsedRows, grade, className]);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setParseError("");
    setPreview(null);
    setParsedRows([]);
    setView("ALL");

    const lower = file.name.toLowerCase();
    if (!/\.(xlsx|xls|csv)$/.test(lower)) {
      setFileName("");
      setParseError("Please choose an Excel file (.xlsx or .xls) or a .csv file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileName("");
      setParseError(`The file is too large (maximum ${MAX_FILE_SIZE_MB} MB).`);
      return;
    }

    setFileName(file.name);
    setReading(true);
    try {
      const [XLSX, buffer] = await Promise.all([loadSpreadsheetLibrary(), file.arrayBuffer()]);
      const parsed = parseStudentSheet(XLSX, buffer);
      if (parsed.error) {
        setParseError(parsed.error);
        return;
      }
      if (parsed.rows.length > MAX_IMPORT_ROWS) {
        setParseError(
          `The file has ${parsed.rows.length} students. Please import at most ${MAX_IMPORT_ROWS} at a time (split the file in two).`
        );
        return;
      }
      setParsedRows(parsed.rows);
    } catch (e) {
      console.error("Read file error:", e);
      setParseError("This file could not be read. Please check it and try again.");
    } finally {
      setReading(false);
    }
  };

  const handleImport = async () => {
    if (busy || !preview || preview.summary.toAdd === 0) return;
    setImporting(true);
    setError("");
    try {
      const res = await importStudents({ grade, className, students: parsedRows, dryRun: false });
      setResult(res.data);
      if (onImported) onImported(grade, className, res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Import failed. Please try again.");
      // The list may have changed (partial save) — refresh the preview numbers.
      if (err.response?.data?.added > 0) {
        if (onImported) onImported(grade, className, err.response.data);
        setParsedRows((rows) => [...rows]); // re-check against the updated list
      }
    } finally {
      setImporting(false);
    }
  };

  const visibleRows = useMemo(() => {
    if (!preview) return [];
    if (view === "ALL") return preview.rows;
    if (view === "NEW") return preview.rows.filter((r) => r.status === "new");
    return preview.rows.filter((r) => r.status !== "new"); // ISSUES
  }, [preview, view]);

  const summary = preview?.summary;
  const skipped = summary ? summary.duplicates + summary.duplicatesInFile : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Import students from Excel"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 sm:px-5 py-4 flex justify-between items-center rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">📥</span>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">Import Students from Excel</h2>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl disabled:opacity-40"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {result ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-5xl">🎉</div>
              <h3 className="text-lg font-bold text-slate-800">
                {result.added} student{result.added === 1 ? "" : "s"} added to {result.grade} {result.className}
              </h3>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  ✅ {result.added} added
                </span>
                {result.summary.duplicates + result.summary.duplicatesInFile > 0 && (
                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    ⏭️ {result.summary.duplicates + result.summary.duplicatesInFile} skipped (already exist)
                  </span>
                )}
                {result.summary.invalid > 0 && (
                  <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-medium">
                    ⚠️ {result.summary.invalid} with problems (not added)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Students got their IDs automatically. Other details (parent, phone, date of birth…) can be
                filled in later with the ✏️ Edit button.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1 */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] mr-1">1</span>
                  Choose the class that will receive these students
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Grade *</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      disabled={importing}
                      className={selectClass}
                    >
                      {grades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      disabled={importing}
                      className={selectClass}
                    >
                      {classes.map((c) => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] mr-1">2</span>
                    Upload the Excel file (columns: Names, Gender)
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadTemplate().catch(() => setError("Could not create the template file."))}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium underline"
                  >
                    ⬇ Download template
                  </button>
                </div>

                <label
                  htmlFor="student-import-file"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!busy) handleFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  } ${busy ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="text-3xl mb-1">📄</div>
                  {fileName ? (
                    <p className="text-sm font-medium text-slate-800 break-all">{fileName}</p>
                  ) : (
                    <p className="text-sm text-slate-600">Tap to choose a file, or drop it here</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    .xlsx, .xls or .csv · up to {MAX_IMPORT_ROWS} students per file
                  </p>
                  <input
                    id="student-import-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      handleFile(e.target.files?.[0]);
                      e.target.value = ""; // allows choosing the same file again after fixing it
                    }}
                  />
                </label>

                {(reading || previewing) && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                    <div className="w-4 h-4 border-2 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
                    {reading ? "Reading file…" : "Checking existing students…"}
                  </div>
                )}
              </div>

              {parseError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg leading-none">⚠️</span>
                  <span>{parseError}</span>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg leading-none">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Step 3: preview */}
              {summary && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] mr-1">3</span>
                    Check, then import into {grade} · Class {className}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 text-center">
                      <p className="text-[11px] text-slate-500">In file</p>
                      <p className="text-xl font-bold text-slate-800">{summary.total}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
                      <p className="text-[11px] text-emerald-700">Will be added</p>
                      <p className="text-xl font-bold text-emerald-700">{summary.toAdd}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 text-center">
                      <p className="text-[11px] text-amber-700">Already exist</p>
                      <p className="text-xl font-bold text-amber-700">{skipped}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 border border-rose-100 p-2 text-center">
                      <p className="text-[11px] text-rose-700">Problems</p>
                      <p className="text-xl font-bold text-rose-700">{summary.invalid}</p>
                    </div>
                  </div>

                  {summary.invalid > 0 && (
                    <p className="text-xs text-rose-600">
                      Rows with problems are not imported. Fix them in the file and upload it again — names already
                      added will be skipped automatically.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ["ALL", `All (${summary.total})`],
                      ["NEW", `New (${summary.toAdd})`],
                      ["ISSUES", `Skipped / problems (${summary.total - summary.toAdd})`],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setView(key)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          view === key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-slate-600">Row</th>
                            <th className="px-2 py-2 text-left font-semibold text-slate-600">Name</th>
                            <th className="px-2 py-2 text-left font-semibold text-slate-600">Gender</th>
                            <th className="px-2 py-2 text-left font-semibold text-slate-600">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visibleRows.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-2 py-4 text-center text-slate-400">Nothing to show here</td>
                            </tr>
                          ) : (
                            visibleRows.map((r, i) => {
                              const st = STATUS_STYLES[r.status] || STATUS_STYLES.invalid;
                              return (
                                <tr key={`${r.row}-${i}`}>
                                  <td className="px-2 py-1.5 text-slate-400">{r.row}</td>
                                  <td className="px-2 py-1.5 font-medium text-slate-800 break-words">{r.name || "—"}</td>
                                  <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">
                                    {r.gender === "MALE" ? "👦 Male" : r.gender === "FEMALE" ? "👧 Female" : "—"}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <span className={`inline-block px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${st.chip}`}>
                                      {st.label}
                                    </span>
                                    {(r.reason && r.status !== "new") && (
                                      <span className="block text-[11px] text-slate-500 mt-0.5">
                                        {r.reason}{r.matchedName && r.status === "duplicate" ? `: ${r.matchedName}` : ""}
                                      </span>
                                    )}
                                    {r.note && <span className="block text-[11px] text-amber-600 mt-0.5">ℹ️ {r.note}</span>}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 sm:px-5 border-t border-slate-100 flex-shrink-0">
          {result ? (
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={handleImport}
                disabled={busy || !summary || summary.toAdd === 0}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing
                  ? "Importing…"
                  : summary
                  ? summary.toAdd > 0
                    ? `📥 Import ${summary.toAdd} student${summary.toAdd === 1 ? "" : "s"}`
                    : "Nothing new to import"
                  : "📥 Import"}
              </button>
              <button
                onClick={onClose}
                disabled={importing}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}