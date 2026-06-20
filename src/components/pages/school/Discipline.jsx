import React, { useEffect, useState } from "react";
import { 
  addOffense, 
  getStudentDiscipline, 
  getClassDisciplineSummary,
  getConductReport,
  getStudents 
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function Discipline() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [disciplineRecords, setDisciplineRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  
  // Filters for student selection
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filters for reports/summary
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterSemester, setFilterSemester] = useState("TERM1");
  
  // Get user role
  const userType = localStorage.getItem("userType");
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "superadmin" || userType === "school_admin";
  const isTeacher = userType === "teacher";

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D"];
  const semesters = ["TERM1", "TERM2", "TERM3"];
  const offenseTypes = [
    { value: "MISCONDUCT", label: "General Misconduct", points: 2 },
    { value: "LATE_COMING", label: "Late Coming", points: 1 },
    { value: "FIGHTING", label: "Fighting", points: 5 },
    { value: "DISRESPECT", label: "Disrespect", points: 3 },
    { value: "OTHER", label: "Other", points: 2 }
  ];

  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    studentGrade: "",
    studentClass: "",
    offenseType: "MISCONDUCT",
    description: "",
    pointsDeducted: 2,
    semester: "TERM1"
  });

  // Fetch all students for the dropdown
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

  // Apply grade, class, and search filters
  const applyFilters = (studentList = students) => {
    let filtered = [...studentList];
    
    // Filter by grade
    if (selectedGrade !== "ALL") {
      filtered = filtered.filter(s => s.grade === selectedGrade);
    }
    
    // Filter by class
    if (selectedClass !== "ALL") {
      filtered = filtered.filter(s => s.className === selectedClass);
    }
    
    // Filter by search term (name or student ID)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(term) || 
        s.studentId?.toLowerCase().includes(term)
      );
    }
    
    setFilteredStudents(filtered);
  };

  // Apply filters when criteria change
  useEffect(() => {
    applyFilters();
  }, [selectedGrade, selectedClass, searchTerm, students]);

  // Fetch data on mount
  useEffect(() => {
    fetchAllStudents();
    if (isAdmin) {
      fetchSummary();
    }
  }, []);

  const fetchSummary = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const res = await getClassDisciplineSummary({ 
        semester: filterSemester,
        grade: filterGrade !== "ALL" ? filterGrade : undefined
      });
      setSummaryData(res.data);
      setDisciplineRecords(res.data.disciplines || []);
    } catch (error) {
      console.error("Failed to load summary:", error);
      if (error.response?.status === 403) {
        setError("You don't have permission to view discipline summary.");
      } else {
        setError("Failed to load summary");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const res = await getConductReport({
        semester: filterSemester,
        academicYear: new Date().getFullYear(),
        grade: filterGrade !== "ALL" ? filterGrade : undefined
      });
      setReportData(res.data);
      setShowReport(true);
    } catch (error) {
      console.error("Failed to load report:", error);
      if (error.response?.status === 403) {
        setError("You don't have permission to view conduct reports.");
      } else {
        setError("Failed to load report");
      }
    } finally {
      setLoading(false);
    }
  };

  // Update filters when grade/class/semester changes for summary
  useEffect(() => {
    if (isAdmin) {
      fetchSummary();
    }
  }, [filterGrade, filterSemester]);

  const handleSelectStudent = (student) => {
    setForm({
      ...form,
      studentId: student._id,
      studentName: student.name,
      studentGrade: student.grade,
      studentClass: student.className,
    });
  };

  const handleAddOffense = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      setError("Please select a student");
      return;
    }
    
    setLoading(true);
    try {
      await addOffense({
        studentId: form.studentId,
        offenseType: form.offenseType,
        description: form.description,
        pointsDeducted: form.pointsDeducted,
        semester: filterSemester
      });
      setSuccess("Offense recorded successfully!");
      setShowAddForm(false);
      setForm({
        studentId: "",
        studentName: "",
        studentGrade: "",
        studentClass: "",
        offenseType: "MISCONDUCT",
        description: "",
        pointsDeducted: 2,
        semester: filterSemester
      });
      setSelectedGrade("ALL");
      setSelectedClass("ALL");
      setSearchTerm("");
      if (isAdmin) {
        fetchSummary();
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to record offense");
    } finally {
      setLoading(false);
    }
  };

  const getConductStatus = (score) => {
    if (score >= 36) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (score >= 30) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 20) return { label: "Average", color: "text-amber-600", bg: "bg-amber-100" };
    return { label: "Poor", color: "text-rose-600", bg: "bg-rose-100" };
  };

  const handleOffenseTypeChange = (type) => {
    const offense = offenseTypes.find(o => o.value === type);
    setForm({
      ...form,
      offenseType: type,
      pointsDeducted: offense?.points || 2
    });
  };

  const exportData = disciplineRecords.map(record => ({
    studentName: record.studentName,
    studentId: record.studentId,
    conductScore: record.conductScore,
    conductStatus: getConductStatus(record.conductScore).label,
    offenseCount: record.offenses?.length || 0,
    recentOffense: record.offenses?.[record.offenses.length - 1]?.offenseType || "-"
  }));

  const exportColumns = [
    { key: "studentName", label: "Student Name" },
    { key: "studentId", label: "Student ID" },
    { key: "conductScore", label: "Conduct Score (/40)" },
    { key: "conductStatus", label: "Status" },
    { key: "offenseCount", label: "Total Offenses" },
    { key: "recentOffense", label: "Last Offense" }
  ];

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
                📋 Student Discipline & Conduct
              </h1>
              <p className="text-slate-300 text-sm">
                Track student behavior, record offenses, and monitor conduct scores
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
                <span>⚠️</span> Record Offense
              </button>
              {isAdmin && (
                <button
                  onClick={fetchReport}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                >
                  <span>📊</span> Conduct Report
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards - Only show for admins */}
          {isAdmin && summaryData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Students</p>
                <p className="text-2xl font-bold text-white mt-1">{summaryData.summary?.totalStudents || 0}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Avg Conduct Score</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{summaryData.summary?.averageConductScore || 0}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Offenses</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{summaryData.summary?.totalOffenses || 0}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Needs Intervention</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{summaryData.summary?.studentsWithLowConduct || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters for Summary/Report - Admin only */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select 
              value={filterGrade} 
              onChange={(e) => setFilterGrade(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All Grades</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              value={filterSemester} 
              onChange={(e) => setFilterSemester(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {semesters.map(s => <option key={s} value={s}>{s.replace("TERM", "Term ")}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Offense Distribution Chart Card - Admin only */}
      {isAdmin && summaryData?.offenseDistribution && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">📊 Offense Distribution</h3>
          <div className="space-y-2">
            {Object.entries(summaryData.offenseDistribution).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-28 text-xs font-medium text-slate-600">{type.replace("_", " ")}</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (count / (summaryData.summary?.totalOffenses || 1) * 100))}%` }}
                  />
                </div>
                <div className="w-12 text-xs font-bold text-amber-600">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Section - Admin only */}
      {isAdmin && disciplineRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Conduct Report</h3>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Student Conduct Report" 
              filename={`conduct_${filterSemester}_${new Date().getFullYear()}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Top Offenders - Admin only */}
      {isAdmin && summaryData?.topOffenders && summaryData.topOffenders.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-rose-50 to-amber-50">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span>⚠️</span> Students Needing Intervention (Top Offenders)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Conduct Score</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Offenses</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryData.topOffenders.map((student, idx) => {
                  const status = getConductStatus(student.conductScore);
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-800">{student.studentName}</td>
                      <td className="px-3 py-2 font-mono text-xs text-indigo-600">{student.studentId}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-bold ${status.color}`}>{student.conductScore}/40</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                          {student.offenseCount} offenses
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Offense Modal with Class-Based Student Selection */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3 flex justify-between items-center bg-gradient-to-r from-rose-50 to-amber-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-800">⚠️ Record Offense</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleAddOffense} className="p-5 space-y-4">
              {/* Student Selection Section */}
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">👨‍🎓 Select Student</h3>
                
                {/* Grade and Class Filters */}
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
                
                {/* Search Input */}
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                
                {/* Student List */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      No students found
                    </div>
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
                
                {/* Selected Student Display */}
                {form.studentId && (
                  <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">Selected Student:</p>
                    <p className="text-sm font-semibold text-emerald-800">{form.studentName}</p>
                    <p className="text-xs text-emerald-600">{form.studentGrade} Class {form.studentClass}</p>
                  </div>
                )}
              </div>

              {/* Offense Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Offense Type *</label>
                <select
                  value={form.offenseType}
                  onChange={(e) => handleOffenseTypeChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {offenseTypes.map(o => (
                    <option key={o.value} value={o.value}>{o.label} (-{o.points} points)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Describe what happened..."
                  required
                />
              </div>

              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-700">
                  ⚠️ Points Deducted: <strong>{form.pointsDeducted}</strong> points from conduct score (max 40)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading || !form.studentId} className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Recording..." : "Record Offense"}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conduct Report Modal - Admin only */}
      {isAdmin && showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📊 Conduct Report - {filterSemester.replace("TERM", "Term ")} {new Date().getFullYear()}</h2>
              <button onClick={() => setShowReport(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Students</p>
                  <p className="text-xl font-bold text-blue-700">{reportData.totalStudents}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Average Conduct</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData.overallAverage}</p>
                </div>
                <div className="bg-emerald-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-700">Excellent</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData.categories?.excellent?.count || 0}</p>
                </div>
                <div className="bg-rose-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-700">Needs Intervention</p>
                  <p className="text-xl font-bold text-rose-700">{reportData.studentsNeedingIntervention || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Conduct Categories</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-medium text-emerald-700">Excellent (36-40)</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(reportData.categories?.excellent?.count / reportData.totalStudents * 100) || 0}%` }} />
                    </div>
                    <div className="w-12 text-xs font-bold">{reportData.categories?.excellent?.count || 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-medium text-blue-700">Good (30-35)</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(reportData.categories?.good?.count / reportData.totalStudents * 100) || 0}%` }} />
                    </div>
                    <div className="w-12 text-xs font-bold">{reportData.categories?.good?.count || 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-medium text-amber-700">Average (20-29)</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(reportData.categories?.average?.count / reportData.totalStudents * 100) || 0}%` }} />
                    </div>
                    <div className="w-12 text-xs font-bold">{reportData.categories?.average?.count || 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-medium text-rose-700">Poor (0-19)</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(reportData.categories?.poor?.count / reportData.totalStudents * 100) || 0}%` }} />
                    </div>
                    <div className="w-12 text-xs font-bold">{reportData.categories?.poor?.count || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}