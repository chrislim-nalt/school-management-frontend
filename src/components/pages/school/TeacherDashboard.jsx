import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyPermissions, getHomeworks, getCourses, getStudents, getHomeworkSummary } from "../../services/schoolService";

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalHomeworks: 0,
    myCourses: 0,
    myStudents: 0,
    homeworkPending: 0,
    homeworkOverdue: 0
  });
  const [recentPermissions, setRecentPermissions] = useState([]);
  const [recentHomeworks, setRecentHomeworks] = useState([]);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "Teacher");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Use Promise.allSettled to handle individual failures gracefully
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
        })
      ]);

      const permissions = results[0].status === "fulfilled" ? (results[0].value?.data?.permissions || results[0].value?.data || []) : [];
      const homeworks = results[1].status === "fulfilled" ? (results[1].value?.data?.homeworks || results[1].value?.data || []) : [];
      const courses = results[2].status === "fulfilled" ? (results[2].value?.data || []) : [];
      const students = results[3].status === "fulfilled" ? (results[3].value?.data || []) : [];
      const summary = results[4].status === "fulfilled" ? (results[4].value?.data?.summary || {}) : {};

      setStats({
        pendingRequests: permissions.filter(p => p.status === "PENDING").length,
        totalHomeworks: homeworks.length,
        myCourses: courses.length,
        myStudents: students.length,
        homeworkPending: summary.pending || 0,
        homeworkOverdue: summary.overdue || 0
      });

      setRecentPermissions(permissions.slice(0, 5));
      setRecentHomeworks(homeworks.slice(0, 5));
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      setError("Failed to load some data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { path: "/attendance", label: "Mark Attendance", icon: "✅", color: "bg-emerald-500" },
    { path: "/marks", label: "Record Marks", icon: "📝", color: "bg-blue-500" },
    { path: "/discipline", label: "Record Offense", icon: "⚠️", color: "bg-amber-500" },
    { path: "/homework", label: "Assign Homework", icon: "📚", color: "bg-purple-500" },
    { path: "/permissions", label: "Request Leave", icon: "📋", color: "bg-indigo-500" },
    { path: "/activities", label: "Student Activities", icon: "✏️", color: "bg-orange-500" },
    { path: "/english-performance", label: "English Violation", icon: "🔴", color: "bg-rose-500" },
    { path: "/slow-learners", label: "Slow Learners", icon: "🧠", color: "bg-teal-500" }
  ];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
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
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-3xl border border-white/20">
              👨‍🏫
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-indigo-200 text-sm mt-1">
                Manage your classes, track student progress, and stay organized
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">My Courses</p>
              <p className="text-2xl font-bold text-indigo-300">{stats.myCourses}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">My Students</p>
              <p className="text-2xl font-bold text-emerald-300">{stats.myStudents}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Homework Pending</p>
              <p className="text-2xl font-bold text-amber-300">{stats.homeworkPending}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Leave Requests</p>
              <p className="text-2xl font-bold text-rose-300">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className={`${action.color} text-white p-3 rounded-xl text-center hover:opacity-90 transition-all hover:scale-105 group`}
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{action.icon}</div>
              <div className="text-xs font-medium">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Permissions */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">📋 Recent Leave Requests</h3>
            {recentPermissions.length > 0 && (
              <Link to="/permissions" className="text-xs text-indigo-600 hover:text-indigo-700">View all →</Link>
            )}
          </div>
          {recentPermissions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No leave requests yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPermissions.map((permission) => (
                <div key={permission._id} className="px-4 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{permission.reason}</p>
                    <p className="text-xs text-slate-400">
                      {permission.startDate ? new Date(permission.startDate).toLocaleDateString() : "N/A"} - 
                      {permission.endDate ? new Date(permission.endDate).toLocaleDateString() : "N/A"}
                      {permission.totalDays && ` (${permission.totalDays} days)`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    permission.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                    permission.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    permission.status === "REVOKED" ? "bg-slate-100 text-slate-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {permission.status === "APPROVED" ? "✅ Approved" :
                     permission.status === "PENDING" ? "⏳ Pending" :
                     permission.status === "REVOKED" ? "🔄 Revoked" :
                     "❌ Disapproved"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Homework */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">📚 Recent Homework</h3>
            {recentHomeworks.length > 0 && (
              <Link to="/homework" className="text-xs text-indigo-600 hover:text-indigo-700">View all →</Link>
            )}
          </div>
          {recentHomeworks.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No homework assigned yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentHomeworks.map((homework) => (
                <div key={homework._id} className="px-4 py-2">
                  <p className="text-sm font-medium text-slate-800">{homework.title}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">
                      {homework.courseName} • {homework.grade} {homework.className}
                    </p>
                    <span className={`text-xs font-medium ${new Date(homework.dueDate) < new Date() ? "text-rose-600" : "text-emerald-600"}`}>
                      {new Date(homework.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">
                      📝 {homework.submissions?.length || 0} submissions
                    </span>
                    {homework.submissions?.filter(s => s.status === "GRADED").length > 0 && (
                      <span className="text-xs text-emerald-600">
                        ⭐ {homework.submissions.filter(s => s.status === "GRADED").length} graded
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Cards for Performance Overview */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">📊 Teaching Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalHomeworks}</p>
            <p className="text-xs text-slate-500">Total Homework</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.myCourses}</p>
            <p className="text-xs text-slate-500">Courses</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.myStudents}</p>
            <p className="text-xs text-slate-500">Students</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</p>
            <p className="text-xs text-slate-500">Pending Leave</p>
          </div>
        </div>
      </div>
    </div>
  );
}