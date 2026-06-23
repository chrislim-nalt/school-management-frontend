import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyPermissions, getHomeworks, getCourses, getStudents, getHomeworkSummary } from "../../services/schoolService";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  GraduationCap,
  ClipboardList,
  FileText,
  UserCheck,
  UserX,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Home,
  School,
  BookMarked,
  UsersRound,
  Clock as ClockIcon,
  CalendarDays,
  MessageSquare,
  Bell,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";

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
    { path: "/attendance", label: "Mark Attendance", icon: UserCheck, color: "from-emerald-500 to-emerald-600" },
    { path: "/marks", label: "Record Marks", icon: ClipboardList, color: "from-blue-500 to-blue-600" },
    { path: "/discipline", label: "Record Offense", icon: AlertCircle, color: "from-amber-500 to-amber-600" },
    { path: "/homework", label: "Assign Homework", icon: BookOpen, color: "from-purple-500 to-purple-600" },
    { path: "/permissions", label: "Request Leave", icon: Calendar, color: "from-indigo-500 to-indigo-600" },
    { path: "/activities", label: "Student Activities", icon: FileText, color: "from-orange-500 to-orange-600" },
    { path: "/english-performance", label: "English Violation", icon: AlertCircle, color: "from-rose-500 to-rose-600" },
    { path: "/slow-learners", label: "Slow Learners", icon: GraduationCap, color: "from-teal-500 to-teal-600" }
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
          <AlertCircle className="w-4 h-4" />
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
              <div className="p-2 bg-white/10 backdrop-blur rounded-xl">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {getGreeting()}, {userName}!
                </h1>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <CalendarDays className="w-3 h-3" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <p className="text-slate-300 text-xs">My Courses</p>
              </div>
              <p className="text-2xl font-bold text-indigo-300 mt-1">{stats.myCourses}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-300" />
                <p className="text-slate-300 text-xs">My Students</p>
              </div>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.myStudents}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-amber-300" />
                <p className="text-slate-300 text-xs">Homework Pending</p>
              </div>
              <p className="text-2xl font-bold text-amber-300 mt-1">{stats.homeworkPending}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-300" />
                <p className="text-slate-300 text-xs">Leave Requests</p>
              </div>
              <p className="text-2xl font-bold text-rose-300 mt-1">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Zap className="w-4 h-4 text-indigo-600" />
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
                <action.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-[10px] font-medium leading-tight">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Permissions */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Recent Leave Requests</h3>
            </div>
            {recentPermissions.length > 0 && (
              <Link to="/permissions" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {recentPermissions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <Calendar className="w-8 h-8 text-slate-300" />
              <span>No leave requests yet</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPermissions.map((permission) => (
                <div key={permission._id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{permission.reason}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <CalendarDays className="w-3 h-3" />
                      {permission.startDate ? new Date(permission.startDate).toLocaleDateString() : "N/A"} - 
                      {permission.endDate ? new Date(permission.endDate).toLocaleDateString() : "N/A"}
                      {permission.totalDays && ` (${permission.totalDays} days)`}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                    permission.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                    permission.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    permission.status === "REVOKED" ? "bg-slate-100 text-slate-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {permission.status === "APPROVED" ? <CheckCircle className="w-3 h-3" /> :
                     permission.status === "PENDING" ? <Clock className="w-3 h-3" /> :
                     permission.status === "REVOKED" ? <RefreshCw className="w-3 h-3" /> :
                     <XCircle className="w-3 h-3" />}
                    {permission.status === "APPROVED" ? "Approved" :
                     permission.status === "PENDING" ? "Pending" :
                     permission.status === "REVOKED" ? "Revoked" :
                     "Disapproved"}
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
              <BookOpen className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Recent Homework</h3>
            </div>
            {recentHomeworks.length > 0 && (
              <Link to="/homework" className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {recentHomeworks.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8 text-slate-300" />
              <span>No homework assigned yet</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentHomeworks.map((homework) => {
                const isOverdue = new Date(homework.dueDate) < new Date();
                const submissionCount = homework.submissions?.length || 0;
                const gradedCount = homework.submissions?.filter(s => s.status === "GRADED").length || 0;
                
                return (
                  <div key={homework._id} className="px-4 py-3 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{homework.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <School className="w-3 h-3" /> {homework.grade} {homework.className}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <BookMarked className="w-3 h-3" /> {homework.courseName}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ml-2 ${isOverdue ? "text-rose-600" : "text-emerald-600"}`}>
                        {isOverdue ? <XCircle className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {new Date(homework.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {submissionCount} submissions
                      </span>
                      {gradedCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Star className="w-3 h-3" /> {gradedCount} graded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Teaching Overview Stats */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <BarChart className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">Teaching Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center hover:bg-blue-100 transition">
            <p className="text-2xl font-bold text-blue-600">{stats.totalHomeworks}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3" /> Total Homework
            </p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center hover:bg-emerald-100 transition">
            <p className="text-2xl font-bold text-emerald-600">{stats.myCourses}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <BookMarked className="w-3 h-3" /> Courses
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center hover:bg-purple-100 transition">
            <p className="text-2xl font-bold text-purple-600">{stats.myStudents}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> Students
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center hover:bg-amber-100 transition">
            <p className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" /> Pending Leave
            </p>
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