import React, { useEffect, useState, useCallback } from "react";
import { 
  assignActivityToClass,
  getClassActivities,
  getClassPerformanceDashboard,
  getActivityTrends,
  getStudentActivities,
  updateStudentScore,
  getStudents,
  getCourses
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

// --- Error Boundary ---
class ActivitiesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Activities Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-rose-800">Something went wrong</h3>
          <p className="text-rose-600 text-sm mt-1">
            {this.state.error?.message || "Failed to load activities. Please refresh the page."}
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

// --- Main Component ---
function ActivitiesComponent() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [groupedBatches, setGroupedBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [showTrends, setShowTrends] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [editingScore, setEditingScore] = useState(null);
  
  // Filters
  const [filterGrade, setFilterGrade] = useState("P1");
  const [filterClass, setFilterClass] = useState("A");
  const [filterTerm, setFilterTerm] = useState("TERM1");

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D"];
  const terms = ["TERM1", "TERM2", "TERM3"];
  const activityTypes = [
    { value: "EXERCISE", label: "Exercise", icon: "✏️", color: "bg-blue-100 text-blue-700" },
    { value: "QUIZ", label: "Quiz", icon: "📝", color: "bg-purple-100 text-purple-700" },
    { value: "HOMEWORK", label: "Homework", icon: "📚", color: "bg-emerald-100 text-emerald-700" },
    { value: "EXAM", label: "Exam", icon: "📋", color: "bg-amber-100 text-amber-700" }
  ];

  const [form, setForm] = useState({
    grade: "P1",
    className: "A",
    courseId: "",
    activityType: "EXERCISE",
    title: "",
    description: "",
    maxScore: 100,
    date: new Date().toISOString().split('T')[0],
    term: "TERM1"
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesRes = await getCourses();
      let coursesData = [];
      if (Array.isArray(coursesRes.data)) {
        coursesData = coursesRes.data;
      } else if (coursesRes.data && Array.isArray(coursesRes.data.courses)) {
        coursesData = coursesRes.data.courses;
      }
      setCourses(coursesData);

      if (filterGrade !== "ALL" && filterClass !== "ALL") {
        const [studentsRes, activitiesRes] = await Promise.all([
          getStudents(),
          getClassActivities({ 
            grade: filterGrade,
            className: filterClass,
            term: filterTerm
          })
        ]);
        
        const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : [];
        const activitiesData = activitiesRes.data || {};
        
        setStudents(studentsData.filter(s => s?.grade === filterGrade && s?.className === filterClass));
        setActivities(activitiesData.activities || []);
        setGroupedBatches(activitiesData.groupedByBatch || []);
      } else {
        setActivities([]);
        setGroupedBatches([]);
        setStudents([]);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load data");
      setActivities([]);
      setGroupedBatches([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [filterGrade, filterClass, filterTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchDashboard = async () => {
    if (filterGrade === "ALL" || filterClass === "ALL") {
      setError("Please select a specific grade and class to view dashboard");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await getClassPerformanceDashboard({
        grade: filterGrade,
        className: filterClass,
        term: filterTerm
      });
      setDashboardData(res.data);
      setShowDashboard(true);
    } catch (err) {
      console.error("Fetch dashboard error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    if (filterGrade === "ALL" || filterClass === "ALL") {
      setError("Please select a specific grade and class to view trends");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityTrends({
        grade: filterGrade,
        className: filterClass
      });
      setTrendData(res.data);
      setShowTrends(true);
    } catch (err) {
      console.error("Fetch trends error:", err);
      setError("Failed to load trends");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!form.grade || !form.className || !form.courseId || !form.title) {
      setError("Please fill all required fields");
      return;
    }
    
    setLoading(true);
    try {
      await assignActivityToClass(form);
      setSuccess(`✅ Activity assigned to ${form.grade} ${form.className} successfully!`);
      setShowAssignForm(false);
      setForm({
        grade: form.grade,
        className: form.className,
        courseId: "",
        activityType: "EXERCISE",
        title: "",
        description: "",
        maxScore: 100,
        date: new Date().toISOString().split('T')[0],
        term: filterTerm
      });
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Assign activity error:", err);
      setError(err.response?.data?.message || "Failed to assign activity");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!editingScore) return;
    
    setLoading(true);
    setError(null);
    try {
      await updateStudentScore({
        activityId: editingScore.activityId,
        studentId: editingScore.studentId,
        score: parseFloat(editingScore.score)
      });
      setSuccess("✅ Score updated successfully!");
      setEditingScore(null);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Update score error:", err);
      setError(err.response?.data?.message || "Failed to update score");
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeInfo = (type) => {
    return activityTypes.find(a => a.value === type) || activityTypes[0];
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-700";
    if (percentage >= 70) return "bg-blue-100 text-blue-700";
    if (percentage >= 60) return "bg-amber-100 text-amber-700";
    if (percentage >= 50) return "bg-orange-100 text-orange-700";
    return "bg-rose-100 text-rose-700";
  };

  const exportData = activities.map(a => ({
    studentName: a?.studentName || "-",
    studentId: a?.studentId || "-",
    courseName: a?.courseName || "-",
    activityType: a?.activityType || "-",
    title: a?.title || "-",
    score: a?.score || 0,
    maxScore: a?.maxScore || 100,
    percentage: a?.percentage || 0,
    date: a?.date ? new Date(a.date).toLocaleDateString() : "-"
  }));

  const exportColumns = [
    { key: "studentName", label: "Student" },
    { key: "studentId", label: "ID" },
    { key: "courseName", label: "Course" },
    { key: "activityType", label: "Type" },
    { key: "title", label: "Title" },
    { key: "score", label: "Score" },
    { key: "maxScore", label: "Max" },
    { key: "percentage", label: "Percentage" },
    { key: "date", label: "Date" }
  ];

  return (
    <div className="space-y-4">
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✅" : "⚠️"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section - Dark Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">
                  ✏️
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    Class Activities
                  </h1>
                  <p className="text-slate-300 text-sm">
                    Assign activities to classes and track student performance
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setForm({
                    ...form,
                    grade: filterGrade !== "ALL" ? filterGrade : "P1",
                    className: filterClass !== "ALL" ? filterClass : "A",
                    term: filterTerm
                  });
                  setShowAssignForm(true);
                }}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span className="text-lg">➕</span>
                Assign Activity
              </button>
              <button
                onClick={fetchDashboard}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span className="text-lg">📊</span>
                Dashboard
              </button>
              <button
                onClick={fetchTrends}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span className="text-lg">📈</span>
                Trends
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
      </div>

      {/* Export Section */}
      {activities.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📥</span>
              <h3 className="font-semibold text-slate-800 text-sm">Export Activities</h3>
            </div>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Class Activities Report" 
              filename={`activities_${filterGrade}_${filterClass}_${filterTerm}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Activity Batches - Grouped by Assignment */}
      {loading && activities.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : filterGrade === "ALL" || filterClass === "ALL" ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Select a Grade and Class</h3>
          <p className="text-slate-500 text-sm">Use the filters above to view activities for a specific class</p>
        </div>
      ) : groupedBatches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No activities assigned</h3>
          <p className="text-slate-500 text-sm">Click "Assign Activity" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedBatches.map((batch) => {
            const typeInfo = getActivityTypeInfo(batch.activityType);
            return (
              <div key={batch.batchId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                {/* Batch Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">{batch.title}</h3>
                    <span className="text-xs text-slate-400">{batch.courseName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="text-slate-500 flex items-center gap-1">
                      📅 {new Date(batch.date).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                      🎯 Max: {batch.maxScore}pts
                    </span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      ✅ {batch.statistics?.completionRate || 0}%
                    </span>
                    <span className="text-indigo-600 flex items-center gap-1">
                      📊 {batch.statistics?.averageScore || 0}%
                    </span>
                  </div>
                </div>
                
                {/* Student Scores - Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Score</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Percentage</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batch.students?.map((student) => (
                        <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-medium text-slate-800">{student.studentName}</td>
                          <td className="px-3 py-2 font-mono text-xs text-indigo-600">{student.studentId}</td>
                          <td className="px-3 py-2 text-center font-medium">{student.score || 0}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(student.percentage || 0)}`}>
                              {student.percentage || 0}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                setEditingScore({
                                  activityId: student.activityId || batch.batchId,
                                  studentId: student.studentId,
                                  studentName: student.studentName,
                                  score: student.score || 0,
                                  maxScore: batch.maxScore
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                              ✏️ Update Score
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Student Scores - Mobile Cards */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {batch.students?.map((student) => (
                    <div key={student.studentId} className="p-3 hover:bg-slate-50 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{student.studentName}</p>
                          <p className="text-xs text-slate-400">{student.studentId}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(student.percentage || 0)}`}>
                          {student.percentage || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3">
                          <div>
                            <p className="text-[10px] text-slate-400">Score</p>
                            <p className="text-sm font-medium text-slate-800">{student.score || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400">Max</p>
                            <p className="text-sm font-medium text-slate-800">{batch.maxScore}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setEditingScore({
                              activityId: student.activityId || batch.batchId,
                              studentId: student.studentId,
                              studentName: student.studentName,
                              score: student.score || 0,
                              maxScore: batch.maxScore
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                        >
                          ✏️ Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Batch Stats */}
                <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2">
                  <span className="flex items-center gap-1">👥 Total: {batch.statistics?.totalStudents || 0}</span>
                  <span className="flex items-center gap-1">✅ Submitted: {batch.statistics?.submitted || 0}</span>
                  <span className="flex items-center gap-1">📊 Average: {batch.statistics?.averageScore || 0}%</span>
                  <span className="flex items-center gap-1">🏆 Pass Rate: {batch.statistics?.passRate || 0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Activity Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAssignForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <h2 className="text-lg font-bold text-white">Assign Activity to Class</h2>
              </div>
              <button onClick={() => setShowAssignForm(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade *</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({...form, grade: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    required
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm({...form, className: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course *</label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({...form, courseId: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                >
                  <option value="">Select Course</option>
                  {Array.isArray(courses) && courses.length > 0 ? (
                    courses.filter(c => c.grade === form.grade).map(c => (
                      <option key={c._id} value={c._id}>
                        {c.courseName} ({c.grade})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No courses available</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Type *</label>
                  <select
                    value={form.activityType}
                    onChange={(e) => setForm({...form, activityType: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {activityTypes.map(a => (
                      <option key={a.value} value={a.value}>
                        {a.icon} {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxScore}
                    onChange={(e) => setForm({...form, maxScore: parseInt(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="e.g., Algebra Quiz, Chapter 1 Test"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Instructions for students..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({...form, date: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
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
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  ✏️ {loading ? "Assigning..." : "Assign Activity"}
                </button>
                <button type="button" onClick={() => setShowAssignForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Score Modal */}
      {editingScore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingScore(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <h2 className="text-lg font-bold text-white">Update Score</h2>
              </div>
              <button onClick={() => setEditingScore(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateScore} className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700">Student</p>
                <p className="text-base font-bold text-slate-800">{editingScore.studentName}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Score (0 - {editingScore.maxScore})</label>
                <input
                  type="number"
                  min="0"
                  max={editingScore.maxScore}
                  value={editingScore.score}
                  onChange={(e) => setEditingScore({...editingScore, score: parseFloat(e.target.value)})}
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
                  💾 {loading ? "Saving..." : "Update Score"}
                </button>
                <button type="button" onClick={() => setEditingScore(null)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Modal */}
      {showDashboard && dashboardData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDashboard(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h2 className="text-lg font-bold">Class Performance Dashboard</h2>
              </div>
              <button onClick={() => setShowDashboard(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1">👥 Total Students</p>
                  <p className="text-xl font-bold text-blue-700">{dashboardData?.classInfo?.totalStudents || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600 flex items-center justify-center gap-1">✏️ Total Activities</p>
                  <p className="text-xl font-bold text-purple-700">{dashboardData?.classInfo?.totalActivities || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600 flex items-center justify-center gap-1">📊 Overall Average</p>
                  <p className="text-xl font-bold text-emerald-700">{dashboardData?.summary?.overallAverage || 0}%</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 flex items-center justify-center gap-1">🏆 Pass Rate</p>
                  <p className="text-xl font-bold text-amber-700">{dashboardData?.summary?.passRate || 0}%</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">📊 Activity Type Performance</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(dashboardData?.activityTypeStats || {}).map(([type, data]) => {
                    const info = getActivityTypeInfo(type);
                    return (
                      <div key={type} className={`${info.color} rounded-lg p-2 text-center`}>
                        <p className="text-xs font-medium flex items-center justify-center gap-1">{info.icon} {info.label}</p>
                        <p className="text-lg font-bold">{data?.average || 0}%</p>
                        <p className="text-[10px] opacity-75">{data?.count || 0} activities</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">🏆 Top Performers</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(dashboardData?.studentRanking || []).slice(0, 10).map((student, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">#{idx + 1}</span>
                        <span className="text-sm font-medium">{student?.studentName || "Unknown"}</span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-emerald-600 flex items-center gap-1">📊 {student?.average || 0}%</span>
                        <span className="text-blue-600 flex items-center gap-1">✏️ {student?.totalActivities || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Modal */}
      {showTrends && trendData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowTrends(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <h2 className="text-lg font-bold">Activity Trends</h2>
              </div>
              <button onClick={() => setShowTrends(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1">✏️ Total Activities</p>
                  <p className="text-xl font-bold text-blue-700">{trendData?.summary?.totalActivities || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600 flex items-center justify-center gap-1">📊 Overall Average</p>
                  <p className="text-xl font-bold text-emerald-700">{trendData?.summary?.overallAverage || 0}%</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 flex items-center justify-center gap-1">📈 Improvement</p>
                  <p className="text-xl font-bold text-amber-700">{trendData?.summary?.improvement || 0}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600 flex items-center justify-center gap-1">📅 Days Tracked</p>
                  <p className="text-xl font-bold text-purple-700">{trendData?.summary?.totalDays || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">📈 Daily Performance Trend</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {(trendData?.trendData || []).slice(-30).map((day) => (
                    <div key={day.date} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                      <span className="text-xs text-slate-500 w-20 truncate">📅 {day.date}</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${day.average >= 70 ? 'bg-emerald-500' : day.average >= 50 ? 'bg-amber-500' : 'bg-rose-500'} rounded-full transition-all`}
                          style={{ width: `${Math.min(day.average || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">{day.average || 0}%</span>
                      <span className="text-xs text-slate-400 w-12 flex items-center gap-1">✏️ {day.count || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">⭐ 7-Day Moving Average</p>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                  {(trendData?.trendData || []).slice(-7).map((day) => (
                    <div key={day.date} className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-slate-500 truncate">📅 {day.date}</p>
                      <p className="text-sm font-bold text-indigo-600">{day.movingAverage || 0}%</p>
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
export default function Activities() {
  return (
    <ActivitiesErrorBoundary>
      <ActivitiesComponent />
    </ActivitiesErrorBoundary>
  );
}