import React, { useEffect, useState, useCallback } from "react";
import { 
  assignActivityToClass,
  getClassActivities,
  getActivityDates,
  updateActivityBatch,
  deleteActivityBatch,
  bulkUpdateBatchScores,
  getClassPerformanceDashboard,
  getActivityTrends,
  getStudentActivities,
  getStudents,
  getCourses,
  getSlowLearnerCases,
  autoDetectSlowLearners,
  autoCreateSlowLearnerCases
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
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [showTrends, setShowTrends] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [showSlowLearnerDetect, setShowSlowLearnerDetect] = useState(false);
  const [slowLearnerData, setSlowLearnerData] = useState(null);

  // Edit / Delete assigned activity
  const [editingBatch, setEditingBatch] = useState(null);
  const [editBatchForm, setEditBatchForm] = useState({
    title: "", description: "", activityType: "EXERCISE", maxScore: 100, date: ""
  });
  const [deletingBatchId, setDeletingBatchId] = useState(null);

  // Bulk score entry
  const [bulkScoreBatch, setBulkScoreBatch] = useState(null);
  const [bulkScores, setBulkScores] = useState({});
  const [savingBulkScores, setSavingBulkScores] = useState(false);

  // Filters
  const [filterGrade, setFilterGrade] = useState("P1");
  const [filterClass, setFilterClass] = useState("A");
  const [filterTerm, setFilterTerm] = useState("TERM1");

  // Course + Date scoping (new) — the user must pick a course, then a date,
  // before any activities are shown. This keeps the page to one course/one
  // day at a time instead of dumping every course and every date together.
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [datesLoading, setDatesLoading] = useState(false);

  const grades = ["Baby", "Middle", "Top", "P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["ELOHIM", "SHAMA"];
  const terms = ["TERM1", "TERM2", "TERM3"];
  const activityTypes = [
    { value: "EXERCISE", label: "Exercise", icon: "✏️", color: "bg-blue-100 text-blue-700" },
    { value: "QUIZ", label: "Quiz", icon: "📝", color: "bg-purple-100 text-purple-700" },
    { value: "HOMEWORK", label: "Homework", icon: "📚", color: "bg-emerald-100 text-emerald-700" },
    { value: "EXAM", label: "Exam", icon: "📋", color: "bg-amber-100 text-amber-700" }
  ];

  const performanceLevels = [
    { value: "EXCELLENT", label: "Excellent", icon: "🌟", color: "bg-emerald-500 text-white" },
    { value: "GOOD", label: "Good", icon: "👍", color: "bg-blue-500 text-white" },
    { value: "AVERAGE", label: "Average", icon: "📊", color: "bg-amber-500 text-white" },
    { value: "POOR", label: "Poor", icon: "⚠️", color: "bg-orange-500 text-white" },
    { value: "FAILING", label: "Failing", icon: "🔴", color: "bg-rose-500 text-white" }
  ];

  const [form, setForm] = useState({
    grade: "P1",
    className: "ELOHIM",
    courseId: "",
    activityType: "EXERCISE",
    title: "",
    description: "",
    maxScore: 100,
    date: new Date().toISOString().split('T')[0],
    term: "TERM1"
  });

  const todayISO = new Date().toISOString().split("T")[0];

  // Turns "2026-09-14" into "Last Monday, 14 Sep 2026" (or "Today"/"Yesterday")
  // so teachers scan dates by day-of-week instead of parsing raw numbers.
  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - d) / 86400000);
    const dateFmt = d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });

    if (diffDays === 0) return `Today, ${dateFmt}`;
    if (diffDays === 1) return `Yesterday, ${dateFmt}`;
    if (diffDays > 1 && diffDays <= 7) return `Last ${weekday}, ${dateFmt}`;
    return `${weekday}, ${dateFmt}`;
  };

  // ==================== BASE DATA (courses + students) ====================
  const fetchBaseData = useCallback(async () => {
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
        const studentsRes = await getStudents();
        const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : [];
        setStudents(studentsData.filter(s => s?.grade === filterGrade && s?.className === filterClass));
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Fetch base data error:", err);
      setError("Failed to load data");
      setCourses([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filterGrade, filterClass]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  // Reset everything downstream whenever grade/class changes — a course
  // chosen for P1 shouldn't silently carry over to S3.
  useEffect(() => {
    setSelectedCourseId("");
    setAvailableDates([]);
    setGroupedBatches([]);
    setActivities([]);
  }, [filterGrade, filterClass]);

  // ==================== DATES FOR THE SELECTED COURSE ====================
  const fetchDates = useCallback(async () => {
    if (!selectedCourseId || filterGrade === "ALL" || filterClass === "ALL") {
      setAvailableDates([]);
      return;
    }
    setDatesLoading(true);
    try {
      const res = await getActivityDates({
        grade: filterGrade,
        className: filterClass,
        courseId: selectedCourseId,
        term: filterTerm
      });
      const dates = res.data?.dates || [];
      setAvailableDates(dates);

      // Default to today if it already has activities; otherwise fall back
      // to the most recent date on record so the teacher sees real data
      // immediately instead of an empty screen.
      if (dates.some(d => d.date === todayISO)) {
        setSelectedDate(todayISO);
      } else if (dates.length > 0) {
        setSelectedDate(dates[0].date);
      } else {
        setSelectedDate(todayISO);
      }
    } catch (err) {
      console.error("Fetch dates error:", err);
      setAvailableDates([]);
    } finally {
      setDatesLoading(false);
    }
  }, [selectedCourseId, filterGrade, filterClass, filterTerm, todayISO]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  // ==================== BATCHES FOR THE SELECTED COURSE + DATE ====================
  const fetchBatchesForDate = useCallback(async () => {
    if (!selectedCourseId || !selectedDate || filterGrade === "ALL" || filterClass === "ALL") {
      setGroupedBatches([]);
      setActivities([]);
      return;
    }
    setBatchesLoading(true);
    setError(null);
    try {
      const res = await getClassActivities({
        grade: filterGrade,
        className: filterClass,
        term: filterTerm,
        courseId: selectedCourseId,
        startDate: selectedDate,
        endDate: selectedDate
      });
      const activitiesData = res.data || {};
      setActivities(activitiesData.activities || []);
      setGroupedBatches(activitiesData.groupedByBatch || []);
    } catch (err) {
      console.error("Fetch batches error:", err);
      setError("Failed to load activities for this date");
      setGroupedBatches([]);
      setActivities([]);
    } finally {
      setBatchesLoading(false);
    }
  }, [selectedCourseId, selectedDate, filterGrade, filterClass, filterTerm]);

  useEffect(() => {
    fetchBatchesForDate();
  }, [fetchBatchesForDate]);

  const refreshAfterChange = async () => {
    await fetchDates();
    await fetchBatchesForDate();
  };

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

  const detectSlowLearners = async () => {
    if (filterGrade === "ALL" || filterClass === "ALL") {
      setError("Please select a specific grade and class to detect slow learners");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await autoDetectSlowLearners({
        grade: filterGrade,
        className: filterClass,
        term: filterTerm
      });
      setSlowLearnerData(res.data);
      setShowSlowLearnerDetect(true);
    } catch (err) {
      console.error("Detect slow learners error:", err);
      setError("Failed to detect slow learners");
    } finally {
      setLoading(false);
    }
  };

  const createSlowLearnerCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await autoCreateSlowLearnerCases({
        grade: filterGrade,
        className: filterClass,
        term: filterTerm
      });
      setSuccess(`✅ ${res.data.message || `${res.data.summary?.created || 0} slow learner cases created`}`);
      setShowSlowLearnerDetect(false);
      await refreshAfterChange();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error("Create slow learner cases error:", err);
      setError("Failed to create slow learner cases");
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
      const assignedCourseId = form.courseId;
      const assignedDate = form.date;
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
      // Jump straight to the course + date that was just assigned, so the
      // teacher immediately sees what they created instead of an empty view.
      setSelectedCourseId(assignedCourseId);
      setSelectedDate(assignedDate);
      await fetchBaseData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Assign activity error:", err);
      setError(err.response?.data?.message || "Failed to assign activity");
    } finally {
      setLoading(false);
    }
  };

  // ==================== EDIT ASSIGNED ACTIVITY ====================
  const openEditBatch = (batch) => {
    setEditingBatch(batch);
    setEditBatchForm({
      title: batch.title || "",
      description: batch.description || "",
      activityType: batch.activityType || "EXERCISE",
      maxScore: batch.maxScore || 100,
      date: batch.date ? new Date(batch.date).toISOString().split("T")[0] : todayISO
    });
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await updateActivityBatch(editingBatch.batchId, editBatchForm);
      setSuccess(`✅ ${res.data?.message || "Assigned activity updated"}`);
      setEditingBatch(null);
      await refreshAfterChange();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error("Update batch error:", err);
      setError(err.response?.data?.message || "Failed to update assigned activity");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Delete "${batch.title}" (${batch.courseName})? This removes it for all ${batch.students?.length || 0} students and cannot be undone.`)) {
      return;
    }
    setDeletingBatchId(batch.batchId);
    setError(null);
    try {
      await deleteActivityBatch(batch.batchId);
      setSuccess("🗑️ Assigned activity deleted");
      await refreshAfterChange();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete batch error:", err);
      setError(err.response?.data?.message || "Failed to delete assigned activity");
    } finally {
      setDeletingBatchId(null);
    }
  };

  // ==================== BULK SCORE ENTRY ====================
  const openBulkScore = (batch) => {
    setBulkScoreBatch(batch);
    const initial = {};
    (batch.students || []).forEach(s => {
      initial[s.activityId] = s.marksObtained ?? s.score ?? 0;
    });
    setBulkScores(initial);
  };

  const handleBulkScoreChange = (activityId, value) => {
    setBulkScores(prev => ({ ...prev, [activityId]: value }));
  };

  const handleSaveBulkScores = async () => {
    if (!bulkScoreBatch) return;
    setSavingBulkScores(true);
    setError(null);
    try {
      const res = await bulkUpdateBatchScores(bulkScoreBatch.batchId, bulkScores);
      setSuccess(`✅ ${res.data?.message || "Scores saved"}`);
      setBulkScoreBatch(null);
      setBulkScores({});
      await fetchBatchesForDate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Bulk save scores error:", err);
      setError(err.response?.data?.message || "Failed to save scores");
    } finally {
      setSavingBulkScores(false);
    }
  };

  const getActivityTypeInfo = (type) => {
    return activityTypes.find(a => a.value === type) || activityTypes[0];
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return performanceLevels[0];
    if (percentage >= 75) return performanceLevels[1];
    if (percentage >= 50) return performanceLevels[2];
    if (percentage >= 30) return performanceLevels[3];
    return performanceLevels[4];
  };

  // The API's field name for "who created/assigned this" has varied
  // (createdBy as a populated object, createdByName as a flat string,
  // teacher, assignedBy, etc). Check every shape we've seen so the name
  // shows up regardless of which one the backend is currently sending.
  const getCreatorName = (obj) => {
    if (!obj) return "Unknown";
    return (
      obj.createdByName ||
      obj.recordedByName ||
      obj.teacherName ||
      obj.assignedByName ||
      (obj.createdBy && typeof obj.createdBy === "object" ? obj.createdBy.name : null) ||
      (obj.recordedBy && typeof obj.recordedBy === "object" ? obj.recordedBy.name : null) ||
      (obj.assignedBy && typeof obj.assignedBy === "object" ? obj.assignedBy.name : null) ||
      (obj.teacher && typeof obj.teacher === "object" ? obj.teacher.name : null) ||
      (typeof obj.createdBy === "string" ? obj.createdBy : null) ||
      (typeof obj.assignedBy === "string" ? obj.assignedBy : null) ||
      (typeof obj.teacher === "string" ? obj.teacher : null) ||
      "Unknown"
    );
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-700";
    if (percentage >= 70) return "bg-blue-100 text-blue-700";
    if (percentage >= 60) return "bg-amber-100 text-amber-700";
    if (percentage >= 50) return "bg-orange-100 text-orange-700";
    return "bg-rose-100 text-rose-700";
  };

  // Export is now naturally scoped to one course + one date at a time (since
  // that's all that's ever loaded on screen), which is what actually fixes
  // the "dates getting mixed" problem — there's only ever one date in view.
  const exportData = activities.map(a => ({
    studentName: a?.studentName || "-",
    studentId: a?.studentId || "-",
    courseName: a?.courseName || "-",
    activityType: a?.activityType || "-",
    title: a?.title || "-",
    marksObtained: a?.marksObtained || 0,
    marksTotal: a?.marksTotal || 100,
    percentage: a?.percentage || 0,
    performanceLevel: a?.performanceLevel || "-",
    date: a?.date || null,
    createdBy: getCreatorName(a)
  }));

  const exportColumns = [
    { key: "studentName", label: "Student" },
    { key: "studentId", label: "ID" },
    { key: "courseName", label: "Course" },
    { key: "activityType", label: "Type" },
    { key: "title", label: "Title" },
    { key: "marksObtained", label: "Score" },
    { key: "marksTotal", label: "Max" },
    { key: "percentage", label: "Percentage" },
    { key: "performanceLevel", label: "Performance" },
    { key: "date", label: "Date" },
    { key: "createdBy", label: "Created By" }
  ];

  const selectedCourse = courses.find(c => c._id === selectedCourseId);
  const coursesForGrade = Array.isArray(courses) ? courses.filter(c => c.grade === filterGrade) : [];

  // Merge today into the dropdown even if it has no activities yet, so the
  // teacher can always jump to "Today" to assign something new.
  const dateOptions = (() => {
    const map = new Map();
    availableDates.forEach(d => map.set(d.date, d.batchCount));
    if (!map.has(todayISO)) map.set(todayISO, 0);
    return Array.from(map.entries())
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, batchCount]) => ({ date, batchCount }));
  })();

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
                    courseId: selectedCourseId || "",
                    date: selectedDate || new Date().toISOString().split('T')[0],
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
              <button
                onClick={detectSlowLearners}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span className="text-lg">🎯</span>
                Detect Slow Learners
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters: Grade / Class / Term */}
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

        {/* Course + Date scoping — only appears once a real grade/class is picked */}
        {filterGrade !== "ALL" && filterClass !== "ALL" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">📘 Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                <option value="">Select a course...</option>
                {coursesForGrade.map(c => (
                  <option key={c._id} value={c._id}>{c.courseName}</option>
                ))}
              </select>
              {coursesForGrade.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">No courses found for {filterGrade}. Add one in Courses & Subjects first.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">📅 Date</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!selectedCourseId || datesLoading}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                {!selectedCourseId ? (
                  <option value="">Select a course first</option>
                ) : (
                  dateOptions.map(d => (
                    <option key={d.date} value={d.date}>
                      {formatDateLabel(d.date)}{d.batchCount > 0 ? ` — ${d.batchCount} assigned` : " — nothing assigned"}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Export Section */}
      {activities.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📥</span>
              <h3 className="font-semibold text-slate-800 text-sm">Export Activities</h3>
              <span className="text-xs text-slate-400">{selectedCourse?.courseName} — {formatDateLabel(selectedDate)}</span>
            </div>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Class Activities Report" 
              subtitle={`${filterGrade} ${filterClass} — ${selectedCourse?.courseName || ""} — ${formatDateLabel(selectedDate)}`}
              filename={`activities_${filterGrade}_${filterClass}_${selectedCourse?.courseName || "course"}_${selectedDate}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Activity Batches - Grouped by Assignment, scoped to course + date */}
      {(loading || batchesLoading) && groupedBatches.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : filterGrade === "ALL" || filterClass === "ALL" ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Select a Grade and Class</h3>
          <p className="text-slate-500 text-sm">Use the filters above to view activities for a specific class</p>
        </div>
      ) : !selectedCourseId ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📘</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Select a Course</h3>
          <p className="text-slate-500 text-sm">Choose which subject's activities you want to view</p>
        </div>
      ) : groupedBatches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Nothing assigned for {formatDateLabel(selectedDate)}</h3>
          <p className="text-slate-500 text-sm">Click "Assign Activity" to add one, or pick a different date above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedBatches.map((batch) => {
            const typeInfo = getActivityTypeInfo(batch.activityType);
            return (
              <div key={batch.batchId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                {/* Batch Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{batch.title}</h3>
                    <span className="text-xs text-slate-400">{batch.courseName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="text-slate-500 flex items-center gap-1">
                      👤 {getCreatorName(batch)}
                    </span>
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

                {/* Batch Actions */}
                <div className="px-4 py-2 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openBulkScore(batch)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-xs font-semibold hover:shadow-md transition"
                  >
                    📝 Update Marks
                  </button>
                  <button
                    onClick={() => openEditBatch(batch)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition"
                  >
                    ✏️ Edit Details
                  </button>
                  <button
                    onClick={() => handleDeleteBatch(batch)}
                    disabled={deletingBatchId === batch.batchId}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    {deletingBatchId === batch.batchId ? "Deleting..." : "🗑️ Delete"}
                  </button>
                  {batch.description && (
                    <span className="text-xs text-slate-400 italic truncate">— {batch.description}</span>
                  )}
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
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batch.students?.map((student) => {
                        const marksObtained = student.marksObtained || student.score || 0;
                        const marksTotal = student.marksTotal || batch.maxScore || 100;
                        const percentage = student.percentage || (marksTotal > 0 ? (marksObtained / marksTotal * 100) : 0);
                        const performance = getPerformanceLevel(percentage);
                        const isSlowLearner = student.isSlowLearner || false;
                        
                        return (
                          <tr key={student.studentId} className={`hover:bg-slate-50 transition-colors ${isSlowLearner ? 'bg-amber-50' : ''}`}>
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {student.studentName}
                              {isSlowLearner && (
                                <span className="ml-1.5 text-xs text-amber-600">🎯</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-indigo-600">{student.studentId}</td>
                            <td className="px-3 py-2 text-center font-medium">
                              {marksObtained} / {marksTotal}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(percentage)}`}>
                                {Math.round(percentage)}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${performance.color}`}>
                                {performance.icon} {performance.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Student Scores - Mobile Cards */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {batch.students?.map((student) => {
                    const marksObtained = student.marksObtained || student.score || 0;
                    const marksTotal = student.marksTotal || batch.maxScore || 100;
                    const percentage = student.percentage || (marksTotal > 0 ? (marksObtained / marksTotal * 100) : 0);
                    const performance = getPerformanceLevel(percentage);
                    const isSlowLearner = student.isSlowLearner || false;
                    
                    return (
                      <div key={student.studentId} className={`p-3 ${isSlowLearner ? 'bg-amber-50' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {student.studentName}
                              {isSlowLearner && (
                                <span className="ml-1.5 text-xs text-amber-600">🎯</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{student.studentId}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${performance.color}`}>
                            {performance.icon} {performance.label}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <div>
                            <p className="text-[10px] text-slate-400">Score</p>
                            <p className="text-sm font-medium text-slate-800">{marksObtained} / {marksTotal}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400">Percentage</p>
                            <p className="text-sm font-bold text-slate-800">{Math.round(percentage)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Batch Stats */}
                <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2">
                  <span className="flex items-center gap-1">👥 Total: {batch.statistics?.totalStudents || 0}</span>
                  <span className="flex items-center gap-1">✅ Submitted: {batch.statistics?.submitted || 0}</span>
                  <span className="flex items-center gap-1">📊 Average: {batch.statistics?.averageScore || 0}%</span>
                  <span className="flex items-center gap-1">🏆 Pass Rate: {batch.statistics?.passRate || 0}%</span>
                  <span className="flex items-center gap-1">🎯 Slow Learners: {batch.statistics?.slowLearnerCount || 0}</span>
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
                    onChange={(e) => setForm({...form, grade: e.target.value, courseId: ""})}
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

      {/* Edit Assigned Activity Modal */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setEditingBatch(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">✏️</span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white">Edit Assigned Activity</h2>
                  <p className="text-xs text-white/80 truncate">{editingBatch.courseName}</p>
                </div>
              </div>
              <button onClick={() => setEditingBatch(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl flex-shrink-0">
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateBatch} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={editBatchForm.title}
                  onChange={(e) => setEditBatchForm({...editBatchForm, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Type</label>
                  <select
                    value={editBatchForm.activityType}
                    onChange={(e) => setEditBatchForm({...editBatchForm, activityType: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  >
                    {activityTypes.map(a => (
                      <option key={a.value} value={a.value}>{a.icon} {a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    min="1"
                    value={editBatchForm.maxScore}
                    onChange={(e) => setEditBatchForm({...editBatchForm, maxScore: parseInt(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                  <p className="text-[10px] text-amber-600 mt-1">Lowering this will cap any scores currently above it.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Instructions</label>
                <textarea
                  value={editBatchForm.description}
                  onChange={(e) => setEditBatchForm({...editBatchForm, description: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editBatchForm.date}
                  onChange={(e) => setEditBatchForm({...editBatchForm, date: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  💾 {loading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingBatch(null)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Update Marks Modal */}
      {bulkScoreBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setBulkScoreBatch(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 flex justify-between items-center rounded-t-xl z-10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">📝</span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white">Update Marks</h2>
                  <p className="text-xs text-white/80 truncate">{bulkScoreBatch.title} — {bulkScoreBatch.courseName} (out of {bulkScoreBatch.maxScore})</p>
                </div>
              </div>
              <button onClick={() => setBulkScoreBatch(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl flex-shrink-0">
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-3">Enter marks for each student below, then save everyone at once.</p>
              <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
                {bulkScoreBatch.students?.map((student) => (
                  <div key={student.activityId} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{student.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{student.studentId}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number"
                        min="0"
                        max={bulkScoreBatch.maxScore}
                        value={bulkScores[student.activityId] ?? ""}
                        onChange={(e) => handleBulkScoreChange(student.activityId, e.target.value)}
                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                      <span className="text-xs text-slate-400">/ {bulkScoreBatch.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2 mt-3">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100">
                <button
                  onClick={handleSaveBulkScores}
                  disabled={savingBulkScores}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  💾 {savingBulkScores ? "Saving all..." : `Save All (${bulkScoreBatch.students?.length || 0} students)`}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkScoreBatch(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                <div className="bg-rose-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-600 flex items-center justify-center gap-1">🎯 Slow Learners</p>
                  <p className="text-xl font-bold text-rose-700">{dashboardData?.summary?.slowLearnerCount || 0}</p>
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
                        {student?.isSlowLearner && (
                          <span className="text-xs text-amber-600">🎯</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-emerald-600 flex items-center gap-1">📊 {student?.average || 0}%</span>
                        <span className="text-blue-600 flex items-center gap-1">✏️ {student?.totalActivities || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">💡 Performance Insight</p>
                <p className="text-sm text-amber-600">
                  {dashboardData?.summary?.slowLearnerCount > 0 
                    ? `🎯 ${dashboardData.summary.slowLearnerCount} students have been identified as slow learners. Consider providing additional support and resources.`
                    : "✅ No slow learners detected in this class. All students are performing at or above expectations."}
                </p>
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

      {/* Slow Learner Detection Modal */}
      {showSlowLearnerDetect && slowLearnerData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowSlowLearnerDetect(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h2 className="text-lg font-bold">Slow Learner Detection</h2>
              </div>
              <button onClick={() => setShowSlowLearnerDetect(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Students</p>
                  <p className="text-xl font-bold text-blue-700">{slowLearnerData?.summary?.totalStudents || 0}</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-600">Detected</p>
                  <p className="text-xl font-bold text-rose-700">{slowLearnerData?.summary?.slowLearnersFound || 0}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Threshold</p>
                  <p className="text-xl font-bold text-amber-700">{slowLearnerData?.summary?.threshold || 50}%</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Activities Scanned</p>
                  <p className="text-xl font-bold text-emerald-700">{slowLearnerData?.summary?.totalActivities || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">🎯 Detected Slow Learners</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(slowLearnerData?.slowLearners || []).map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <p className="font-medium text-slate-800">{entry.student?.name}</p>
                        <p className="text-xs text-slate-400">{entry.student?.studentId} - {entry.student?.grade} {entry.student?.className}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Average</p>
                          <p className="text-sm font-bold text-rose-600">{entry.averagePercentage}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Activities</p>
                          <p className="text-sm font-bold text-blue-600">{entry.totalActivities}</p>
                        </div>
                        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                          🆕 {entry.status || "IDENTIFIED"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={createSlowLearnerCases}
                  disabled={loading || (slowLearnerData?.summary?.slowLearnersFound || 0) === 0}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  🎯 {loading ? "Creating..." : "Create Slow Learner Cases"}
                </button>
                <button
                  onClick={() => setShowSlowLearnerDetect(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>

              {(slowLearnerData?.summary?.slowLearnersFound || 0) === 0 && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <span>
                    {slowLearnerData?.summary?.totalStudents > 0
                      ? "No slow learners detected in this class. All students are performing at or above expectations (or haven't reached the minimum 3 activities yet)."
                      : "No activities found for the selected grade, class and term."}
                  </span>
                </div>
              )}
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