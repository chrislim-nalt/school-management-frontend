import React, { useEffect, useState } from "react";
import { 
  getMarksAnalytics, 
  getTransportFinancialSummary, 
  getStudentAttendanceReport,
  getStudents, 
  getTeachers, 
  getCourses 
} from "../../services/schoolService";
import { useNavigate } from "react-router-dom";

export default function SchoolDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    students: { total: 0, active: 0, boys: 0, girls: 0 },
    teachers: { total: 0, active: 0 },
    courses: { total: 0 },
    performance: {
      averageScore: 0,
      passRate: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    },
    attendance: {
      rate: 0,
      present: 0,
      absent: 0,
      late: 0
    },
    transport: {
      revenue: 0,
      collectionRate: 0,
      paidStudents: 0,
      unpaidStudents: 0,
      totalExpected: 0
    }
  });
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const userType = localStorage.getItem("userType");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    if (userRole !== "superadmin" && userType !== "school_admin" && userType !== "admin") {
      if (userType === "teacher" || userType === "staff") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [userRole, userType, navigate]);

  const safeGetArray = (data, defaultValue = []) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.teachers)) return data.teachers;
      if (Array.isArray(data.students)) return data.students;
      if (Array.isArray(data.courses)) return data.courses;
      if (Array.isArray(data.marks)) return data.marks;
      if (Array.isArray(data.payments)) return data.payments;
      if (Object.keys(data).every(key => !isNaN(key))) {
        return Object.values(data);
      }
    }
    return defaultValue;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentYear = new Date().getFullYear();
      
      const [
        studentsRes, 
        teachersRes, 
        coursesRes, 
        marksAnalyticsRes,
        transportRes,
        attendanceRes
      ] = await Promise.all([
        getStudents().catch(() => ({ data: [] })),
        getTeachers().catch(() => ({ data: [] })),
        getCourses().catch(() => ({ data: [] })),
        getMarksAnalytics("TERM1", currentYear).catch(() => ({ 
          data: { 
            totalStudents: 0, 
            totalMarks: 0, 
            averageScore: 0, 
            passRate: 0, 
            gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 } 
          } 
        })),
        getTransportFinancialSummary(currentYear).catch(() => ({ 
          data: { 
            totalExpected: 0, 
            totalPaid: 0, 
            totalBalance: 0, 
            collectionRate: 0, 
            studentsSummary: { paid: 0, partial: 0, unpaid: 0, total: 0 } 
          } 
        })),
        getStudentAttendanceReport({ 
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }).catch(() => ({ 
          data: { 
            summary: { 
              averageAttendance: 0, 
              totalPresent: 0, 
              totalAbsent: 0, 
              totalLate: 0 
            }, 
            records: [] 
          } 
        }))
      ]);

      const students = safeGetArray(studentsRes.data);
      const teachers = safeGetArray(teachersRes.data);
      const courses = safeGetArray(coursesRes.data);
      
      const analytics = marksAnalyticsRes.data || {};
      let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      if (analytics.gradeDistribution) {
        gradeDistribution = analytics.gradeDistribution;
      }
      
      const transport = transportRes.data || {};
      let totalExpected = 0;
      let totalPaid = 0;
      let collectionRate = 0;
      let paidStudents = 0;
      let unpaidStudents = 0;
      
      if (transport.summary) {
        totalExpected = transport.summary.totalExpected || 0;
        totalPaid = transport.summary.totalPaid || 0;
        collectionRate = transport.summary.collectionRate || 0;
        paidStudents = transport.summary.studentsSummary?.paid || 0;
        unpaidStudents = transport.summary.studentsSummary?.unpaid || 0;
      } else {
        totalExpected = transport.totalExpected || 0;
        totalPaid = transport.totalPaid || 0;
        collectionRate = transport.collectionRate || 0;
        paidStudents = transport.studentsSummary?.paid || 0;
        unpaidStudents = transport.studentsSummary?.unpaid || 0;
      }
      
      const attendance = attendanceRes.data || {};
      let avgAttendance = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;

      if (attendance.summary) {
        avgAttendance = parseFloat(attendance.summary.averageAttendance) || 0;
        if (!avgAttendance && attendance.summary.overallAttendance) {
          avgAttendance = parseFloat(attendance.summary.overallAttendance) || 0;
        }
        totalPresent = attendance.summary.totalPresent || 0;
        totalAbsent = attendance.summary.totalAbsent || 0;
        totalLate = attendance.summary.totalLate || 0;
      } else {
        avgAttendance = parseFloat(attendance.averageAttendance) || 0;
        if (!avgAttendance && attendance.overallAttendance) {
          avgAttendance = parseFloat(attendance.overallAttendance) || 0;
        }
        totalPresent = attendance.totalPresent || 0;
        totalAbsent = attendance.totalAbsent || 0;
        totalLate = attendance.totalLate || 0;
      }

      if (attendance.dailyBreakdown && Object.keys(attendance.dailyBreakdown).length > 0) {
        const dailyData = attendance.dailyBreakdown;
        totalPresent = Object.values(dailyData).reduce((sum, d) => sum + (d.present || 0), 0);
        totalAbsent = Object.values(dailyData).reduce((sum, d) => sum + (d.absent || 0), 0);
        totalLate = Object.values(dailyData).reduce((sum, d) => sum + (d.late || 0), 0);
        const totalRecords = totalPresent + totalAbsent + totalLate;
        avgAttendance = totalRecords > 0 ? ((totalPresent / totalRecords) * 100) : 0;
      }

      setStats({
        students: {
          total: students.length || 0,
          active: students.filter ? students.filter(s => s.status === "ACTIVE").length : 0,
          boys: students.filter ? students.filter(s => s.gender === "MALE").length : 0,
          girls: students.filter ? students.filter(s => s.gender === "FEMALE").length : 0
        },
        teachers: {
          total: teachers.length || 0,
          active: teachers.filter ? teachers.filter(t => t.status === "ACTIVE").length : 0
        },
        courses: {
          total: courses.length || 0
        },
        performance: {
          averageScore: parseFloat(analytics.averageScore) || 0,
          passRate: parseFloat(analytics.passRate) || 0,
          gradeDistribution: gradeDistribution
        },
        attendance: {
          rate: Math.round(avgAttendance) || 0,
          present: totalPresent || 0,
          absent: totalAbsent || 0,
          late: totalLate || 0
        },
        transport: {
          revenue: totalPaid || 0,
          collectionRate: parseFloat(collectionRate) || 0,
          paidStudents: paidStudents || 0,
          unpaidStudents: unpaidStudents || 0,
          totalExpected: totalExpected || 0
        }
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "superadmin" || userType === "school_admin" || userType === "admin") {
      fetchData();
    }
  }, [userRole, userType]);

  if (userRole !== "superadmin" && userType !== "school_admin" && userType !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
      </div>
    );
  }

  const getGradeColor = (grade) => {
    const colors = {
      A: "from-emerald-400 to-emerald-500",
      B: "from-blue-400 to-blue-500",
      C: "from-amber-400 to-amber-500",
      D: "from-orange-400 to-orange-500",
      F: "from-rose-400 to-rose-500"
    };
    return colors[grade] || "from-gray-400 to-gray-500";
  };

  const totalStudents = stats.students.total || 0;

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ===== HERO SECTION - STUNNING ===== */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative px-5 py-7 md:py-8 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                  <span className="text-2xl md:text-3xl">🏫</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg">
                    School Dashboard
                  </h1>
                  <p className="text-indigo-100 text-sm md:text-base font-medium">
                    Track academic performance, attendance, and school operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-lg">
              <span className="text-lg">📅</span>
              <span className="text-white text-sm font-medium">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Quick Stats in Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Students</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{stats.students.total}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">👨‍🎓</span>
                </div>
              </div>
              <div className="flex gap-3 mt-1.5 text-xs">
                <span className="text-emerald-300">👦 {stats.students.boys}</span>
                <span className="text-pink-300">👧 {stats.students.girls}</span>
                <span className="text-indigo-300">✅ {stats.students.active}</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Teachers</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{stats.teachers.active}/{stats.teachers.total}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">👨‍🏫</span>
                </div>
              </div>
              <p className="text-indigo-300 text-xs mt-1.5">Active / Total</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Courses</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{stats.courses.total}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">📚</span>
                </div>
              </div>
              <p className="text-indigo-300 text-xs mt-1.5">Subjects Offered</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Revenue</p>
                  <p className="text-xl font-bold text-emerald-300 mt-0.5">{stats.transport.revenue.toLocaleString()} RWF</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">💰</span>
                </div>
              </div>
              {stats.transport.totalExpected > 0 && (
                <p className="text-indigo-300 text-xs mt-1.5">Expected: {stats.transport.totalExpected.toLocaleString()} RWF</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== PERFORMANCE & ATTENDANCE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Academic Performance Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-b border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Academic Performance</h2>
                  <p className="text-xs text-slate-500">Current Term Overview</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">TERM 1</span>
            </div>
          </div>
          
          <div className="p-5">
            {/* Score Display */}
            <div className="flex items-center gap-6 mb-5">
              <div className="relative w-28 h-28 flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{stats.performance.averageScore}%</p>
                    <p className="text-[10px] text-slate-500">Avg Score</p>
                  </div>
                </div>
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle 
                    cx="56" cy="56" r="48" fill="none" 
                    stroke="#6366f1" strokeWidth="10" 
                    strokeDasharray={`${(stats.performance.averageScore / 100) * 301.6} 301.6`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                    <p className="text-xs text-slate-500 font-medium">Pass Rate</p>
                    <p className="text-xl font-bold text-emerald-600">{stats.performance.passRate}%</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                    <p className="text-xs text-slate-500 font-medium">Students</p>
                    <p className="text-xl font-bold text-indigo-600">{totalStudents}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                <span>📈</span> Grade Distribution
              </p>
              {Object.entries(stats.performance.gradeDistribution || {}).map(([grade, count]) => (
                <div key={grade} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getGradeColor(grade)} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                    {grade}
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getGradeColor(grade)} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${totalStudents > 0 ? (count / totalStudents * 100) : 0}%` }}
                    />
                  </div>
                  <div className="w-10 text-xs font-bold text-slate-600 text-right">{count}</div>
                </div>
              ))}
              {Object.values(stats.performance.gradeDistribution || {}).reduce((a, b) => a + b, 0) === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-3">No grades recorded yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Overview Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">✅</span>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Attendance Overview</h2>
                  <p className="text-xs text-slate-500">Last 30 Days</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">{stats.attendance.rate}%</span>
            </div>
          </div>
          
          <div className="p-5">
            {/* Attendance Ring */}
            <div className="flex items-center gap-6 mb-5">
              <div className="relative w-28 h-28 flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{stats.attendance.rate}%</p>
                    <p className="text-[10px] text-slate-500">Rate</p>
                  </div>
                </div>
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle 
                    cx="56" cy="56" r="48" fill="none" 
                    stroke="#10b981" strokeWidth="10" 
                    strokeDasharray={`${(stats.attendance.rate / 100) * 301.6} 301.6`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <p className="text-lg font-bold text-emerald-600">{stats.attendance.present}</p>
                  <p className="text-[10px] text-slate-500">Present</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                  <p className="text-lg font-bold text-amber-600">{stats.attendance.late}</p>
                  <p className="text-[10px] text-slate-500">Late</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
                  <p className="text-lg font-bold text-rose-600">{stats.attendance.absent}</p>
                  <p className="text-[10px] text-slate-500">Absent</p>
                </div>
              </div>
            </div>

            {/* Attendance Progress */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Attendance Rate</span>
                <span className="font-bold text-emerald-600">{stats.attendance.rate}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.attendance.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Goal: 100%</span>
                <span>{stats.attendance.present + stats.attendance.late + stats.attendance.absent} total records</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS - STUNNING ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => window.location.href = "/students"}
          className="group relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="relative flex flex-col items-center gap-1">
            <span className="text-3xl">👨‍🎓</span>
            <span className="text-sm font-semibold">Manage Students</span>
          </div>
        </button>
        <button 
          onClick={() => window.location.href = "/teachers"}
          className="group relative overflow-hidden bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="relative flex flex-col items-center gap-1">
            <span className="text-3xl">👨‍🏫</span>
            <span className="text-sm font-semibold">Manage Teachers</span>
          </div>
        </button>
        <button 
          onClick={() => window.location.href = "/marks"}
          className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="relative flex flex-col items-center gap-1">
            <span className="text-3xl">📝</span>
            <span className="text-sm font-semibold">Record Marks</span>
          </div>
        </button>
        <button 
          onClick={() => window.location.href = "/attendance"}
          className="group relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="relative flex flex-col items-center gap-1">
            <span className="text-3xl">✅</span>
            <span className="text-sm font-semibold">Mark Attendance</span>
          </div>
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}