import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  getMyPermissions, 
  getHomeworks, 
  getCourses, 
  getStudents, 
  getHomeworkSummary,
  getRecentActivities,
  getSlowLearnerCases,
  getStudentActivities
} from "../../services/schoolService";

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalHomeworks: 0,
    myCourses: 0,
    myStudents: 0,
    homeworkPending: 0,
    homeworkOverdue: 0,
    recentActivities: 0,
    slowLearners: 0,
    recentActivityCount: 0
  });
  const [recentPermissions, setRecentPermissions] = useState([]);
  const [recentHomeworks, setRecentHomeworks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [slowLearnerCases, setSlowLearnerCases] = useState([]);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "Teacher");
  const [expandedActivity, setExpandedActivity] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { label: "Excellent", icon: "🌟", color: "bg-emerald-500" };
    if (percentage >= 75) return { label: "Good", icon: "👍", color: "bg-blue-500" };
    if (percentage >= 50) return { label: "Average", icon: "📊", color: "bg-amber-500" };
    if (percentage >= 30) return { label: "Poor", icon: "⚠️", color: "bg-orange-500" };
    return { label: "Failing", icon: "🔴", color: "bg-rose-500" };
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  const getPerformanceBarColor = (percentage) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        getMyPermissions().catch(err => {
          console.warn("Permissions API not available yet:", err.message);
          return { data: [] };
        }),
        getHomeworks().catch(err => {
          console.warn("Homeworks API not available yet:", err.message);
          return { data: [] };
        }),
        getCourses().catch(err => {
          console.warn("Courses API not available yet:", err.message);
          return { data: [] };
        }),
        getStudents().catch(err => {
          console.warn("Students API not available yet:", err.message);
          return { data: [] };
        }),
        getHomeworkSummary().catch(err => {
          console.warn("Homework summary API not available yet:", err.message);
          return { data: { summary: {} } };
        }),
        getRecentActivities({ term: "TERM1", limit: 60, teacherId: localStorage.getItem("userId") }).catch(err => {
          console.warn("Activities API not available yet:", err.message);
          return { data: { activities: [] } };
        }),
        getSlowLearnerCases({ semester: "TERM1" }).catch(err => {
          console.warn("Slow learners API not available yet:", err.message);
          return { data: { cases: [] } };
        })
      ]);

      const permissions = results[0].status === "fulfilled" ? (results[0].value?.data?.permissions || results[0].value?.data || []) : [];
      const homeworks = results[1].status === "fulfilled" ? (results[1].value?.data?.homeworks || results[1].value?.data || []) : [];
      const courses = results[2].status === "fulfilled" ? (results[2].value?.data || []) : [];
      const students = results[3].status === "fulfilled" ? (results[3].value?.data || []) : [];
      const summary = results[4].status === "fulfilled" ? (results[4].value?.data?.summary || {}) : {};
      
      // ============================================================
      // RECENT ACTIVITIES - grouped into per-assignment ("batch") summaries
      // with class-level analytics, matching the School Dashboard's
      // analyst-grade view. Scoped server-side to this teacher via
      // recordedBy (teacherId param).
      // ============================================================
      const activitiesData = results[5].status === "fulfilled" ? (results[5].value?.data || {}) : { activities: [] };
      const rawActivities = activitiesData.activities || [];

      const batchMap = {};
      rawActivities.forEach(a => {
        const marksTotal = a.marksTotal ?? 100;
        const marksObtained = a.marksObtained ?? 0;
        const percentage = marksTotal > 0
          ? Math.round((marksObtained / marksTotal) * 100)
          : Math.round(a.percentage || 0);

        const key = (a.batchId && a.batchId !== "-")
          ? a.batchId
          : `${a.title}__${a.courseName}__${a.date}__${a.grade}__${a.className}`;

        if (!batchMap[key]) {
          batchMap[key] = {
            batchId: a.batchId || key,
            title: a.title || "Activity",
            activityType: a.activityType || "EXERCISE",
            courseName: a.courseName || "-",
            grade: a.grade || "-",
            className: a.className || "-",
            date: a.date ? new Date(a.date) : new Date(0),
            marksTotal: marksTotal,
            students: []
          };
        }

        batchMap[key].students.push({
          studentName: a.studentName || "Unknown",
          studentId: a.studentId || "-",
          marksObtained,
          marksTotal,
          percentage,
          performanceLevel: a.performanceLevel || "AVERAGE"
        });
      });

      const recentActivitiesList = Object.values(batchMap)
        .map(batch => {
          const scores = batch.students.map(s => s.percentage);
          const totalStudents = scores.length;
          const average = totalStudents > 0
            ? parseFloat((scores.reduce((sum, s) => sum + s, 0) / totalStudents).toFixed(1))
            : 0;
          const passCount = scores.filter(s => s >= 50).length;
          const passRate = totalStudents > 0 ? parseFloat(((passCount / totalStudents) * 100).toFixed(1)) : 0;

          const sortedByScore = [...batch.students].sort((a, b) => b.percentage - a.percentage);
          const topPerformer = sortedByScore[0] || null;
          const weakestPerformer = sortedByScore[sortedByScore.length - 1] || null;

          const distribution = { EXCELLENT: 0, GOOD: 0, AVERAGE: 0, POOR: 0, FAILING: 0 };
          batch.students.forEach(s => {
            const level = (s.performanceLevel || "AVERAGE").toUpperCase();
            if (distribution[level] !== undefined) distribution[level]++;
          });

          return {
            ...batch,
            dateLabel: batch.date && batch.date.getTime() > 0 ? batch.date.toLocaleDateString() : "-",
            totalStudents,
            average,
            passRate,
            highest: totalStudents > 0 ? Math.max(...scores) : 0,
            lowest: totalStudents > 0 ? Math.min(...scores) : 0,
            topPerformer,
            weakestPerformer,
            distribution
          };
        })
        .sort((a, b) => b.date - a.date)
        .slice(0, 6);

      const myActivities = recentActivitiesList;
      
      const slowLearners = results[6].status === "fulfilled" ? (results[6].value?.data?.cases || []) : [];
      
      // Count slow learners in teacher's classes
      const teacherGrade = localStorage.getItem("grade") || "ALL";
      const teacherClass = localStorage.getItem("className") || "ALL";
      const mySlowLearners = slowLearners.filter(s => 
        (teacherGrade === "ALL" || s.grade === teacherGrade) && 
        (teacherClass === "ALL" || s.className === teacherClass)
      );

      setStats({
        pendingRequests: permissions.filter(p => p.status === "PENDING").length,
        totalHomeworks: homeworks.length,
        myCourses: courses.length,
        myStudents: students.length,
        homeworkPending: summary.pending || 0,
        homeworkOverdue: summary.overdue || 0,
        recentActivities: myActivities.length,
        slowLearners: mySlowLearners.length,
        recentActivityCount: myActivities.length
      });

      setRecentPermissions(permissions.slice(0, 5));
      setRecentHomeworks(homeworks.slice(0, 5));
      setRecentActivities(recentActivitiesList);
      setSlowLearnerCases(mySlowLearners.slice(0, 5));
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      setError("Failed to load some data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { path: "/attendance", label: "Mark Attendance", icon: "✅", color: "from-emerald-500 to-emerald-600" },
    { path: "/marks", label: "Record Marks", icon: "📝", color: "from-blue-500 to-blue-600" },
    { path: "/discipline", label: "Record Offense", icon: "⚠️", color: "from-amber-500 to-amber-600" },
    { path: "/homework", label: "Assign Homework", icon: "📚", color: "from-purple-500 to-purple-600" },
    { path: "/permissions", label: "Request Leave", icon: "📋", color: "from-indigo-500 to-indigo-600" },
    { path: "/activities", label: "Student Activities", icon: "✏️", color: "from-orange-500 to-orange-600" },
    { path: "/english-performance", label: "English Violation", icon: "🔴", color: "from-rose-500 to-rose-600" },
    { path: "/slow-learners", label: "Slow Learners", icon: "🧠", color: "from-teal-500 to-teal-600" }
  ];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Hero Section - Dark Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-3xl">
                👨‍🏫
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {getGreeting()}, {userName}!
                </h1>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <span>📅</span>
                  {getCurrentDate()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-xs text-slate-300">👨‍🏫 Teacher</span>
              </div>
            </div>
          </div>

          {/* Quick Stats - Dark Theme */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <p className="text-slate-300 text-xs">My Courses</p>
              </div>
              <p className="text-2xl font-bold text-indigo-300 mt-1">{stats.myCourses}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-lg">👨‍🎓</span>
                <p className="text-slate-300 text-xs">My Students</p>
              </div>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.myStudents}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <p className="text-slate-300 text-xs">Homework Pending</p>
              </div>
              <p className="text-2xl font-bold text-amber-300 mt-1">{stats.homeworkPending}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-lg">✏️</span>
                <p className="text-slate-300 text-xs">Recent Activities</p>
              </div>
              <p className="text-2xl font-bold text-orange-300 mt-1">{stats.recentActivities}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <p className="text-slate-300 text-xs">Slow Learners</p>
              </div>
              <p className="text-2xl font-bold text-rose-300 mt-1">{stats.slowLearners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-indigo-100 rounded-lg text-lg">
            ⚡
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className={`bg-gradient-to-r ${action.color} text-white p-3 rounded-xl text-center hover:opacity-90 transition-all hover:scale-105 group`}
            >
              <div className="flex items-center justify-center mb-1">
                <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
              </div>
              <div className="text-[10px] font-medium leading-tight">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Permissions */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="font-semibold text-slate-800 text-sm">Leave Requests</h3>
            </div>
            {recentPermissions.length > 0 && (
              <Link to="/permissions" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all →
              </Link>
            )}
          </div>
          {recentPermissions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <span className="text-3xl">📋</span>
              <span>No leave requests yet</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {recentPermissions.map((permission) => (
                <div key={permission._id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{permission.reason}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>📅</span>
                      {permission.startDate ? new Date(permission.startDate).toLocaleDateString() : "N/A"} - 
                      {permission.endDate ? new Date(permission.endDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                    permission.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                    permission.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    permission.status === "REVOKED" ? "bg-slate-100 text-slate-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {permission.status === "APPROVED" ? "✅" :
                     permission.status === "PENDING" ? "⏳" :
                     permission.status === "REVOKED" ? "🔄" :
                     "❌"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Homework */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <h3 className="font-semibold text-slate-800 text-sm">Recent Homework</h3>
            </div>
            {recentHomeworks.length > 0 && (
              <Link to="/homework" className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View all →
              </Link>
            )}
          </div>
          {recentHomeworks.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <span className="text-3xl">📚</span>
              <span>No homework assigned yet</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {recentHomeworks.map((homework) => {
                const isOverdue = new Date(homework.dueDate) < new Date();
                return (
                  <div key={homework._id} className="px-4 py-3 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{homework.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">🏫 {homework.grade} {homework.className}</span>
                          <span className="text-xs text-slate-500">📖 {homework.courseName}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ml-2 ${isOverdue ? "text-rose-600" : "text-emerald-600"}`}>
                        {isOverdue ? "❌" : "✅"}
                        {new Date(homework.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Slow Learners */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h3 className="font-semibold text-slate-800 text-sm">Slow Learners</h3>
            </div>
            {slowLearnerCases.length > 0 && (
              <Link to="/slow-learners" className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                View all →
              </Link>
            )}
          </div>
          {slowLearnerCases.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <span className="text-3xl">🎯</span>
              <span>No slow learners in your classes</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {slowLearnerCases.map((caseItem) => (
                <div key={caseItem._id} className="px-4 py-3 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{caseItem.studentName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">🏫 {caseItem.grade} {caseItem.className}</span>
                        <span className="text-xs text-slate-500">📋 {caseItem.problemCategory}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ml-2 px-2 py-0.5 rounded-full ${
                      caseItem.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                      caseItem.status === "IMPROVING" ? "bg-emerald-100 text-emerald-700" :
                      caseItem.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                  {caseItem.averagePerformanceScore > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-slate-400">Avg Score:</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${caseItem.averagePerformanceScore >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(caseItem.averagePerformanceScore, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{caseItem.averagePerformanceScore}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities Section - Teacher's own activities */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 rounded-lg text-lg">
              ✏️
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">My Recent Activities</h3>
            {recentActivities.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{recentActivities.length}</span>
            )}
          </div>
          {recentActivities.length > 0 && (
            <Link to="/activities" className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View all →
            </Link>
          )}
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm flex flex-col items-center gap-2">
            <span className="text-3xl">✏️</span>
            <span>No activities assigned yet</span>
            <Link to="/activities" className="text-xs text-orange-500 hover:text-orange-600 underline">
              Assign an activity →
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {recentActivities.map((activity, idx) => {
              const distTotal = activity.totalStudents || 1;
              const distSegments = [
                { key: "EXCELLENT", color: "bg-emerald-500", count: activity.distribution.EXCELLENT },
                { key: "GOOD", color: "bg-blue-500", count: activity.distribution.GOOD },
                { key: "AVERAGE", color: "bg-amber-500", count: activity.distribution.AVERAGE },
                { key: "POOR", color: "bg-orange-500", count: activity.distribution.POOR },
                { key: "FAILING", color: "bg-rose-500", count: activity.distribution.FAILING }
              ];
              const rowKey = activity.batchId || idx;
              const isExpanded = expandedActivity === rowKey;
              return (
                <div key={rowKey} className="border border-slate-100 rounded-lg hover:border-slate-200 transition">
                  <div className="px-3 py-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{activity.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-medium">
                            {activity.activityType}
                          </span>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full font-medium">
                            {activity.courseName}
                          </span>
                          <span className="text-[10px] text-slate-400">{activity.grade} {activity.className} · 📅 {activity.dateLabel}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedActivity(isExpanded ? null : rowKey)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0 whitespace-nowrap"
                      >
                        {isExpanded ? "Hide ▲" : "Details ▼"}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">Submitted</p>
                        <p className="text-xs font-bold text-slate-700">{activity.totalStudents}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">Average</p>
                        <p className={`text-xs font-bold ${getPerformanceColor(activity.average)}`}>{activity.average}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">Pass Rate</p>
                        <p className={`text-xs font-bold ${activity.passRate >= 50 ? "text-emerald-600" : "text-rose-600"}`}>{activity.passRate}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">High / Low</p>
                        <p className="text-xs font-bold">
                          <span className="text-emerald-600">{activity.highest}%</span>
                          <span className="text-slate-300"> / </span>
                          <span className="text-rose-500">{activity.lowest}%</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-slate-100 mt-2">
                      {distSegments.map(seg => seg.count > 0 && (
                        <div
                          key={seg.key}
                          className={seg.color}
                          style={{ width: `${(seg.count / distTotal) * 100}%` }}
                          title={`${seg.key}: ${seg.count}`}
                        />
                      ))}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-white rounded-lg p-2 border border-slate-100">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-0.5">Top Performer</p>
                          {activity.topPerformer ? (
                            <p className="text-xs font-medium text-slate-700 truncate">
                              {activity.topPerformer.studentName}
                              <span className="text-emerald-600 font-bold"> · {activity.topPerformer.percentage}%</span>
                            </p>
                          ) : <span className="text-xs text-slate-400">-</span>}
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-0.5">Needs Support</p>
                          {activity.weakestPerformer ? (
                            <p className="text-xs font-medium text-slate-700 truncate">
                              {activity.weakestPerformer.studentName}
                              <span className="text-rose-600 font-bold"> · {activity.weakestPerformer.percentage}%</span>
                            </p>
                          ) : <span className="text-xs text-slate-400">-</span>}
                        </div>
                      </div>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Full Roster ({activity.totalStudents} students, max {activity.marksTotal} pts)
                      </p>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-100 bg-white">
                        {[...activity.students]
                          .sort((a, b) => b.percentage - a.percentage)
                          .map((s, sIdx) => {
                            const perf = getPerformanceLevel(s.percentage);
                            return (
                              <div key={sIdx} className="flex justify-between items-center px-2.5 py-1.5 border-b border-slate-50 last:border-0">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-slate-700 truncate">{s.studentName}</p>
                                  <p className="text-[9px] text-slate-400">{s.studentId}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs text-slate-600">{s.marksObtained}/{s.marksTotal}</span>
                                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white ${perf.color}`}>
                                    {perf.icon} {s.percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Teaching Overview Stats */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-purple-100 rounded-lg text-lg">
            📊
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">Teaching Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center hover:bg-blue-100 transition">
            <p className="text-2xl font-bold text-blue-600">{stats.totalHomeworks}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">📚 Total Homework</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center hover:bg-emerald-100 transition">
            <p className="text-2xl font-bold text-emerald-600">{stats.myCourses}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">📖 Courses</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center hover:bg-purple-100 transition">
            <p className="text-2xl font-bold text-purple-600">{stats.myStudents}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">👨‍🎓 Students</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center hover:bg-amber-100 transition">
            <p className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">📋 Pending Leave</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center hover:bg-orange-100 transition">
            <p className="text-2xl font-bold text-orange-600">{stats.recentActivities}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">✏️ Activities</p>
          </div>
        </div>
      </div>

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