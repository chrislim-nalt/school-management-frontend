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
  // Initialize all state with safe default values
  const [homeworks, setHomeworks] = useState([]); // Always an array
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(null); // Can be null or object
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
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

      // SAFETY: Ensure data is always an array
      const homeworksData = Array.isArray(homeworksRes.data) ? homeworksRes.data : [];
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : [];

      setHomeworks(homeworksData);
      setCourses(coursesData);
      setStudents(studentsData);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load data");
      // On error, set to empty array to prevent crashes
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
      setSuccess("Homework assigned successfully!");
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
      setSuccess("Homework graded successfully!");
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

  const isTeacher = userType === "teacher" || userType === "staff";
  const isAdmin = userType === "school_admin" || userType === "admin";

  // SAFETY: Ensure exportData uses safe fallbacks
  const exportData = (homeworks || []).map(h => ({
    title: h?.title || "-",
    courseName: h?.courseName || "-",
    teacherName: h?.teacherName || "-",
    grade: h?.grade || "-",
    className: h?.className || "-",
    assignedDate: h?.assignedDate ? new Date(h.assignedDate).toLocaleDateString() : "-",
    dueDate: h?.dueDate ? new Date(h.dueDate).toLocaleDateString() : "-",
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

  return (
    <div className="space-y-4">
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
          success ? "bg-emerald-500" : "bg-rose-500"
        } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✓" : "⚠"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl shadow-xl">
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                📚 Homework Management
              </h1>
              <p className="text-slate-300 text-sm">
                {isTeacher ? "Assign and grade homework for your students" : "Monitor homework assignments and submissions"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isTeacher && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                >
                  <span>📝</span> Assign Homework
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={fetchReport}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                >
                  <span>📊</span> Analytics Report
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards from Report - SAFETY: Use fallbacks */}
          {reportData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Assignments</p>
                <p className="text-2xl font-bold text-white mt-1">{reportData.summary.totalAssignments || 0}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Completion Rate</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{reportData.summary.averageCompletionRate || 0}%</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Average Score</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{reportData.summary.averageScore || 0}%</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Submissions</p>
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
        </div>
      </div>

      {/* Export Section */}
      {homeworks.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Homework Report</h3>
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

      {/* Homework Table - SAFETY: Ensure homeworks is an array before mapping */}
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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Title</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Course</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Grade/Class</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Due Date</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Submissions</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {homeworks.map((homework) => {
                  // SAFETY: Use optional chaining and fallbacks for all properties
                  const totalStudents = students.filter(s =>
                    s?.grade === homework?.grade && s?.className === homework?.className
                  ).length;
                  const submissionCount = homework?.submissions?.length || 0;
                  const gradedCount = homework?.submissions?.filter(s => s?.status === "GRADED").length || 0;

                  return (
                    <tr key={homework._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800 text-sm">{homework?.title || "-"}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{homework?.description || ""}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-sm">{homework?.courseName || "-"}</td>
                      <td className="px-3 py-2 text-slate-600 text-sm">{homework?.grade || "-"} {homework?.className || ""}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium ${homework?.dueDate && new Date(homework.dueDate) < new Date() ? "text-rose-600" : "text-emerald-600"}`}>
                          {homework?.dueDate ? new Date(homework.dueDate).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {submissionCount} / {totalStudents || 0}
                        </span>
                        {gradedCount > 0 && (
                          <span className="ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            ⭐ {gradedCount}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => fetchSubmissions(homework._id)}
                          className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                        >
                          View Submissions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {homeworks.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              Total: {homeworks.length} homework assignments
            </div>
          )}
        </div>
      )}

      {/* Assign Homework Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAssignForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold text-white">📝 Assign Homework</h2>
              <button onClick={() => setShowAssignForm(false)} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4">
              {/* ... form fields remain the same ... */}
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm({...form, className: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({...form, dueDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                />
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Assigning..." : "Assign Homework"}
                </button>
                <button type="button" onClick={() => setShowAssignForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal - SAFETY: Use fallbacks */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowSubmissions(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📋 Submissions - {showSubmissions?.homework?.title || "Homework"}</h2>
              <button onClick={() => setShowSubmissions(null)} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <div className="p-5">
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">Total Students</p>
                  <p className="text-lg font-bold text-indigo-600">{showSubmissions?.summary?.totalStudents || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">Submitted</p>
                  <p className="text-lg font-bold text-emerald-600">{showSubmissions?.summary?.submitted || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">Graded</p>
                  <p className="text-lg font-bold text-purple-600">{showSubmissions?.summary?.graded || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">Avg Score</p>
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
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition"
                            >
                              Grade
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
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold text-white">⭐ Grade Submission</h2>
              <button onClick={() => setGradeForm({ homeworkId: "", studentId: "", score: "", feedback: "" })} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <form onSubmit={handleGrade} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Score (0-100)</label>
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
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200">
                  ⚠️ {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Saving..." : "Submit Grade"}
                </button>
                <button type="button" onClick={() => setGradeForm({ homeworkId: "", studentId: "", score: "", feedback: "" })} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal - SAFETY: Use fallbacks */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📊 Homework Analytics Report</h2>
              <button onClick={() => setShowReport(false)} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Assignments</p>
                  <p className="text-xl font-bold text-blue-700">{reportData?.summary?.totalAssignments || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Completion Rate</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData?.summary?.averageCompletionRate || 0}%</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Average Score</p>
                  <p className="text-xl font-bold text-amber-700">{reportData?.summary?.averageScore || 0}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">Total Submissions</p>
                  <p className="text-xl font-bold text-purple-700">{reportData?.summary?.totalSubmissions || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">By Teacher</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(reportData?.byTeacher || {}).map(([teacher, data]) => (
                    <div key={teacher} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">{teacher}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-blue-600">📚 {data?.total || 0}</span>
                        <span className="text-emerald-600">📝 {data?.submissions || 0}</span>
                        <span className="text-purple-600">⭐ {data?.graded || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">By Course</p>
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