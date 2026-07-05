import React, { useEffect, useState } from "react";
import { 
  recordFee,
  getFeeRecords,
  getOutstandingFees,
  getStudentFeeSummary,
  getStudents
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function SchoolFeeManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [feeRecords, setFeeRecords] = useState([]);
  const [outstandingFees, setOutstandingFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showOutstanding, setShowOutstanding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [showStudentSummary, setShowStudentSummary] = useState(false);
  
  // Filters
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterTerm, setFilterTerm] = useState("TERM1");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D"];
  const terms = ["TERM1", "TERM2", "TERM3"];
  const paymentMethods = ["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CHEQUE"];
  const statuses = ["PAID", "PARTIAL", "UNPAID", "OVERDUE"];

  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    studentGrade: "",
    studentClass: "",
    totalFees: 0,
    amountPaid: 0,
    term: "TERM1",
    academicYear: new Date().getFullYear(),
    paymentMethod: "CASH",
    reference: "",
    notes: ""
  });

  const [selectedStudentForFee, setSelectedStudentForFee] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [studentsRes, feesRes] = await Promise.all([
        getStudents(),
        getFeeRecords({
          term: filterTerm,
          grade: filterGrade !== "ALL" ? filterGrade : undefined,
          className: filterClass !== "ALL" ? filterClass : undefined,
          status: filterStatus !== "ALL" ? filterStatus : undefined,
          search: searchTerm || undefined
        })
      ]);

      setStudents(studentsRes.data || []);
      setFeeRecords(feesRes.data?.records || []);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstanding = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getOutstandingFees({
        term: filterTerm,
        grade: filterGrade !== "ALL" ? filterGrade : undefined,
        className: filterClass !== "ALL" ? filterClass : undefined
      });
      setOutstandingFees(res.data?.records || []);
      setShowOutstanding(true);
    } catch (err) {
      console.error("Fetch outstanding error:", err);
      setError("Failed to load outstanding fees");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentSummary = async (studentId) => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentFeeSummary(studentId);
      setStudentSummary(res.data);
      setShowStudentSummary(true);
    } catch (err) {
      console.error("Fetch student summary error:", err);
      setError("Failed to load student fee summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterGrade, filterClass, filterTerm, filterStatus]);

  const handleSelectStudent = (student) => {
    setSelectedStudentForFee(student);
    setForm({
      ...form,
      studentId: student._id,
      studentName: student.name,
      studentGrade: student.grade,
      studentClass: student.className,
      totalFees: 0,
      amountPaid: 0,
      term: filterTerm
    });
  };

  const handleRecordFee = async (e) => {
    e.preventDefault();
    if (!form.studentId || form.totalFees <= 0) {
      setError("Please select a student and enter valid fees");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await recordFee({
        studentId: form.studentId,
        totalFees: form.totalFees,
        amountPaid: form.amountPaid || 0,
        term: form.term,
        academicYear: form.academicYear,
        paymentMethod: form.paymentMethod,
        reference: form.reference,
        notes: form.notes
      });
      setSuccess("✅ Fee recorded successfully!");
      setShowRecordForm(false);
      setForm({
        ...form,
        studentId: "",
        studentName: "",
        studentGrade: "",
        studentClass: "",
        totalFees: 0,
        amountPaid: 0,
        reference: "",
        notes: ""
      });
      setSelectedStudentForFee(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Record fee error:", err);
      setError(err.response?.data?.message || "Failed to record fee");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PAID: "bg-emerald-100 text-emerald-700",
      PARTIAL: "bg-amber-100 text-amber-700",
      UNPAID: "bg-rose-100 text-rose-700",
      OVERDUE: "bg-red-100 text-red-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusIcon = (status) => {
    const icons = {
      PAID: "✅",
      PARTIAL: "⚠️",
      UNPAID: "❌",
      OVERDUE: "🔴"
    };
    return icons[status] || "📊";
  };

  const exportData = feeRecords.map(f => ({
    "Student Name": f.studentName || "-",
    "Student ID": f.studentId || "-",
    "Grade": f.grade || "-",
    "Class": f.className || "-",
    "Total Fees": f.totalFees || 0,
    "Amount Paid": f.amountPaid || 0,
    "Balance": f.balance || 0,
    "Status": f.status || "-",
    "Term": f.term || "-",
    "Academic Year": f.academicYear || "-"
  }));

  const exportColumns = exportData.length > 0 ? Object.keys(exportData[0]).map(key => ({ key, label: key })) : [];

  // Summary stats
  const summaryStats = {
    total: feeRecords.length,
    paid: feeRecords.filter(f => f.status === "PAID").length,
    partial: feeRecords.filter(f => f.status === "PARTIAL").length,
    unpaid: feeRecords.filter(f => f.status === "UNPAID").length,
    overdue: feeRecords.filter(f => f.status === "OVERDUE").length,
    totalFees: feeRecords.reduce((sum, f) => sum + (f.totalFees || 0), 0),
    totalPaid: feeRecords.reduce((sum, f) => sum + (f.amountPaid || 0), 0),
    totalBalance: feeRecords.reduce((sum, f) => sum + (f.balance || 0), 0)
  };

  return (
    <div className="space-y-4">
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✅" : "⚠️"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">
                  💰
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    School Fee Management
                  </h1>
                  <p className="text-slate-300 text-sm">
                    Record fees, track balances, and identify debtors
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedStudentForFee(null);
                  setForm({
                    ...form,
                    term: filterTerm,
                    academicYear: new Date().getFullYear()
                  });
                  setShowRecordForm(true);
                }}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span className="text-lg">💰</span>
                Record Fee
              </button>
              <button
                onClick={fetchOutstanding}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span className="text-lg">🔴</span>
                View Debtors
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Total Records</p>
              <p className="text-2xl font-bold text-white mt-1">{summaryStats.total}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Total Fees</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summaryStats.totalFees.toLocaleString()} RWF</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Total Paid</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{summaryStats.totalPaid.toLocaleString()} RWF</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Total Balance</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{summaryStats.totalBalance.toLocaleString()} RWF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">📂 All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">📂 All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select 
            value={filterTerm} 
            onChange={(e) => setFilterTerm(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            {terms.map(t => <option key={t} value={t}>{t.replace("TERM", "Term ")}</option>)}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">📊 All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            placeholder="🔍 Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
          <button 
            onClick={fetchData}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Export Section */}
      {feeRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Fee Records</h3>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Fee Records Report" 
              filename={`fee_records_${filterTerm}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Fee Records Table */}
      {loading && feeRecords.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : feeRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">💰</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No fee records found</h3>
          <p className="text-slate-500 text-sm">Click "Record Fee" to add a new fee record</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Class</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Total Fees</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Paid</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Balance</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Status</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Term</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeRecords.map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-800 text-sm">{fee.studentName}</p>
                      <p className="text-xs text-slate-400">{fee.studentId}</p>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">{fee.grade} {fee.className}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800">{fee.totalFees.toLocaleString()} RWF</td>
                    <td className="px-3 py-2 text-right text-emerald-600 font-medium">{fee.amountPaid.toLocaleString()} RWF</td>
                    <td className="px-3 py-2 text-right font-bold text-amber-600">{fee.balance.toLocaleString()} RWF</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                        {getStatusIcon(fee.status)} {fee.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-slate-600">{fee.term}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => {
                          setSelectedStudent(fee.studentId);
                          fetchStudentSummary(fee.studentId);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                      >
                        📋 Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Fee Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowRecordForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <h2 className="text-lg font-bold text-white">Record Fee</h2>
              </div>
              <button onClick={() => setShowRecordForm(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleRecordFee} className="p-5 space-y-4">
              {/* Student Selection */}
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Student</h3>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  {students.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">No students found</div>
                  ) : (
                    students
                      .filter(s => filterGrade === "ALL" || s.grade === filterGrade)
                      .filter(s => filterClass === "ALL" || s.className === filterClass)
                      .map(student => (
                        <div
                          key={student._id}
                          onClick={() => handleSelectStudent(student)}
                          className={`p-2 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${
                            selectedStudentForFee?._id === student._id
                              ? "bg-emerald-50 border-l-4 border-l-emerald-500"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                              <p className="text-xs text-slate-400">{student.studentId}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-medium text-emerald-600">{student.grade}</span>
                              <span className="text-xs text-slate-400 ml-1">Class {student.className}</span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                {selectedStudentForFee && (
                  <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">Selected:</p>
                    <p className="text-sm font-semibold text-emerald-800">{selectedStudentForFee.name}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Fees *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalFees}
                    onChange={(e) => setForm({...form, totalFees: parseFloat(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid</label>
                  <input
                    type="number"
                    min="0"
                    max={form.totalFees}
                    value={form.amountPaid}
                    onChange={(e) => setForm({...form, amountPaid: parseFloat(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
                  <select
                    value={form.term}
                    onChange={(e) => setForm({...form, term: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {terms.map(t => <option key={t} value={t}>{t.replace("TERM", "Term ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="number"
                    value={form.academicYear}
                    onChange={(e) => setForm({...form, academicYear: parseInt(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({...form, paymentMethod: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({...form, reference: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Transaction reference..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Additional notes..."
                />
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  💰 {loading ? "Recording..." : "Record Fee"}
                </button>
                <button type="button" onClick={() => setShowRecordForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outstanding Fees Modal */}
      {showOutstanding && outstandingFees.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowOutstanding(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔴</span>
                <h2 className="text-lg font-bold">Outstanding Fees / Debtors</h2>
              </div>
              <button onClick={() => setShowOutstanding(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-rose-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-600">Total Debtors</p>
                  <p className="text-xl font-bold text-rose-700">{outstandingFees.length}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Total Balance</p>
                  <p className="text-xl font-bold text-amber-700">
                    {outstandingFees.reduce((sum, f) => sum + (f.balance || 0), 0).toLocaleString()} RWF
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600">Overdue</p>
                  <p className="text-xl font-bold text-red-700">
                    {outstandingFees.filter(f => f.status === "OVERDUE").length}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Partial Payments</p>
                  <p className="text-xl font-bold text-blue-700">
                    {outstandingFees.filter(f => f.status === "PARTIAL").length}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">📋 Debtors List</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {outstandingFees.map((fee, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                      <div>
                        <p className="font-medium text-slate-800">{fee.studentName}</p>
                        <p className="text-xs text-slate-400">{fee.studentId} - {fee.grade} {fee.className}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Balance</p>
                          <p className="text-sm font-bold text-amber-600">{fee.balance.toLocaleString()} RWF</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                          {getStatusIcon(fee.status)} {fee.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedStudent(fee.studentId);
                            fetchStudentSummary(fee.studentId);
                            setShowOutstanding(false);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                        >
                          📋 Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Fee Summary Modal */}
      {showStudentSummary && studentSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowStudentSummary(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h2 className="text-lg font-bold">Fee Summary</h2>
              </div>
              <button onClick={() => setShowStudentSummary(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-bold text-slate-800">{studentSummary.studentName}</p>
                <p className="text-xs text-slate-400">{studentSummary.studentId} - {studentSummary.grade} {studentSummary.className}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Fees</p>
                  <p className="text-lg font-bold text-blue-700">{studentSummary.totalFees?.toLocaleString()} RWF</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-700">{studentSummary.totalPaid?.toLocaleString()} RWF</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-600">Balance</p>
                <p className="text-2xl font-bold text-amber-700">{studentSummary.balance?.toLocaleString()} RWF</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Payment History</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {studentSummary.payments?.length > 0 ? (
                    studentSummary.payments.map((payment, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{payment.amount.toLocaleString()} RWF</p>
                          <p className="text-xs text-slate-400">{payment.paymentMethod} - {payment.reference || "No ref"}</p>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">No payments recorded</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowStudentSummary(false);
                    setSelectedStudentForFee(studentSummary.studentId);
                    setForm({
                      ...form,
                      studentId: studentSummary.studentId,
                      studentName: studentSummary.studentName,
                      studentGrade: studentSummary.grade,
                      studentClass: studentSummary.className,
                      term: filterTerm
                    });
                    setShowRecordForm(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  💰 Add Payment
                </button>
                <button
                  onClick={() => setShowStudentSummary(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}