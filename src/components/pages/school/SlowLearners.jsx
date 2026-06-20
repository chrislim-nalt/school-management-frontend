import React, { useEffect, useState } from "react";
import { 
  createSlowLearnerCase, 
  getSlowLearnerCases, 
  addProgressNote,
  updateSlowLearnerStatus,
  getSlowLearnerReport,
  getStudents 
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function SlowLearners() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showCaseDetails, setShowCaseDetails] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSemester, setFilterSemester] = useState("TERM1");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  // Filters for student selection in modal
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D"];
  const semesters = ["TERM1", "TERM2", "TERM3"];
  const problemCategories = [
    { value: "READING", label: "Reading Difficulty", icon: "📖" },
    { value: "WRITING", label: "Writing Difficulty", icon: "✍️" },
    { value: "MATHEMATICS", label: "Mathematics Difficulty", icon: "🔢" },
    { value: "ATTENTION", label: "Attention/Focus Issues", icon: "🎯" },
    { value: "MEMORY", label: "Memory Retention Issues", icon: "🧠" },
    { value: "OTHER", label: "Other", icon: "📌" }
  ];

  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    studentGrade: "",
    studentClass: "",
    problemDescription: "",
    problemCategory: "READING",
    measuresTaken: "",
    semester: "TERM1"
  });

  const [progressForm, setProgressForm] = useState({
    note: "",
    improvementLevel: 50
  });

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      const allStudents = res.data || [];
      setStudents(allStudents);
      applyFilters(allStudents);
    } catch (error) {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (studentList = students) => {
    let filtered = [...studentList];
    if (selectedGrade !== "ALL") {
      filtered = filtered.filter(s => s.grade === selectedGrade);
    }
    if (selectedClass !== "ALL") {
      filtered = filtered.filter(s => s.className === selectedClass);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(term) || 
        s.studentId?.toLowerCase().includes(term)
      );
    }
    setFilteredStudents(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedGrade, selectedClass, searchTerm, students]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, casesRes] = await Promise.all([
        getStudents(),
        getSlowLearnerCases({ 
          semester: filterSemester, 
          grade: filterGrade !== "ALL" ? filterGrade : undefined,
          className: filterClass !== "ALL" ? filterClass : undefined,
          status: filterStatus !== "ALL" ? filterStatus : undefined
        })
      ]);
      setStudents(studentsRes.data || []);
      setCases(casesRes.data?.cases || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getSlowLearnerReport({
        semester: filterSemester,
        academicYear: new Date().getFullYear(),
        grade: filterGrade !== "ALL" ? filterGrade : undefined,
        className: filterClass !== "ALL" ? filterClass : undefined
      });
      setReportData(res.data);
      setShowReport(true);
    } catch (error) {
      console.error("Failed to load report:", error);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudents();
    fetchData();
  }, [filterGrade, filterClass, filterSemester, filterStatus]);

  const handleSelectStudent = (student) => {
    setForm({
      ...form,
      studentId: student._id,
      studentName: student.name,
      studentGrade: student.grade,
      studentClass: student.className,
    });
  };

  const handleAddCase = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.problemDescription) {
      setError("Please fill all required fields");
      return;
    }
    
    setLoading(true);
    try {
      await createSlowLearnerCase({
        studentId: form.studentId,
        problemDescription: form.problemDescription,
        problemCategory: form.problemCategory,
        measuresTaken: form.measuresTaken,
        semester: filterSemester
      });
      setSuccess("Case recorded successfully!");
      setShowAddForm(false);
      setForm({
        studentId: "",
        studentName: "",
        studentGrade: "",
        studentClass: "",
        problemDescription: "",
        problemCategory: "READING",
        measuresTaken: "",
        semester: filterSemester
      });
      setSelectedGrade("ALL");
      setSelectedClass("ALL");
      setSearchTerm("");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to record case");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgress = async (caseId) => {
    if (!progressForm.note) {
      setError("Please enter a progress note");
      return;
    }
    
    setLoading(true);
    try {
      await addProgressNote(caseId, progressForm);
      setSuccess("Progress note added!");
      setShowProgressForm(null);
      setProgressForm({ note: "", improvementLevel: 50 });
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to add progress note");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (caseId, status) => {
    setLoading(true);
    try {
      await updateSlowLearnerStatus(caseId, { status });
      setSuccess(`Status updated to ${status}`);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      IDENTIFIED: "bg-amber-100 text-amber-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      IMPROVING: "bg-emerald-100 text-emerald-700",
      RESOLVED: "bg-green-100 text-green-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const summaryStats = {
    total: cases.length,
    identified: cases.filter(c => c.status === "IDENTIFIED").length,
    inProgress: cases.filter(c => c.status === "IN_PROGRESS").length,
    improving: cases.filter(c => c.status === "IMPROVING").length,
    resolved: cases.filter(c => c.status === "RESOLVED").length,
    resolutionRate: cases.length > 0 ? ((cases.filter(c => c.status === "RESOLVED").length / cases.length) * 100).toFixed(1) : 0
  };

  const exportData = cases.map(c => ({
    "Student Name": c.studentName,
    "Student ID": c.studentId,
    "Grade": c.grade,
    "Class": c.className,
    "Problem Category": c.problemCategory,
    "Problem Description": c.problemDescription,
    "Measures Taken": c.measuresTaken?.join(", ") || "-",
    "Status": c.status,
    "Progress Notes": c.progressNotes?.length || 0,
    "Latest Improvement": c.progressNotes?.[c.progressNotes.length - 1]?.improvementLevel || "0%",
    "Last Update": c.progressNotes?.[c.progressNotes.length - 1]?.recordedAt 
      ? new Date(c.progressNotes[c.progressNotes.length - 1].recordedAt).toLocaleDateString() 
      : "-"
  }));

  const exportColumns = exportData.length > 0 ? Object.keys(exportData[0]).map(key => ({ key, label: key })) : [];

  return (
    <div className="space-y-4">
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm`}>
          <span className="text-lg">{success ? "✓" : "⚠"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                🎯 Slow Learners Support
              </h1>
              <p className="text-slate-300 text-sm">
                Track and manage students who need additional academic support
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedGrade("ALL");
                  setSelectedClass("ALL");
                  setSearchTerm("");
                  setShowAddForm(true);
                }}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span>➕</span> Add Case
              </button>
              <button
                onClick={fetchReport}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span>📊</span> Report
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {cases.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Cases</p>
                <p className="text-2xl font-bold text-white mt-1">{summaryStats.total}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Identified</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{summaryStats.identified}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">In Progress</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{summaryStats.inProgress}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Improving</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{summaryStats.improving}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Resolved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{summaryStats.resolved}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Resolution Rate</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{summaryStats.resolutionRate}%</p>
                <div className="mt-1 w-full bg-white/20 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full" style={{ width: `${summaryStats.resolutionRate}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select 
            value={filterSemester} 
            onChange={(e) => setFilterSemester(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            {semesters.map(s => <option key={s} value={s}>{s.replace("TERM", "Term ")}</option>)}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="IDENTIFIED">Identified</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IMPROVING">Improving</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <button 
            onClick={fetchData}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Export Section */}
      {cases.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Cases Report</h3>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Slow Learners Report" 
              filename={`slow_learners_${filterSemester}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Cases Table */}
      {loading && cases.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">🎯</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No slow learner cases</h3>
          <p className="text-slate-500 text-sm">Click "Add Case" to record a student needing support</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Problem</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Measures</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Progress</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((caseItem) => {
                  const progressCount = caseItem.progressNotes?.length || 0;
                  const latestImprovement = caseItem.progressNotes?.[progressCount - 1]?.improvementLevel || 0;
                  return (
                    <tr key={caseItem._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800 text-sm">{caseItem.studentName}</p>
                        <p className="text-xs text-slate-400">{caseItem.studentId} - {caseItem.grade} {caseItem.className}</p>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {problemCategories.find(c => c.value === caseItem.problemCategory)?.icon || "📌"} {caseItem.problemCategory}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-sm max-w-xs truncate">{caseItem.problemDescription}</td>
                      <td className="px-3 py-2 text-slate-600 text-sm max-w-xs truncate">{caseItem.measuresTaken?.join(", ") || "-"}</td>
                      <td className="px-3 py-2">
                        <select
                          value={caseItem.status}
                          onChange={(e) => handleUpdateStatus(caseItem._id, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-400 ${getStatusColor(caseItem.status)}`}
                        >
                          <option value="IDENTIFIED">🔍 Identified</option>
                          <option value="IN_PROGRESS">🔄 In Progress</option>
                          <option value="IMPROVING">📈 Improving</option>
                          <option value="RESOLVED">✅ Resolved</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold text-slate-600">{progressCount} notes</span>
                          {progressCount > 0 && (
                            <div className="mt-1 w-16 bg-slate-200 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${latestImprovement}%` }}></div>
                            </div>
                          )}
                          <span className="text-xs text-slate-400 mt-0.5">{latestImprovement}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => setShowProgressForm(caseItem)}
                            className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                          >
                            📝 Add Note
                          </button>
                          <button
                            onClick={() => setShowCaseDetails(caseItem)}
                            className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition"
                          >
                            📋 Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Case Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3 flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">➕ Add Slow Learner Case</h2>
              <button onClick={() => setShowAddForm(false)} className="text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddCase} className="p-5 space-y-4">
              {/* Student Selection */}
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Student</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="ALL">All Grades</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="ALL">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">No students found</div>
                  ) : (
                    filteredStudents.map(student => (
                      <div
                        key={student._id}
                        onClick={() => handleSelectStudent(student)}
                        className={`p-2 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${
                          form.studentId === student._id
                            ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.studentId}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-indigo-600">{student.grade}</span>
                            <span className="text-xs text-slate-400 ml-1">Class {student.className}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {form.studentId && (
                  <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">Selected:</p>
                    <p className="text-sm font-semibold text-emerald-800">{form.studentName}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Category *</label>
                <select
                  value={form.problemCategory}
                  onChange={(e) => setForm({...form, problemCategory: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {problemCategories.map(c => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Description *</label>
                <textarea
                  value={form.problemDescription}
                  onChange={(e) => setForm({...form, problemDescription: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Describe the specific difficulties the student is facing..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Measures Taken</label>
                <textarea
                  value={form.measuresTaken}
                  onChange={(e) => setForm({...form, measuresTaken: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Remedial classes, extra tutoring, special accommodations..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Saving..." : "Create Case"}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Note Modal */}
      {showProgressForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProgressForm(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">📝 Progress Note</h2>
              <button onClick={() => setShowProgressForm(null)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
                <p className="text-sm font-medium text-slate-800">{showProgressForm.studentName}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem</label>
                <p className="text-sm text-slate-600">{showProgressForm.problemDescription}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Progress Note *</label>
                <textarea
                  value={progressForm.note}
                  onChange={(e) => setProgressForm({...progressForm, note: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Describe the progress, improvements, or ongoing challenges..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Improvement Level (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressForm.improvementLevel}
                  onChange={(e) => setProgressForm({...progressForm, improvementLevel: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>No Improvement</span>
                  <span className="font-bold text-indigo-600">{progressForm.improvementLevel}%</span>
                  <span>Significant</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleAddProgress(showProgressForm._id)} disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Saving..." : "Add Progress Note"}
                </button>
                <button type="button" onClick={() => setShowProgressForm(null)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {showCaseDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowCaseDetails(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">Case Details - {showCaseDetails.studentName}</h2>
              <button onClick={() => setShowCaseDetails(null)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Student ID</p>
                  <p className="text-sm font-semibold">{showCaseDetails.studentId}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-sm font-semibold">{showCaseDetails.grade} {showCaseDetails.className}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600 font-semibold">Problem Category</p>
                <p className="text-sm">{showCaseDetails.problemCategory}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 font-semibold">Problem Description</p>
                <p className="text-sm">{showCaseDetails.problemDescription}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 font-semibold">Measures Taken</p>
                <p className="text-sm">{showCaseDetails.measuresTaken?.join(", ") || "-"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Progress Notes History</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {showCaseDetails.progressNotes?.length > 0 ? (
                    showCaseDetails.progressNotes.map((note, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Note #{idx + 1}</span>
                          <span className="text-xs text-slate-400">{new Date(note.recordedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{note.note}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Improvement:</span>
                          <div className="flex-1 mx-2">
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${note.improvementLevel}%` }}></div>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600">{note.improvementLevel}%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Recorded by: {note.recordedByName || "System"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No progress notes recorded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📊 Slow Learners Support Report</h2>
              <button onClick={() => setShowReport(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Cases</p>
                  <p className="text-xl font-bold text-blue-700">{reportData.summary?.totalCases}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Resolution Rate</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData.summary?.resolutionRate}%</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Resolved</p>
                  <p className="text-xl font-bold text-amber-700">{reportData.summary?.resolvedCount}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">Avg Improvement</p>
                  <p className="text-xl font-bold text-purple-700">{reportData.summary?.averageImprovement}%</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">By Problem Category</p>
                <div className="space-y-2">
                  {Object.entries(reportData.summary?.byCategory || {}).map(([category, count]) => {
                    const catInfo = problemCategories.find(c => c.value === category);
                    return (
                      <div key={category} className="flex items-center gap-2">
                        <div className="w-28 text-xs font-medium text-slate-700">
                          {catInfo?.icon} {category}
                        </div>
                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${(count / reportData.summary?.totalCases * 100) || 0}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs font-bold text-blue-600">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 mt-2">
                <p className="text-xs text-amber-700">
                  💡 <span className="font-semibold">Recommendation:</span> Schedule regular progress reviews and provide additional resources for the most common problem categories.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}