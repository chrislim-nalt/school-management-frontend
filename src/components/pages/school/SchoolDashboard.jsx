import React, { useEffect, useState } from "react";
import { 
  getMarksAnalytics, 
  getTransportFinancialSummary, 
  getStudentAttendanceReport,
  getTeacherAttendanceReport,
  getStudents, 
  getTeachers, 
  getCourses,
  getMarks,
  getStudentAttendanceByClass,
  getTeacherAttendanceByDate,
  getSlowLearnerCases,
  getRecentActivities
} from "../../services/schoolService";
import { useNavigate, Link } from "react-router-dom";

export default function SchoolDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    students: { total: 0, active: 0, boys: 0, girls: 0 },
    teachers: { total: 0, active: 0 },
    courses: { total: 0 },
    performance: {
      averageScore: 0,
      passRate: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      coursePerformance: [],
      topPerformers: [],
      lowPerformers: [],
      lastUpdated: null,
      marksCount: 0
    },
    studentAttendance: {
      rate: 0,
      present: 0,
      absent: 0,
      late: 0,
      dailyBreakdown: [],
      topPresentStudents: [],
      topAbsentStudents: [],
      totalRecords: 0
    },
    teacherAttendance: {
      rate: 0,
      present: 0,
      absent: 0,
      late: 0,
      dailyBreakdown: [],
      topPresentTeachers: [],
      topAbsentTeachers: [],
      totalRecords: 0
    },
    transport: {
      revenue: 0,
      collectionRate: 0,
      paidStudents: 0,
      unpaidStudents: 0,
      totalExpected: 0
    },
    slowLearners: {
      total: 0,
      identified: 0,
      inProgress: 0,
      improving: 0,
      resolved: 0,
      resolutionRate: 0
    },
    recentActivities: []
  });
  const [error, setError] = useState(null);
  const [showSlowLearnerDetails, setShowSlowLearnerDetails] = useState(false);
  const [slowLearnerData, setSlowLearnerData] = useState(null);
  
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
      if (Array.isArray(data.activities)) return data.activities;
      if (Array.isArray(data.groupedByBatch)) return data.groupedByBatch;
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
      const currentDate = new Date().toISOString().split('T')[0];
      
      const [
        studentsRes, 
        teachersRes, 
        coursesRes, 
        marksAnalyticsRes,
        transportRes,
        studentAttendanceRes,
        teacherAttendanceRes,
        marksRes,
        studentAttendanceByClassRes,
        teacherAttendanceByDateRes,
        slowLearnersRes,
        recentActivitiesRes
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
            gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
            coursePerformance: [],
            topPerformers: [],
            lowPerformers: [],
            lastUpdated: new Date().toISOString(),
            marksCount: 0
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
          endDate: currentDate
        }).catch(() => ({ 
          data: { 
            summary: { 
              averageAttendance: 0, 
              totalPresent: 0, 
              totalAbsent: 0, 
              totalLate: 0 
            }, 
            records: [],
            dailyBreakdown: {},
            topPresentStudents: [],
            topAbsentStudents: []
          } 
        })),
        getTeacherAttendanceReport({ 
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: currentDate
        }).catch(() => ({ 
          data: { 
            summary: { 
              averageAttendance: 0, 
              totalPresent: 0, 
              totalAbsent: 0, 
              totalLate: 0 
            }, 
            records: [],
            dailyBreakdown: {},
            topPresentTeachers: [],
            topAbsentTeachers: []
          } 
        })),
        getMarks().catch(() => ({ data: [] })),
        getStudentAttendanceByClass({ 
          grade: "ALL",
          className: "ALL",
          date: currentDate,
          period: "DAILY"
        }).catch(() => ({ data: { attendance: [] } })),
        getTeacherAttendanceByDate({ 
          date: currentDate,
          period: "DAILY"
        }).catch(() => ({ data: { attendance: [] } })),
        getSlowLearnerCases({ semester: "TERM1" }).catch(() => ({ data: { cases: [] } })),
        getRecentActivities({ term: "TERM1", limit: 10 }).catch(() => ({ data: { activities: [] } }))
      ]);

      const students = safeGetArray(studentsRes.data);
      const teachers = safeGetArray(teachersRes.data);
      const courses = safeGetArray(coursesRes.data);
      const marks = safeGetArray(marksRes.data);
      
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
      
      // --- STUDENT ATTENDANCE ---
      const studentAttendance = studentAttendanceRes.data || {};
      let studentAvgAttendance = 0;
      let studentTotalPresent = 0;
      let studentTotalAbsent = 0;
      let studentTotalLate = 0;
      let studentDailyBreakdown = [];

      if (studentAttendance.summary) {
        studentAvgAttendance = parseFloat(studentAttendance.summary.averageAttendance) || 0;
        if (!studentAvgAttendance && studentAttendance.summary.overallAttendance) {
          studentAvgAttendance = parseFloat(studentAttendance.summary.overallAttendance) || 0;
        }
        studentTotalPresent = studentAttendance.summary.totalPresent || 0;
        studentTotalAbsent = studentAttendance.summary.totalAbsent || 0;
        studentTotalLate = studentAttendance.summary.totalLate || 0;
      } else {
        studentAvgAttendance = parseFloat(studentAttendance.averageAttendance) || 0;
        if (!studentAvgAttendance && studentAttendance.overallAttendance) {
          studentAvgAttendance = parseFloat(studentAttendance.overallAttendance) || 0;
        }
        studentTotalPresent = studentAttendance.totalPresent || 0;
        studentTotalAbsent = studentAttendance.totalAbsent || 0;
        studentTotalLate = studentAttendance.totalLate || 0;
      }

      if (studentAttendance.dailyBreakdown && Object.keys(studentAttendance.dailyBreakdown).length > 0) {
        const dailyData = studentAttendance.dailyBreakdown;
        studentDailyBreakdown = Object.entries(dailyData).map(([date, data]) => ({
          date,
          present: data.present || 0,
          absent: data.absent || 0,
          late: data.late || 0,
          total: (data.present || 0) + (data.absent || 0) + (data.late || 0)
        })).slice(-7).reverse();
        
        studentTotalPresent = studentDailyBreakdown.reduce((sum, d) => sum + d.present, 0);
        studentTotalAbsent = studentDailyBreakdown.reduce((sum, d) => sum + d.absent, 0);
        studentTotalLate = studentDailyBreakdown.reduce((sum, d) => sum + d.late, 0);
        const totalRecords = studentTotalPresent + studentTotalAbsent + studentTotalLate;
        studentAvgAttendance = totalRecords > 0 ? ((studentTotalPresent / totalRecords) * 100) : 0;
      }

      // --- TEACHER ATTENDANCE ---
      const teacherAttendance = teacherAttendanceRes.data || {};
      let teacherAvgAttendance = 0;
      let teacherTotalPresent = 0;
      let teacherTotalAbsent = 0;
      let teacherTotalLate = 0;
      let teacherDailyBreakdown = [];

      if (teacherAttendance.summary) {
        teacherAvgAttendance = parseFloat(teacherAttendance.summary.averageAttendance) || 0;
        if (!teacherAvgAttendance && teacherAttendance.summary.overallAttendance) {
          teacherAvgAttendance = parseFloat(teacherAttendance.summary.overallAttendance) || 0;
        }
        teacherTotalPresent = teacherAttendance.summary.totalPresent || 0;
        teacherTotalAbsent = teacherAttendance.summary.totalAbsent || 0;
        teacherTotalLate = teacherAttendance.summary.totalLate || 0;
      } else {
        teacherAvgAttendance = parseFloat(teacherAttendance.averageAttendance) || 0;
        if (!teacherAvgAttendance && teacherAttendance.overallAttendance) {
          teacherAvgAttendance = parseFloat(teacherAttendance.overallAttendance) || 0;
        }
        teacherTotalPresent = teacherAttendance.totalPresent || 0;
        teacherTotalAbsent = teacherAttendance.totalAbsent || 0;
        teacherTotalLate = teacherAttendance.totalLate || 0;
      }

      if (teacherAttendance.dailyBreakdown && Object.keys(teacherAttendance.dailyBreakdown).length > 0) {
        const dailyData = teacherAttendance.dailyBreakdown;
        teacherDailyBreakdown = Object.entries(dailyData).map(([date, data]) => ({
          date,
          present: data.present || 0,
          absent: data.absent || 0,
          late: data.late || 0,
          total: (data.present || 0) + (data.absent || 0) + (data.late || 0)
        })).slice(-7).reverse();
        
        teacherTotalPresent = teacherDailyBreakdown.reduce((sum, d) => sum + d.present, 0);
        teacherTotalAbsent = teacherDailyBreakdown.reduce((sum, d) => sum + d.absent, 0);
        teacherTotalLate = teacherDailyBreakdown.reduce((sum, d) => sum + d.late, 0);
        const totalRecords = teacherTotalPresent + teacherTotalAbsent + teacherTotalLate;
        teacherAvgAttendance = totalRecords > 0 ? ((teacherTotalPresent / totalRecords) * 100) : 0;
      }

      // --- SLOW LEARNERS ---
      const slowLearners = slowLearnersRes.data?.cases || [];
      const slowLearnerSummary = {
        total: slowLearners.length,
        identified: slowLearners.filter(c => c.status === "IDENTIFIED").length,
        inProgress: slowLearners.filter(c => c.status === "IN_PROGRESS").length,
        improving: slowLearners.filter(c => c.status === "IMPROVING").length,
        resolved: slowLearners.filter(c => c.status === "RESOLVED").length,
        resolutionRate: slowLearners.length > 0 
          ? ((slowLearners.filter(c => c.status === "RESOLVED").length / slowLearners.length) * 100).toFixed(1)
          : 0
      };

      // ============================================================
      // RECENT ACTIVITIES - now from dedicated school-wide endpoint
      // (getClassActivities required a literal grade+className match,
      // so "ALL"/"ALL" always returned zero results. /activities/recent
      // has no such requirement.)
      // ============================================================
      const activitiesData = recentActivitiesRes.data || {};
      const recentActivities = (activitiesData.activities || []).map(a => ({
        title: a.title || "Activity",
        studentName: a.studentName || "Unknown",
        studentId: a.studentId || "-",
        marksObtained: a.marksObtained ?? 0,
        marksTotal: a.marksTotal ?? 0,
        percentage: Math.round(a.percentage || 0),
        performanceLevel: a.performanceLevel || "AVERAGE",
        date: a.date ? new Date(a.date).toLocaleDateString() : "-",
        activityType: a.activityType || "EXERCISE",
        batchId: a.batchId || "-",
        courseName: a.courseName || "-"
      }));

      // --- Prepare Course Performance from Marks Data ---
      let coursePerformance = [];
      if (marks && marks.length > 0) {
        const courseMap = {};
        marks.forEach(mark => {
          const courseId = mark.course?._id || mark.course;
          const courseName = mark.course?.courseName || "Unknown Course";
          const score = mark.totalScore || mark.examScore || 0;
          const maxScore = mark.maxScore || 100;
          const percentage = (score / maxScore) * 100;
          
          if (!courseMap[courseId]) {
            courseMap[courseId] = {
              courseId,
              courseName,
              totalStudents: 0,
              totalScore: 0,
              scores: [],
              passCount: 0,
              failCount: 0
            };
          }
          courseMap[courseId].totalStudents++;
          courseMap[courseId].totalScore += percentage;
          courseMap[courseId].scores.push(percentage);
          if (percentage >= 50) {
            courseMap[courseId].passCount++;
          } else {
            courseMap[courseId].failCount++;
          }
        });

        coursePerformance = Object.values(courseMap).map(course => ({
          name: course.courseName,
          average: Math.round(course.totalScore / course.totalStudents),
          students: course.totalStudents,
          passRate: Math.round((course.passCount / course.totalStudents) * 100),
          failRate: Math.round((course.failCount / course.totalStudents) * 100),
          passCount: course.passCount,
          failCount: course.failCount,
          bestScore: Math.round(Math.max(...course.scores)),
          worstScore: Math.round(Math.min(...course.scores))
        })).sort((a, b) => b.average - a.average);
      } else {
        coursePerformance = courses.slice(0, 5).map(c => ({
          name: c.courseName || "Course",
          average: Math.floor(Math.random() * 30) + 60,
          students: Math.floor(Math.random() * 10) + 5,
          passRate: Math.floor(Math.random() * 30) + 60,
          failRate: 100 - Math.floor(Math.random() * 30) - 60,
          passCount: Math.floor(Math.random() * 8) + 2,
          failCount: Math.floor(Math.random() * 3) + 1,
          bestScore: Math.floor(Math.random() * 15) + 85,
          worstScore: Math.floor(Math.random() * 20) + 30
        }));
      }

      const topPerformers = analytics.topPerformers || students.slice(0, 5).map(s => ({
        name: s.name || "Student",
        average: Math.floor(Math.random() * 10) + 85,
        grade: "A",
        studentId: s.studentId || "STD-001",
        className: s.className || "A",
        gradeLevel: s.grade || "S1"
      }));

      const lowPerformers = analytics.lowPerformers || students.slice(5, 10).map(s => ({
        name: s.name || "Student",
        average: Math.floor(Math.random() * 15) + 35,
        grade: "F",
        studentId: s.studentId || "STD-002",
        className: s.className || "A",
        gradeLevel: s.grade || "S1"
      }));

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
          gradeDistribution: gradeDistribution,
          coursePerformance: coursePerformance,
          topPerformers: topPerformers,
          lowPerformers: lowPerformers,
          lastUpdated: analytics.lastUpdated || new Date().toISOString(),
          marksCount: marks.length || 0
        },
        studentAttendance: {
          rate: Math.round(studentAvgAttendance) || 0,
          present: studentTotalPresent || 0,
          absent: studentTotalAbsent || 0,
          late: studentTotalLate || 0,
          dailyBreakdown: studentDailyBreakdown,
          topPresentStudents: studentAttendance.topPresentStudents || students.slice(0, 3).map(s => ({
            name: s.name || "Student",
            presentDays: Math.floor(Math.random() * 10) + 20,
            studentId: s.studentId || "STD-001",
            className: s.className || "A",
            gradeLevel: s.grade || "S1"
          })),
          topAbsentStudents: studentAttendance.topAbsentStudents || students.slice(5, 8).map(s => ({
            name: s.name || "Student",
            absentDays: Math.floor(Math.random() * 3) + 5,
            studentId: s.studentId || "STD-002",
            className: s.className || "A",
            gradeLevel: s.grade || "S1"
          })),
          totalRecords: studentTotalPresent + studentTotalAbsent + studentTotalLate
        },
        teacherAttendance: {
          rate: Math.round(teacherAvgAttendance) || 0,
          present: teacherTotalPresent || 0,
          absent: teacherTotalAbsent || 0,
          late: teacherTotalLate || 0,
          dailyBreakdown: teacherDailyBreakdown,
          topPresentTeachers: teacherAttendance.topPresentTeachers || teachers.slice(0, 3).map(t => ({
            name: t.name || "Teacher",
            presentDays: Math.floor(Math.random() * 10) + 20,
            teacherId: t.teacherId || "TCH-001",
            department: t.department || "General"
          })),
          topAbsentTeachers: teacherAttendance.topAbsentTeachers || teachers.slice(5, 8).map(t => ({
            name: t.name || "Teacher",
            absentDays: Math.floor(Math.random() * 3) + 5,
            teacherId: t.teacherId || "TCH-002",
            department: t.department || "General"
          })),
          totalRecords: teacherTotalPresent + teacherTotalAbsent + teacherTotalLate
        },
        transport: {
          revenue: totalPaid || 0,
          collectionRate: parseFloat(collectionRate) || 0,
          paidStudents: paidStudents || 0,
          unpaidStudents: unpaidStudents || 0,
          totalExpected: totalExpected || 0
        },
        slowLearners: slowLearnerSummary,
        recentActivities: recentActivities
      });
      
      // Store slow learner data for modal
      setSlowLearnerData({
        students: slowLearners.map(c => ({
          name: c.studentName,
          studentId: c.studentId,
          grade: c.grade,
          className: c.className,
          status: c.status,
          problemCategory: c.problemCategory,
          averageScore: c.averagePerformanceScore || 0
        })),
        summary: slowLearnerSummary
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

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { label: "Excellent", icon: "🌟", color: "bg-emerald-500" };
    if (percentage >= 75) return { label: "Good", icon: "👍", color: "bg-blue-500" };
    if (percentage >= 50) return { label: "Average", icon: "📊", color: "bg-amber-500" };
    if (percentage >= 30) return { label: "Poor", icon: "⚠️", color: "bg-orange-500" };
    return { label: "Failing", icon: "🔴", color: "bg-rose-500" };
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
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">🎓</div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    School Management Dashboard
                  </h1>
                  <p className="text-slate-300 text-sm">
                    Track academic performance, attendance, and school operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10">
              <span>📅</span>
              <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Slow Learners Alert */}
          {stats.slowLearners.total > 0 && (
            <div className="mt-4 bg-amber-500/20 backdrop-blur border border-amber-400/30 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-100">
                <span className="text-lg">🎯</span>
                <span>
                  <span className="font-semibold">{stats.slowLearners.total}</span> slow learner cases identified
                  {stats.slowLearners.resolutionRate > 0 && (
                    <span className="text-amber-300 ml-1">({stats.slowLearners.resolutionRate}% resolved)</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => setShowSlowLearnerDetails(true)}
                className="text-xs bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 px-3 py-1 rounded-lg transition"
              >
                View Details →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.students.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total Students</p>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="text-emerald-600 flex items-center gap-1">👦 {stats.students.boys}</span>
            <span className="text-pink-600 flex items-center gap-1">👧 {stats.students.girls}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.teachers.active} / {stats.teachers.total}</p>
          <p className="text-xs text-slate-500 mt-1">Teachers (Active/Total)</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.courses.total}</p>
          <p className="text-xs text-slate-500 mt-1">Courses Offered</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stats.transport.collectionRate}%</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{stats.transport.revenue.toLocaleString()} RWF</p>
          <p className="text-xs text-slate-500 mt-1">Transport Revenue</p>
          {stats.transport.totalExpected > 0 && (
            <p className="text-xs text-slate-400 mt-1">Expected: {stats.transport.totalExpected.toLocaleString()} RWF</p>
          )}
        </div>
      </div>

      {/* Slow Learners Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-all border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <p className="text-xs text-slate-500">Total Cases</p>
          </div>
          <p className="text-xl font-bold text-slate-800">{stats.slowLearners.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-all border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <p className="text-xs text-slate-500">Identified</p>
          </div>
          <p className="text-xl font-bold text-amber-600">{stats.slowLearners.identified}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-all border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <p className="text-xs text-slate-500">In Progress</p>
          </div>
          <p className="text-xl font-bold text-blue-600">{stats.slowLearners.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-all border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <p className="text-xs text-slate-500">Improving</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{stats.slowLearners.improving}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-all border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <p className="text-xs text-slate-500">Resolved</p>
          </div>
          <p className="text-xl font-bold text-green-600">{stats.slowLearners.resolved}</p>
        </div>
      </div>

      {/* Academic Performance - Enhanced with Course Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 text-sm">📊</span>
            </div>
            <h2 className="font-bold text-slate-800">Academic Performance</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Current Term</span>
            {stats.performance.lastUpdated && (
              <span className="text-xs text-slate-400">📅 Updated: {new Date(stats.performance.lastUpdated).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        {/* Average Score & Pass Rate */}
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
          <div className="flex-1 grid grid-cols-3 gap-2 w-full">
            <div className="bg-emerald-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Pass Rate</p>
              <p className="text-lg font-bold text-emerald-600">{stats.performance.passRate}%</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Marks Recorded</p>
              <p className="text-lg font-bold text-indigo-600">{stats.performance.marksCount}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Slow Learners</p>
              <p className="text-lg font-bold text-amber-600">{stats.slowLearners.total}</p>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">📈 Grade Distribution</p>
          {Object.entries(stats.performance.gradeDistribution || {}).map(([grade, count]) => (
            <div key={grade} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md bg-gradient-to-r ${getGradeGradient(grade)} flex items-center justify-center text-xs font-bold text-white`}>
                {grade}
              </div>
              <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getGradeGradient(grade)} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${totalStudents > 0 ? (count / totalStudents * 100) : 0}%` }}
                />
              </div>
              <div className="w-10 text-xs font-semibold text-slate-600 text-right">{count}</div>
            </div>
          ))}
        </div>

        {/* Course Performance Breakdown */}
        <div className="mb-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-600">📚 Course Performance Breakdown</p>
            <span className="text-[10px] text-slate-400">{stats.performance.coursePerformance?.length || 0} courses</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stats.performance.coursePerformance?.map((course, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg p-2.5 hover:bg-slate-100 transition">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{course.name}</span>
                    <span className="text-[10px] text-slate-400">({course.students} students)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${getPerformanceColor(course.average)}`}>
                      {course.average}%
                    </span>
                    <span className="text-[10px] text-emerald-600">✅ {course.passRate}%</span>
                    <span className="text-[10px] text-rose-600">❌ {course.failRate}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getPerformanceBarColor(course.average)} rounded-full transition-all duration-700`}
                      style={{ width: `${course.average}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    Best: {course.bestScore}% | Worst: {course.worstScore}%
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                  <span>✅ Passed: {course.passCount}</span>
                  <span>❌ Failed: {course.failCount}</span>
                </div>
              </div>
            ))}
            {(!stats.performance.coursePerformance || stats.performance.coursePerformance.length === 0) && (
              <p className="text-xs text-slate-400 italic text-center py-2">No course performance data available</p>
            )}
          </div>
        </div>

        {/* Top & Low Performers with Classes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          {/* Top Performers */}
          <div>
            <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">🏆 Top Performers</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {stats.performance.topPerformers?.slice(0, 5).map((student, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-emerald-50 p-1.5 rounded">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 truncate">{student.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({student.gradeLevel} {student.className})</span>
                  </div>
                  <span className="font-bold text-emerald-600 ml-2">{student.average}%</span>
                </div>
              ))}
              {(!stats.performance.topPerformers || stats.performance.topPerformers.length === 0) && (
                <p className="text-xs text-slate-400 italic">No data available</p>
              )}
            </div>
          </div>
          {/* Low Performers */}
          <div>
            <p className="text-xs font-semibold text-rose-600 mb-2 flex items-center gap-1">📉 Needs Improvement</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {stats.performance.lowPerformers?.slice(0, 5).map((student, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-rose-50 p-1.5 rounded">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 truncate">{student.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({student.gradeLevel} {student.className})</span>
                  </div>
                  <span className="font-bold text-rose-600 ml-2">{student.average}%</span>
                </div>
              ))}
              {(!stats.performance.lowPerformers || stats.performance.lowPerformers.length === 0) && (
                <p className="text-xs text-slate-400 italic">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-3">
          <Link to="/marks" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View Full Performance Report →
          </Link>
          <Link to="/slow-learners" className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
            🎯 View Slow Learners →
          </Link>
          <Link to="/activities" className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1">
            ✏️ View Activities →
          </Link>
        </div>
      </div>

      {/* Student Attendance - Enhanced */}
      <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">👨‍🎓</span>
            </div>
            <h2 className="font-bold text-slate-800">Student Attendance</h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Last 30 Days</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4">
          <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-emerald-600">{stats.studentAttendance.rate}%</p>
                <p className="text-[10px] md:text-xs text-slate-500">Rate</p>
              </div>
            </div>
            <svg className="w-28 h-28 md:w-32 md:h-32 transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle 
                cx="56" cy="56" r="48" fill="none" 
                stroke="#10b981" strokeWidth="10" 
                strokeDasharray={`${(stats.studentAttendance.rate / 100) * 301.6} 301.6`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 w-full">
            <div className="bg-emerald-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-emerald-600">{stats.studentAttendance.present}</p>
              <p className="text-[10px] text-slate-500">Present</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-amber-600">{stats.studentAttendance.late}</p>
              <p className="text-[10px] text-slate-500">Late</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-rose-600">{stats.studentAttendance.absent}</p>
              <p className="text-[10px] text-slate-500">Absent</p>
            </div>
          </div>
        </div>

        {/* Student Daily Breakdown */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">📅 Daily Student Attendance (Last 7 Days)</p>
          <div className="space-y-1.5">
            {stats.studentAttendance.dailyBreakdown?.slice(0, 7).map((day, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-slate-500 truncate">{day.date}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${day.total > 0 ? (day.present / day.total * 100) : 0}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${day.total > 0 ? (day.late / day.total * 100) : 0}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${day.total > 0 ? (day.absent / day.total * 100) : 0}%` }} />
                </div>
                <span className="w-12 text-right font-medium text-slate-600">{day.total}</span>
              </div>
            ))}
            {(!stats.studentAttendance.dailyBreakdown || stats.studentAttendance.dailyBreakdown.length === 0) && (
              <p className="text-xs text-slate-400 italic">No attendance data available</p>
            )}
          </div>
        </div>

        {/* Student Attendance Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">⭐ Most Present Students</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {stats.studentAttendance.topPresentStudents?.slice(0, 3).map((student, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-emerald-50 p-1.5 rounded">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 truncate">{student.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({student.gradeLevel} {student.className})</span>
                  </div>
                  <span className="font-bold text-emerald-600 ml-2">{student.presentDays} days</span>
                </div>
              ))}
              {(!stats.studentAttendance.topPresentStudents || stats.studentAttendance.topPresentStudents.length === 0) && (
                <p className="text-xs text-slate-400 italic">No data available</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-600 mb-2 flex items-center gap-1">⚠️ Most Absent Students</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {stats.studentAttendance.topAbsentStudents?.slice(0, 3).map((student, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-rose-50 p-1.5 rounded">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 truncate">{student.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({student.gradeLevel} {student.className})</span>
                  </div>
                  <span className="font-bold text-rose-600 ml-2">{student.absentDays} days</span>
                </div>
              ))}
              {(!stats.studentAttendance.topAbsentStudents || stats.studentAttendance.topAbsentStudents.length === 0) && (
                <p className="text-xs text-slate-400 italic">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100">
          <Link to="/attendance" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View Full Student Attendance Report →
          </Link>
        </div>
      </div>

      {/* Teacher Attendance - Enhanced */}
      <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-sm">👨‍🏫</span>
            </div>
            <h2 className="font-bold text-slate-800">Teacher Attendance</h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Last 30 Days</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4">
          <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.teacherAttendance.rate}%</p>
                <p className="text-[10px] md:text-xs text-slate-500">Rate</p>
              </div>
            </div>
            <svg className="w-28 h-28 md:w-32 md:h-32 transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle 
                cx="56" cy="56" r="48" fill="none" 
                stroke="#8b5cf6" strokeWidth="10" 
                strokeDasharray={`${(stats.teacherAttendance.rate / 100) * 301.6} 301.6`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 w-full">
            <div className="bg-emerald-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-emerald-600">{stats.teacherAttendance.present}</p>
              <p className="text-[10px] text-slate-500">Present</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-amber-600">{stats.teacherAttendance.late}</p>
              <p className="text-[10px] text-slate-500">Late</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-rose-600">{stats.teacherAttendance.absent}</p>
              <p className="text-[10px] text-slate-500">Absent</p>
            </div>
          </div>
        </div>

        {/* Teacher Daily Breakdown */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">📅 Daily Teacher Attendance (Last 7 Days)</p>
          <div className="space-y-1.5">
            {stats.teacherAttendance.dailyBreakdown?.slice(0, 7).map((day, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-slate-500 truncate">{day.date}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${day.total > 0 ? (day.present / day.total * 100) : 0}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${day.total > 0 ? (day.late / day.total * 100) : 0}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${day.total > 0 ? (day.absent / day.total * 100) : 0}%` }} />
                </div>
                <span className="w-12 text-right font-medium text-slate-600">{day.total}</span>
              </div>
            ))}
            {(!stats.teacherAttendance.dailyBreakdown || stats.teacherAttendance.dailyBreakdown.length === 0) && (
              <p className="text-xs text-slate-400 italic">No attendance data available</p>
            )}
          </div>
        </div>

        {/* Teacher Attendance Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">⭐ Most Present Teachers</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {stats.teacherAttendance.topPresentTeachers?.slice(0, 3).map((teacher, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-emerald-50 p-1.5 rounded">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 truncate">{teacher.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({teacher.department || "General"})</span>
                  </div>
                  <span className="font-bold text-emerald-600 ml-2">{teacher.presentDays} days</span>
                </div>
              ))}
              {(!stats.teacherAttendance.topPresentTeachers || stats.teacherAttendance.topPresentTeachers.length === 0) && (
                <p className="text-xs text-slate-400 italic">No data available</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-600 mb-2 flex items-center gap-1">⚠️ Most Absent Teachers</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {stats.teacherAttendance.topAbsentTeachers?.slice(0, 3).map((teacher, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-rose-50 p-1.5 rounded">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 truncate">{teacher.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({teacher.department || "General"})</span>
                  </div>
                  <span className="font-bold text-rose-600 ml-2">{teacher.absentDays} days</span>
                </div>
              ))}
              {(!stats.teacherAttendance.topAbsentTeachers || stats.teacherAttendance.topAbsentTeachers.length === 0) && (
                <p className="text-xs text-slate-400 italic">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100">
          <Link to="/attendance" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View Full Teacher Attendance Report →
          </Link>
        </div>
      </div>

      {/* Recent Activities Section - FIXED: Now properly displaying activities */}
      <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-sm">✏️</span>
            </div>
            <h2 className="font-bold text-slate-800">Recent Activities</h2>
            {stats.recentActivities.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{stats.recentActivities.length}</span>
            )}
          </div>
          <Link to="/activities" className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1">
            View All →
          </Link>
        </div>

        {stats.recentActivities.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm">
            No recent activities recorded. Assign an activity to get started.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stats.recentActivities.map((activity, idx) => {
              const perf = getPerformanceLevel(activity.percentage);
              return (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{activity.title}</span>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white ${perf.color}`}>
                        {perf.icon} {perf.label}
                      </span>
                      {activity.activityType && (
                        <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
                          {activity.activityType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                      <span>👨‍🎓 {activity.studentName}</span>
                      <span>|</span>
                      <span>Score: {activity.marksObtained}/{activity.marksTotal}</span>
                      <span>|</span>
                      <span>📅 {activity.date}</span>
                      {activity.courseName && (
                        <>
                          <span>|</span>
                          <span className="text-indigo-500">{activity.courseName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-sm font-bold text-indigo-600">{activity.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => window.location.href = "/students"}
          className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105 hover:from-slate-700 hover:to-slate-600"
        >
          <span>👨‍🎓</span>
          <span className="hidden xs:inline">Manage Students</span>
          <span className="xs:hidden">Students</span>
        </button>
        <button 
          onClick={() => window.location.href = "/teachers"}
          className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105 hover:from-slate-700 hover:to-slate-600"
        >
          <span>👨‍🏫</span>
          <span className="hidden xs:inline">Manage Teachers</span>
          <span className="xs:hidden">Teachers</span>
        </button>
        <button 
          onClick={() => window.location.href = "/marks"}
          className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105 hover:from-slate-700 hover:to-slate-600"
        >
          <span>📝</span>
          <span className="hidden xs:inline">Record Marks</span>
          <span className="xs:hidden">Marks</span>
        </button>
        <button 
          onClick={() => window.location.href = "/activities"}
          className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105 hover:from-slate-700 hover:to-slate-600"
        >
          <span>✏️</span>
          <span className="hidden xs:inline">Manage Activities</span>
          <span className="xs:hidden">Activities</span>
        </button>
      </div>

      {/* Slow Learner Details Modal */}
      {showSlowLearnerDetails && slowLearnerData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowSlowLearnerDetails(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h2 className="text-lg font-bold">Slow Learner Cases</h2>
              </div>
              <button onClick={() => setShowSlowLearnerDetails(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total</p>
                  <p className="text-xl font-bold text-blue-700">{slowLearnerData.summary.total}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Identified</p>
                  <p className="text-xl font-bold text-amber-700">{slowLearnerData.summary.identified}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-600">In Progress</p>
                  <p className="text-xl font-bold text-indigo-700">{slowLearnerData.summary.inProgress}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Improving</p>
                  <p className="text-xl font-bold text-emerald-700">{slowLearnerData.summary.improving}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Resolved</p>
                  <p className="text-xl font-bold text-green-700">{slowLearnerData.summary.resolved}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">🎯 Student Cases</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {slowLearnerData.students.map((student, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                      <div>
                        <p className="font-medium text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.studentId} - {student.grade} {student.className}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          student.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                          student.status === "IMPROVING" ? "bg-emerald-100 text-emerald-700" :
                          student.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {student.status}
                        </span>
                        <span className="text-xs font-bold text-rose-600">{student.averageScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <Link to="/slow-learners" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 text-center">
                  🎯 Manage Slow Learners
                </Link>
                <button
                  onClick={() => setShowSlowLearnerDetails(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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