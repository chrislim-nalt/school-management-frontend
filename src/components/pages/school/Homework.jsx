import React, { useEffect, useState, useCallback } from "react";
import {
  assignHomework,
  getHomeworks,
  getHomeworkSubmissions,
  gradeHomework,
  getCourses,
  getStudents,
  getHomeworkReport
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

// --- Error Boundary Component ---
class HomeworkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Homework Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-rose-800">Something went wrong</h3>
          <p className="text-rose-600 text-sm mt-1">
            {this.state.error?.message || "Failed to load homework. Please refresh the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main Homework Component ---
function HomeworkComponent() {
  const [homeworks, setHomeworks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userType] = useState(localStorage.getItem("userType") || "staff");

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D"];

  const [form, setForm] = useState({
    courseId: "",
    grade: "S1",
    className: "A",
    title: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachments: []
  });

  const [gradeForm, setGradeForm] = useState({
    homeworkId: "",
    studentId: "",
    score: "",
    feedback: ""
  });

  // Fetch data with safe extraction
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterGrade !== "ALL") params.grade = filterGrade;
      if (filterClass !== "ALL") params.className = filterClass;

      const [homeworksRes, coursesRes, studentsRes] = await Promise.all([
        getHomeworks(params),
        getCourses(),
        getStudents()
      ]);

      const homeworksData = Array.isArray(homeworksRes.data) ? homeworksRes.data : [];
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : [];

      setHomeworks(homeworksData);
      setCourses(coursesData);
      setStudents(studentsData);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load data");
      setHomeworks([]);
      setCourses([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filterGrade, filterClass]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterGrade, filterClass]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHomeworks = homeworks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(homeworks.length / itemsPerPage);

  // Fetch submissions
  const fetchSubmissions = async (homeworkId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHomeworkSubmissions(homeworkId);
      setShowSubmissions(res.data);
    } catch (err) {
      console.error("Fetch submissions error:", err);
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  // Fetch report
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterGrade !== "ALL") params.grade = filterGrade;
      if (filterClass !== "ALL") params.className = filterClass;
      const res = await getHomeworkReport(params);
      setReportData(res.data);
      setShowReport(true);
    } catch (err) {
      console.error("Fetch report error:", err);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Handle assign
  const handleAssign = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.courseId || !form.title) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await assignHomework(form);
      setSuccess("✅ Homework assigned successfully!");
      setShowAssignForm(false);
      setForm({
        courseId: "",
        grade: "S1",
        className: "A",
        title: "",
        description: "",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        attachments: []
      });
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Assign homework error:", err);
      setError(err.response?.data?.message || "Failed to assign homework");
    } finally {
      setLoading(false);
    }
  };

  // Handle grade
  const handleGrade = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!gradeForm.score) {
      setError("Please enter a score");
      return;
    }

    setLoading(true);
    try {
      await gradeHomework(gradeForm);
      setSuccess("✅ Homework graded successfully!");
      setGradeForm({ homeworkId: "", studentId: "", score: "", feedback: "" });
      if (showSubmissions) {
        await fetchSubmissions(gradeForm.homeworkId);
      }
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Grade homework error:", err);
      setError("Failed to grade homework");
    } finally {
      setLoading(false);
    }
  };

  // Status color helper
  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-amber-100 text-amber-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      GRADED: "bg-emerald-100 text-emerald-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  // Get days remaining
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isTeacher = userType === "teacher" || userType === "staff";
  const isAdmin = userType === "school_admin" || userType === "admin";

  const exportData = (homeworks || []).map(h => ({
    title: h?.title || "-",
    courseName: h?.courseName || "-",
    teacherName: h?.teacherName || "-",
    grade: h?.grade || "-",
    className: h?.className || "-",
    assignedDate: h?.assignedDate ? formatDate(h.assignedDate) : "-",
    dueDate: h?.dueDate ? formatDate(h.dueDate) : "-",
    submissions: h?.submissions?.length || 0,
    graded: h?.submissions?.filter(s => s?.status === "GRADED").length || 0
  }));

  const exportColumns = [
    { key: "title", label: "Title" },
    { key: "courseName", label: "Course" },
    { key: "teacherName", label: "Teacher" },
    { key: "grade", label: "Grade" },
    { key: "className", label: "Class" },
    { key: "assignedDate", label: "Assigned Date" },
    { key: "dueDate", label: "Due Date" },
    { key: "submissions", label: "Submissions" },
    { key: "graded", label: "Graded" }
  ];

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✅" : "⚠️"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">
                  📚
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    Homework Management
                  </h1>
                  <p className="text-slate-300 text-sm">
                    {isTeacher ? "Assign and grade homework for your students" : "Monitor homework assignments and submissions"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isTeacher && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                >
                  <span className="text-lg">📝</span>
                  Assign Homework
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={fetchReport}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                >
                  <span className="text-lg">📊</span>
                  Analytics Report
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {reportData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">📚 Total</p>
                <p className="text-2xl font-bold text-white mt-1">{reportData.summary.totalAssignments || 0}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">✅ Completion</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{reportData.summary.averageCompletionRate || 0}%</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">📊 Avg Score</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{reportData.summary.averageScore || 0}%</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">📝 Submissions</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{reportData.summary.totalSubmissions || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </div>
        {(filterGrade !== "ALL" || filterClass !== "ALL") && (
          <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
            <button 
              onClick={() => { setFilterGrade("ALL"); setFilterClass("ALL"); }} 
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Export Section */}
      {homeworks.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📥</span>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Export Homework Report</h3>
                <p className="text-xs text-slate-400">Download in CSV, Excel, or PDF</p>
              </div>
            </div>
            <DownloadButton
              data={exportData}
              columns={exportColumns}
              title="Homework Report"
              filename={`homework_report_${new Date().toISOString().slice(0, 10)}`}
              variant="primary"
            />
          </div>
        </div>
      )}

      {/* Results Count */}
      {homeworks.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-3">
          <p className="text-xs text-slate-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, homeworks.length)} of {homeworks.length} assignments
          </p>
        </div>
      )}

      {/* Homework Table */}
      {loading && homeworks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : !Array.isArray(homeworks) || homeworks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📚</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No homework assigned</h3>
          <p className="text-slate-500 text-sm">
            {isTeacher ? "Click 'Assign Homework' to get started" : "No homework records found"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Course</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Class</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Assigned</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Due Date</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Submissions</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentHomeworks.map((homework) => {
                  const totalStudents = students.filter(s =>
                    s?.grade === homework?.grade && s?.className === homework?.className
                  ).length;
                  const submissionCount = homework?.submissions?.length || 0;
                  const gradedCount = homework?.submissions?.filter(s => s?.status === "GRADED").length || 0;
                  const daysRemaining = getDaysRemaining(homework?.dueDate);
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;

                  return (
                    <tr key={homework._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{homework?.title || "-"}</p>
                          {homework?.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{homework.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 text-sm">{homework?.courseName || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-600 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                          🏫 {homework?.grade || "-"} {homework?.className || ""}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 text-sm">
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{homework?.assignedDate ? formatDate(homework.assignedDate) : "-"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {homework?.dueDate ? formatDate(homework.dueDate) : "-"}
                          </span>
                          {daysRemaining !== null && (
                            <span className={`text-[10px] ${isOverdue ? 'text-rose-500' : daysRemaining <= 2 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            📝 {submissionCount} / {totalStudents || 0}
                          </span>
                          {gradedCount > 0 && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              ⭐ {gradedCount} graded
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => fetchSubmissions(homework._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all"
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    ◀ Prev
                  </button>
                  {getPageNumbers().map((page, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => typeof page === 'number' && setCurrentPage(page)} 
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === page 
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md" 
                          : page === '...' 
                          ? "text-slate-400 cursor-default" 
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Homework Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAssignForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h2 className="text-lg font-bold text-white">Assign Homework</h2>
              </div>
              <button onClick={() => setShowAssignForm(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course *</label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({...form, courseId: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.courseName} ({c.grade})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({...form, grade: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm({...form, className: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="e.g., Algebra Worksheet"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Detailed instructions for students..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({...form, dueDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                />
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  📝 {loading ? "Assigning..." : "Assign Homework"}
                </button>
                <button type="button" onClick={() => setShowAssignForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowSubmissions(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h2 className="text-lg font-bold">Submissions - {showSubmissions?.homework?.title || "Homework"}</h2>
              </div>
              <button onClick={() => setShowSubmissions(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">👥 Total Students</p>
                  <p className="text-lg font-bold text-indigo-600">{showSubmissions?.summary?.totalStudents || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">📝 Submitted</p>
                  <p className="text-lg font-bold text-emerald-600">{showSubmissions?.summary?.submitted || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">⭐ Graded</p>
                  <p className="text-lg font-bold text-purple-600">{showSubmissions?.summary?.graded || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">📊 Avg Score</p>
                  <p className="text-lg font-bold text-amber-600">{showSubmissions?.summary?.averageScore || 0}%</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Status</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Score</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showSubmissions?.submissions?.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{sub?.studentName || "-"}</td>
                        <td className="px-3 py-2 font-mono text-xs text-indigo-600">{sub?.studentId || "-"}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub?.status)}`}>
                            {sub?.status || "PENDING"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-indigo-600">{sub?.score || "-"}</td>
                        <td className="px-3 py-2 text-center">
                          {sub?.status === "SUBMITTED" && (
                            <button
                              onClick={() => {
                                setGradeForm({
                                  homeworkId: showSubmissions?.homework?.id,
                                  studentId: sub?.studentId,
                                  score: "",
                                  feedback: ""
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition"
                            >
                              ⭐ Grade
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeForm.homeworkId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setGradeForm({ homeworkId: "", studentId: "", score: "", feedback: "" })}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h2 className="text-lg font-bold text-white">Grade Submission</h2>
              </div>
              <button onClick={() => setGradeForm({ homeworkId: "", studentId: "", score: "", feedback: "" })} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleGrade} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Score (0-100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({...gradeForm, score: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback</label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Optional feedback for the student..."
                />
              </div>
              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  💾 {loading ? "Saving..." : "Submit Grade"}
                </button>
                <button type="button" onClick={() => setGradeForm({ homeworkId: "", studentId: "", score: "", feedback: "" })} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h2 className="text-lg font-bold">Homework Analytics Report</h2>
              </div>
              <button onClick={() => setShowReport(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">📚 Total Assignments</p>
                  <p className="text-xl font-bold text-blue-700">{reportData?.summary?.totalAssignments || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">✅ Completion Rate</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData?.summary?.averageCompletionRate || 0}%</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">📊 Average Score</p>
                  <p className="text-xl font-bold text-amber-700">{reportData?.summary?.averageScore || 0}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">📝 Total Submissions</p>
                  <p className="text-xl font-bold text-purple-700">{reportData?.summary?.totalSubmissions || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">👨‍🏫 By Teacher</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(reportData?.byTeacher || {}).map(([teacher, data]) => (
                    <div key={teacher} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">{teacher}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-blue-600 flex items-center gap-1">📚 {data?.total || 0}</span>
                        <span className="text-emerald-600 flex items-center gap-1">📝 {data?.submissions || 0}</span>
                        <span className="text-purple-600 flex items-center gap-1">⭐ {data?.graded || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">📖 By Course</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(reportData?.byCourse || []).map((course, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">{course?.courseName}</span>
                      <span className="text-sm font-bold text-indigo-600">{course?.averageScore || 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Wrapped Export with Error Boundary ---
export default function Homework() {
  return (
    <HomeworkErrorBoundary>
      <HomeworkComponent />
    </HomeworkErrorBoundary>
  );
}