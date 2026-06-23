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

  // Check permissions
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
      A: "bg-emerald-500",
      B: "bg-blue-500",
      C: "bg-amber-500",
      D: "bg-orange-500",
      F: "bg-rose-500"
    };
    return colors[grade] || "bg-gray-500";
  };

  const getGradeGradient = (grade) => {
    const gradients = {
      A: "from-emerald-400 to-emerald-600",
      B: "from-blue-400 to-blue-600",
      C: "from-amber-400 to-amber-600",
      D: "from-orange-400 to-orange-600",
      F: "from-rose-400 to-rose-600"
    };
    return gradients[grade] || "from-gray-400 to-gray-600";
  };

  const totalStudents = stats.students.total || 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-4 py-5 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">
                  🎓
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                    School Management Dashboard
                  </h1>
                  <p className="text-slate-300 text-xs md:text-sm">
                    Track academic performance, attendance, and school operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300 bg-white/5 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10">
              <span>📅</span>
              <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row 1 - Improved Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-4 hover:shadow-xl transition-all group border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Students</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-700 mt-1">{stats.students.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="text-emerald-600 flex items-center gap-1">👦 {stats.students.boys}</span>
            <span className="text-pink-600 flex items-center gap-1">👧 {stats.students.girls}</span>
            <span className="text-slate-400 flex items-center gap-1">✅ {stats.students.active}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-4 hover:shadow-xl transition-all group border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Teachers</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-700 mt-1">{stats.teachers.active} / {stats.teachers.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">👨‍🏫</span>
            </div>
          </div>
          <p className="text-xs text-purple-500 mt-2">Active / Total</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md p-4 hover:shadow-xl transition-all group border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Courses</p>
              <p className="text-2xl md:text-3xl font-bold text-amber-700 mt-1">{stats.courses.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <p className="text-xs text-amber-500 mt-2">Offered Subjects</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-4 hover:shadow-xl transition-all group border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Transport Revenue</p>
              <p className="text-lg md:text-2xl font-bold text-emerald-700 mt-1">{stats.transport.revenue.toLocaleString()} RWF</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          {stats.transport.totalExpected > 0 && (
            <p className="text-xs text-emerald-500 mt-2">Expected: {stats.transport.totalExpected.toLocaleString()} RWF</p>
          )}
        </div>
      </div>

      {/* Stats Cards Row 2 - Performance & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Performance - Improved Colors */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-5 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <h2 className="font-bold text-slate-800 text-sm md:text-base">Academic Performance</h2>
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Current Term</span>
          </div>
          
          {/* Average Score Ring - Enhanced */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4">
            <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-indigo-600">{stats.performance.averageScore}%</p>
                  <p className="text-[10px] md:text-xs text-slate-500">Avg Score</p>
                </div>
              </div>
              <svg className="w-28 h-28 md:w-32 md:h-32 transform -rotate-90">
                <circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle 
                  cx="56" cy="56" r="48" fill="none" 
                  stroke="#6366f1" strokeWidth="10" 
                  strokeDasharray={`${(stats.performance.averageScore / 100) * 301.6} 301.6`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="bg-emerald-50 rounded-lg px-3 py-1.5">
                  <p className="text-xs text-slate-500">Pass Rate</p>
                  <p className="text-lg font-bold text-emerald-600">{stats.performance.passRate}%</p>
                </div>
                <div className="bg-indigo-50 rounded-lg px-3 py-1.5">
                  <p className="text-xs text-slate-500">Total Students</p>
                  <p className="text-lg font-bold text-indigo-600">{totalStudents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Distribution Bars - Enhanced Colors */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">📈 Grade Distribution</p>
            {Object.entries(stats.performance.gradeDistribution || {}).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-r ${getGradeGradient(grade)} flex items-center justify-center text-xs font-bold text-white`}>
                  {grade}
                </div>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getGradeGradient(grade)} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${totalStudents > 0 ? (count / totalStudents * 100) : 0}%` }}
                  />
                </div>
                <div className="w-10 text-xs font-semibold text-slate-600 text-right">{count}</div>
              </div>
            ))}
            {Object.values(stats.performance.gradeDistribution || {}).reduce((a, b) => a + b, 0) === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-3">No grades recorded yet</p>
            )}
          </div>
        </div>

        {/* Attendance Overview - Improved Colors */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-5 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <span className="text-white text-sm">✅</span>
              </div>
              <h2 className="font-bold text-slate-800 text-sm md:text-base">Attendance Overview</h2>
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Last 30 Days</span>
          </div>

          {/* Attendance Circle - Enhanced */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4">
            <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-emerald-600">{stats.attendance.rate}%</p>
                  <p className="text-[10px] md:text-xs text-slate-500">Rate</p>
                </div>
              </div>
              <svg className="w-28 h-28 md:w-32 md:h-32 transform -rotate-90">
                <circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle 
                  cx="56" cy="56" r="48" fill="none" 
                  stroke="#10b981" strokeWidth="10" 
                  strokeDasharray={`${(stats.attendance.rate / 100) * 301.6} 301.6`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 w-full">
              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-emerald-600">{stats.attendance.present}</p>
                <p className="text-[10px] text-slate-500">Present</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-amber-600">{stats.attendance.late}</p>
                <p className="text-[10px] text-slate-500">Late</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-rose-600">{stats.attendance.absent}</p>
                <p className="text-[10px] text-slate-500">Absent</p>
              </div>
            </div>
          </div>
          
          {stats.attendance.present === 0 && stats.attendance.absent === 0 && stats.attendance.late === 0 && (
            <p className="text-xs text-slate-400 italic text-center mt-2">No attendance records found</p>
          )}
        </div>
      </div>

      {/* Quick Actions - Enhanced Colors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <button 
          onClick={() => window.location.href = "/students"}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl text-xs md:text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          <span>👨‍🎓</span>
          <span className="hidden xs:inline">Manage Students</span>
          <span className="xs:hidden">Students</span>
        </button>
        <button 
          onClick={() => window.location.href = "/teachers"}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-xl text-xs md:text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          <span>👨‍🏫</span>
          <span className="hidden xs:inline">Manage Teachers</span>
          <span className="xs:hidden">Teachers</span>
        </button>
        <button 
          onClick={() => window.location.href = "/marks"}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-xl text-xs md:text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          <span>📝</span>
          <span className="hidden xs:inline">Record Marks</span>
          <span className="xs:hidden">Marks</span>
        </button>
        <button 
          onClick={() => window.location.href = "/attendance"}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3 rounded-xl text-xs md:text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          <span>✅</span>
          <span className="hidden xs:inline">Mark Attendance</span>
          <span className="xs:hidden">Attendance</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
        }
        @media (min-width: 481px) {
          .xs\\:inline { display: none; }
        }
      `}</style>
    </div>
  );
}