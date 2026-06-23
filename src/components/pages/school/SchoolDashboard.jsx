import React, { useEffect, useState } from "react";
import { 
  getMarksAnalytics, 
  getTransportFinancialSummary, 
  getStudentAttendanceReport,
  getMarks,
  getTransportPayments,
  getStudentAttendanceByClass
} from "../../services/schoolService";
import { getStudents, getTeachers, getCourses } from "../../services/schoolService";
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

  // Check if user has permission to view this dashboard
  useEffect(() => {
    if (userRole !== "superadmin" && userType !== "school_admin" && userType !== "admin") {
      if (userType === "teacher" || userType === "staff") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [userRole, userType, navigate]);

  // Helper function to safely get array from response
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
    
    console.log("=== Fetching Dashboard Data ===");
    
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
      // FIXED: Pass term and year as separate arguments, not as an object
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

      // Safely extract data arrays
      const students = safeGetArray(studentsRes.data);
      const teachers = safeGetArray(teachersRes.data);
      const courses = safeGetArray(coursesRes.data);
      
      // --- Extract Marks Analytics ---
      const analytics = marksAnalyticsRes.data || {};
      console.log("Marks Analytics data:", analytics);
      
      // Try to get grade distribution from different possible structures
      let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      if (analytics.gradeDistribution) {
        gradeDistribution = analytics.gradeDistribution;
      } else if (analytics.gradeDistribution) {
        gradeDistribution = analytics.gradeDistribution;
      }
      
      // --- Extract Transport Data ---
      const transport = transportRes.data || {};
      console.log("Transport data:", transport);
      
      // Handle different response structures
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
      
      // --- Extract Attendance Data ---
      const attendance = attendanceRes.data || {};
      console.log("Attendance data:", attendance);

      // Extract attendance stats - handle multiple response structures
      let avgAttendance = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;

      // Check if we have summary data
      if (attendance.summary) {
        avgAttendance = parseFloat(attendance.summary.averageAttendance) || 0;
        // Fallback to overallAttendance if averageAttendance is not present
        if (!avgAttendance && attendance.summary.overallAttendance) {
          avgAttendance = parseFloat(attendance.summary.overallAttendance) || 0;
        }
        totalPresent = attendance.summary.totalPresent || 0;
        totalAbsent = attendance.summary.totalAbsent || 0;
        totalLate = attendance.summary.totalLate || 0;
      } else {
        // Try direct properties
        avgAttendance = parseFloat(attendance.averageAttendance) || 0;
        if (!avgAttendance && attendance.overallAttendance) {
          avgAttendance = parseFloat(attendance.overallAttendance) || 0;
        }
        totalPresent = attendance.totalPresent || 0;
        totalAbsent = attendance.totalAbsent || 0;
        totalLate = attendance.totalLate || 0;
      }

      // If we have daily breakdown but no summary, calculate from daily breakdown
      if (attendance.dailyBreakdown && Object.keys(attendance.dailyBreakdown).length > 0) {
        const dailyData = attendance.dailyBreakdown;
        totalPresent = Object.values(dailyData).reduce((sum, d) => sum + (d.present || 0), 0);
        totalAbsent = Object.values(dailyData).reduce((sum, d) => sum + (d.absent || 0), 0);
        totalLate = Object.values(dailyData).reduce((sum, d) => sum + (d.late || 0), 0);
        const totalRecords = totalPresent + totalAbsent + totalLate;
        avgAttendance = totalRecords > 0 ? ((totalPresent / totalRecords) * 100) : 0;
      }

      console.log("Attendance stats calculated:", { avgAttendance, totalPresent, totalAbsent, totalLate });

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
      
      console.log("Dashboard stats updated:", {
        students: students.length,
        teachers: teachers.length,
        courses: courses.length,
        performance: { averageScore: analytics.averageScore, passRate: analytics.passRate },
        transport: { revenue: totalPaid, collectionRate: collectionRate },
        attendance: { rate: avgAttendance }
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

  // If not authorized, show nothing while redirecting
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

  const totalStudents = stats.students.total || 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                🎓 School Management Dashboard
              </h1>
              <p className="text-slate-300 text-sm">
                Track academic performance, attendance, and school operations
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-lg">📅</span>
              <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.students.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total Students</p>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="text-emerald-600">👦 {stats.students.boys} Boys</span>
            <span className="text-pink-600">👧 {stats.students.girls} Girls</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">👨‍🏫</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.teachers.active} / {stats.teachers.total}</p>
          <p className="text-xs text-slate-500 mt-1">Teachers (Active/Total)</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.courses.total}</p>
          <p className="text-xs text-slate-500 mt-1">Courses Offered</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.transport.revenue.toLocaleString()} RWF</p>
          <p className="text-xs text-slate-500 mt-1">Transport Revenue</p>
          {stats.transport.totalExpected > 0 && (
            <p className="text-xs text-slate-400 mt-1">Expected: {stats.transport.totalExpected.toLocaleString()} RWF</p>
          )}
        </div>
      </div>

      {/* Stats Cards Row 2 - Performance & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Performance */}
        <div className="bg-white rounded-xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-sm">📊</span>
              </div>
              <h2 className="font-bold text-slate-800">Academic Performance</h2>
            </div>
            <span className="text-xs text-slate-400">Current Term</span>
          </div>
          
          {/* Average Score Ring */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{stats.performance.averageScore}%</p>
                  <p className="text-xs text-slate-500">Average Score</p>
                </div>
              </div>
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle 
                  cx="64" cy="64" r="56" fill="none" 
                  stroke="#6366f1" strokeWidth="12" 
                  strokeDasharray={`${(stats.performance.averageScore / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="mt-2 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.performance.passRate}%</p>
              <p className="text-xs text-slate-500">Pass Rate</p>
            </div>
          </div>

          {/* Grade Distribution Bars */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">Grade Distribution</p>
            {Object.entries(stats.performance.gradeDistribution || {}).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-2">
                <div className="w-8 text-sm font-bold text-slate-600">{grade}</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getGradeColor(grade)} rounded-full transition-all duration-500`}
                    style={{ width: `${totalStudents > 0 ? (count / totalStudents * 100) : 0}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-slate-500">{count}</div>
              </div>
            ))}
            {Object.values(stats.performance.gradeDistribution || {}).reduce((a, b) => a + b, 0) === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-2">No grades recorded yet</p>
            )}
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="bg-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">✅</span>
            </div>
            <h2 className="font-bold text-slate-800">Attendance Overview</h2>
            <span className="text-xs text-slate-400 ml-auto">Last 30 Days</span>
          </div>

          {/* Attendance Circle */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{stats.attendance.rate}%</p>
                  <p className="text-xs text-slate-500">Attendance Rate</p>
                </div>
              </div>
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle 
                  cx="64" cy="64" r="56" fill="none" 
                  stroke="#10b981" strokeWidth="12" 
                  strokeDasharray={`${(stats.attendance.rate / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-50 rounded-lg p-2">
              <p className="text-lg font-bold text-emerald-600">{stats.attendance.present}</p>
              <p className="text-xs text-slate-500">Present</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-lg font-bold text-amber-600">{stats.attendance.late}</p>
              <p className="text-xs text-slate-500">Late</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-2">
              <p className="text-lg font-bold text-rose-600">{stats.attendance.absent}</p>
              <p className="text-xs text-slate-500">Absent</p>
            </div>
          </div>
          {stats.attendance.present === 0 && stats.attendance.absent === 0 && stats.attendance.late === 0 && (
            <p className="text-xs text-slate-400 italic text-center mt-3">No attendance records found</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => window.location.href = "/students"}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          👨‍🎓 Manage Students
        </button>
        <button 
          onClick={() => window.location.href = "/teachers"}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          👨‍🏫 Manage Teachers
        </button>
        <button 
          onClick={() => window.location.href = "/marks"}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          📝 Record Marks
        </button>
        <button 
          onClick={() => window.location.href = "/attendance"}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
        >
          ✅ Mark Attendance
        </button>
      </div>
    </div>
  );
}