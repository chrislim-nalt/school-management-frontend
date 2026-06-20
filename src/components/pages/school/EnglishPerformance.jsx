import React, { useEffect, useState } from "react";
import { 
  recordEnglishViolation, 
  getClassEnglishDashboard,
  getEnglishPerformanceReport,
  getStudents 
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function EnglishPerformance() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSemester, setFilterSemester] = useState("TERM1");
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [showViolationDetails, setShowViolationDetails] = useState(false);
  
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D"];
  const semesters = ["TERM1", "TERM2", "TERM3"];
  const locations = ["CLASSROOM", "HALL", "PLAYGROUND", "DORMITORY", "OTHER"];

  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    studentGrade: "",
    studentClass: "",
    location: "CLASSROOM",
    context: "",
    actionTaken: "Red Card",
    semester: "TERM1"
  });

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      const allStudents = res.data || [];
      setStudents(allStudents);
      applyFilters(allStudents);
    } catch (error) {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (studentList = students) => {
    let filtered = [...studentList];
    if (selectedGrade !== "ALL") {
      filtered = filtered.filter(s => s.grade === selectedGrade);
    }
    if (selectedClass !== "ALL") {
      filtered = filtered.filter(s => s.className === selectedClass);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(term) || 
        s.studentId?.toLowerCase().includes(term)
      );
    }
    setFilteredStudents(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedGrade, selectedClass, searchTerm, students]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await getClassEnglishDashboard({
        grade: filterGrade !== "ALL" ? filterGrade : undefined,
        className: filterClass !== "ALL" ? filterClass : undefined,
        semester: filterSemester
      });
      
      const processedData = { ...res.data };
      if (processedData.performances) {
        processedData.performances = processedData.performances.map(student => {
          const studentViolations = processedData.allViolations?.filter(
            v => v.studentId === student.studentId
          ) || [];
          
          const mostRecentViolation = studentViolations.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          )[0];
          
          return {
            ...student,
            recentViolationContext: mostRecentViolation?.context || "No context recorded",
            recentViolationLocation: mostRecentViolation?.location || "-",
            recentViolationDate: mostRecentViolation?.date ? new Date(mostRecentViolation.date).toLocaleDateString() : "-",
            recentViolationAction: mostRecentViolation?.actionTaken || "-"
          };
        });
      }
      
      setDashboardData(processedData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getEnglishPerformanceReport({
        semester: filterSemester,
        academicYear: new Date().getFullYear(),
        grade: filterGrade !== "ALL" ? filterGrade : undefined,
        className: filterClass !== "ALL" ? filterClass : undefined
      });
      setReportData(res.data);
      setShowReport(true);
    } catch (error) {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudents();
    fetchDashboard();
  }, [filterGrade, filterClass, filterSemester]);

  const handleSelectStudent = (student) => {
    setForm({
      ...form,
      studentId: student._id,
      studentName: student.name,
      studentGrade: student.grade,
      studentClass: student.className,
    });
  };

  const handleRecordViolation = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      setError("Please select a student");
      return;
    }
    
    if (!form.context.trim()) {
      setError("Please provide context of what was said");
      return;
    }
    
    setLoading(true);
    try {
      await recordEnglishViolation({
        studentId: form.studentId,
        location: form.location,
        context: form.context,
        actionTaken: form.actionTaken,
        semester: filterSemester
      });
      setSuccess("Violation recorded successfully!");
      setShowAddForm(false);
      setForm({
        studentId: "",
        studentName: "",
        studentGrade: "",
        studentClass: "",
        location: "CLASSROOM",
        context: "",
        actionTaken: "Red Card",
        semester: filterSemester
      });
      setSelectedGrade("ALL");
      setSelectedClass("ALL");
      setSearchTerm("");
      fetchDashboard();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to record violation");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (violationCount) => {
    if (violationCount === 0) return { label: "Excellent", color: "bg-emerald-100 text-emerald-700", icon: "🟢", description: "No violations" };
    if (violationCount <= 2) return { label: "Good", color: "bg-blue-100 text-blue-700", icon: "🔵", description: "Minor violations" };
    if (violationCount <= 4) return { label: "Needs Attention", color: "bg-amber-100 text-amber-700", icon: "🟡", description: "Multiple violations" };
    return { label: "Critical", color: "bg-red-100 text-red-700", icon: "🔴", description: "Frequent violations" };
  };

  const calculateSchoolMetrics = () => {
    if (!dashboardData) return null;
    
    const totalStudents = dashboardData.summary?.totalStudents || 0;
    const totalViolations = dashboardData.summary?.totalViolations || 0;
    const cleanStudents = dashboardData.summary?.studentsWithoutViolations || 0;
    const atRiskStudents = dashboardData.summary?.studentsWithViolations || 0;
    
    const complianceRate = totalStudents > 0 ? ((cleanStudents / totalStudents) * 100).toFixed(1) : 0;
    
    // Determine performance level
    let performanceLevel = "Excellent";
    let performanceColor = "text-emerald-600";
    let performanceBg = "bg-emerald-50";
    let recommendation = "";
    
    if (complianceRate >= 90) {
      performanceLevel = "Excellent";
      performanceColor = "text-emerald-600";
      performanceBg = "bg-emerald-50";
      recommendation = "School is performing excellently. Maintain current strategies.";
    } else if (complianceRate >= 75) {
      performanceLevel = "Good";
      performanceColor = "text-blue-600";
      performanceBg = "bg-blue-50";
      recommendation = "Good performance. Focus on reducing violations in high-risk areas.";
    } else if (complianceRate >= 60) {
      performanceLevel = "Average";
      performanceColor = "text-amber-600";
      performanceBg = "bg-amber-50";
      recommendation = "Average performance. Need targeted interventions.";
    } else {
      performanceLevel = "Critical";
      performanceColor = "text-red-600";
      performanceBg = "bg-red-50";
      recommendation = "Critical situation. Immediate school-wide intervention required.";
    }
    
    return {
      complianceRate,
      totalStudents,
      totalViolations,
      cleanStudents,
      atRiskStudents,
      performanceLevel,
      performanceColor,
      performanceBg,
      recommendation,
      averageViolationsPerStudent: totalStudents > 0 ? (totalViolations / totalStudents).toFixed(1) : 0
    };
  };

  const schoolMetrics = calculateSchoolMetrics();

  // Prepare trend data for simple display
  const getTrendAnalysis = () => {
    if (!dashboardData?.weeklyTrend || dashboardData.weeklyTrend.length < 4) return null;
    
    const recent4Weeks = dashboardData.weeklyTrend.slice(-4);
    const previous4Weeks = dashboardData.weeklyTrend.slice(-8, -4);
    
    const recentAvg = recent4Weeks.reduce((sum, w) => sum + w.count, 0) / 4;
    const previousAvg = previous4Weeks.length > 0 ? previous4Weeks.reduce((sum, w) => sum + w.count, 0) / 4 : recentAvg;
    
    const percentChange = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1) : 0;
    
    if (recentAvg < previousAvg) {
      return {
        direction: "improving",
        message: `Violations are DECREASING by ${Math.abs(percentChange)}% compared to previous period`,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: "📉"
      };
    } else if (recentAvg > previousAvg) {
      return {
        direction: "worsening",
        message: `Violations are INCREASING by ${percentChange}% compared to previous period`,
        color: "text-red-600",
        bg: "bg-red-50",
        icon: "📈"
      };
    } else {
      return {
        direction: "stable",
        message: "Violations are STABLE compared to previous period",
        color: "text-blue-600",
        bg: "bg-blue-50",
        icon: "➡️"
      };
    }
  };

  const trendAnalysis = getTrendAnalysis();

  const exportData = dashboardData?.performances?.map(p => ({
    "Student Name": p.studentName,
    "Student ID": p.studentId,
    "Grade": p.grade,
    "Class": p.className,
    "Violation Count": p.violationCount,
    "Status": getStatusBadge(p.violationCount).label,
    "Last Violation Context": p.recentViolationContext || "-",
    "Last Violation Location": p.recentViolationLocation || "-"
  })) || [];

  const exportColumns = exportData.length > 0 ? Object.keys(exportData[0]).map(key => ({ key, label: key })) : [];

  return (
    <div className="space-y-4">
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm`}>
          <span className="text-lg">{success ? "✓" : "⚠"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                🇬🇧 English Speaking Performance
              </h1>
              <p className="text-slate-300 text-sm">
                Track and improve English speaking compliance across the school
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedGrade("ALL");
                  setSelectedClass("ALL");
                  setSearchTerm("");
                  setShowAddForm(true);
                }}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span>🔴</span> Record Violation
              </button>
              <button
                onClick={fetchReport}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span>📊</span> Full Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Card - Easy to understand */}
      {schoolMetrics && (
        <div className={`rounded-xl shadow-lg overflow-hidden ${schoolMetrics.performanceBg}`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">📋 Executive Summary</h2>
              <span className={`text-sm font-bold ${schoolMetrics.performanceColor}`}>
                Performance: {schoolMetrics.performanceLevel}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{schoolMetrics.totalStudents}</p>
                <p className="text-xs text-gray-500">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{schoolMetrics.totalViolations}</p>
                <p className="text-xs text-gray-500">Total Violations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{schoolMetrics.cleanStudents}</p>
                <p className="text-xs text-gray-500">Clean Students</p>
                <p className="text-[10px] text-gray-400">(0 violations)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{schoolMetrics.atRiskStudents}</p>
                <p className="text-xs text-gray-500">At Risk Students</p>
                <p className="text-[10px] text-gray-400">(1+ violations)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{schoolMetrics.averageViolationsPerStudent}</p>
                <p className="text-xs text-gray-500">Avg Violations/Student</p>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Compliance Rate</span>
                <span className={`font-bold ${schoolMetrics.performanceColor}`}>{schoolMetrics.complianceRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${schoolMetrics.performanceColor.replace('text', 'bg')}`}
                  style={{ width: `${schoolMetrics.complianceRate}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-3 flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span>{schoolMetrics.recommendation}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trend Analysis Card - Clear direction */}
      {trendAnalysis && (
        <div className={`rounded-xl shadow-lg p-5 ${trendAnalysis.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 mb-1">📈 Trend Analysis</h3>
              <p className={`text-sm font-medium ${trendAnalysis.color}`}>
                {trendAnalysis.icon} {trendAnalysis.message}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {dashboardData?.weeklyTrend?.slice(-4).reduce((sum, w) => sum + w.count, 0) || 0}
              </p>
              <p className="text-xs text-gray-500">Last 4 weeks violations</p>
            </div>
          </div>
        </div>
      )}

      {/* Simple Weekly Trend Table - Easy to read */}
      {dashboardData?.weeklyTrend && dashboardData.weeklyTrend.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-slate-100">
            <h3 className="font-semibold text-gray-800">📅 Weekly Violation Trend</h3>
            <p className="text-xs text-gray-500 mt-0.5">Number of violations recorded each week</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Week</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Violations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.weeklyTrend.map((week, idx) => {
                  let statusColor = "text-gray-500";
                  let statusIcon = "➡️";
                  if (idx > 0) {
                    const prevCount = dashboardData.weeklyTrend[idx - 1].count;
                    if (week.count < prevCount) {
                      statusColor = "text-emerald-600";
                      statusIcon = "↓";
                    } else if (week.count > prevCount) {
                      statusColor = "text-red-600";
                      statusIcon = "↑";
                    } else {
                      statusColor = "text-blue-600";
                      statusIcon = "→";
                    }
                  }
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{week.week}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{week.count} violation{week.count !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${statusColor}`}>
                          {idx > 0 ? `${statusIcon} ${week.count > dashboardData.weeklyTrend[idx - 1].count ? 'Increase' : week.count < dashboardData.weeklyTrend[idx - 1].count ? 'Decrease' : 'Stable'}` : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Location Summary - Simple percentages */}
      {dashboardData?.locationDistribution && (
        <div className="bg-white rounded-xl shadow-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-4">📍 Where Violations Happen</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(dashboardData.locationDistribution).map(([location, count]) => {
              const total = Object.values(dashboardData.locationDistribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              let barColor = "bg-blue-500";
              if (percentage > 40) barColor = "bg-red-500";
              else if (percentage > 20) barColor = "bg-amber-500";
              
              return (
                <div key={location} className="text-center">
                  <div className="text-3xl mb-1">
                    {location === "CLASSROOM" ? "📚" : 
                     location === "HALL" ? "🏛️" :
                     location === "PLAYGROUND" ? "⚽" :
                     location === "DORMITORY" ? "🛏️" : "📍"}
                  </div>
                  <p className="text-sm font-medium text-gray-700">{location}</p>
                  <p className="text-xl font-bold text-gray-800">{count}</p>
                  <p className="text-xs text-gray-400">{percentage}%</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
                    <div className={`${barColor} h-1 rounded-full`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">⚠️ Focus Area:</span> Most violations occur in {
                Object.entries(dashboardData.locationDistribution)
                  .sort((a, b) => b[1] - a[1])[0]?.[0]
              }. Increase monitoring in this area.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select 
            value={filterSemester} 
            onChange={(e) => setFilterSemester(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            {semesters.map(s => <option key={s} value={s}>{s.replace("TERM", "Term ")}</option>)}
          </select>
          <button 
            onClick={fetchDashboard}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Export Section */}
      {dashboardData?.performances && dashboardData.performances.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">📥 Export Data</h3>
            <p className="text-xs text-gray-500">Download report in CSV, Excel, or PDF</p>
          </div>
          <DownloadButton 
            data={exportData} 
            columns={exportColumns} 
            title="English Performance Report" 
            filename={`english_performance_${filterSemester}`} 
            variant="primary" 
          />
        </div>
      )}

      {/* Student Performance Table */}
      {dashboardData?.performances && dashboardData.performances.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-slate-100">
            <h3 className="font-semibold text-gray-800">👨‍🎓 Student Performance Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">Individual student violation records and status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Violations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Violation</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.performances.slice(0, 50).map((student, idx) => {
                  const status = getStatusBadge(student.violationCount);
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.studentName}</td>
                      <td className="px-4 py-3 text-sm font-mono text-indigo-600">{student.studentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.grade} {student.className}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                          student.violationCount === 0 ? "bg-emerald-100 text-emerald-700" :
                          student.violationCount <= 2 ? "bg-blue-100 text-blue-700" :
                          student.violationCount <= 4 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {student.violationCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{status.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        {student.violationCount > 0 ? (
                          <div>
                            <p className="text-xs text-gray-600 max-w-xs truncate" title={student.recentViolationContext}>
                              "{student.recentViolationContext?.substring(0, 40)}..."
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              📍 {student.recentViolationLocation} • {student.recentViolationDate}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600">✨ No violations</span>
                        )}
                       </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudentDetails(student);
                            setShowViolationDetails(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          disabled={student.violationCount === 0}
                        >
                          {student.violationCount > 0 ? "View Details →" : "-"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {dashboardData.performances.length > 50 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">Showing first 50 students. Use filters to narrow results.</p>
            </div>
          )}
        </div>
      )}

      {/* Critical Cases Section */}
      {dashboardData?.topViolators && dashboardData.topViolators.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-amber-50">
            <h3 className="font-semibold text-red-800 flex items-center gap-2">
              <span>⚠️</span> Students Needing Immediate Attention
            </h3>
            <p className="text-xs text-red-600 mt-0.5">Students with 3 or more violations require intervention</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Violations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">What Was Said</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.topViolators.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.studentName}</td>
                    <td className="px-4 py-3 text-sm font-mono text-indigo-600">{student.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.grade} {student.className}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {student.violationCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600 max-w-xs" title={student.recentViolations?.[0]?.context}>
                        "{student.recentViolations?.[0]?.context?.substring(0, 50)}..."
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {student.recentViolations?.[0]?.location || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-red-600">
                        {student.violationCount >= 5 ? "📞 Schedule parent meeting immediately" : 
                         student.violationCount >= 3 ? "📝 Refer to counselor for intervention" : 
                         "👁️ Monitor closely"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {(!dashboardData?.performances || dashboardData.performances.length === 0) && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No Data Available</h3>
          <p className="text-sm text-gray-500">No English performance records found for the selected filters.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Record First Violation
          </button>
        </div>
      )}

      {/* Add Violation Modal - Keep as is */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3 flex justify-between items-center bg-gradient-to-r from-rose-50 to-amber-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-800">🔴 Record English Violation</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleRecordViolation} className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Student</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="ALL">All Grades</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="ALL">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">No students found</div>
                  ) : (
                    filteredStudents.map(student => (
                      <div
                        key={student._id}
                        onClick={() => handleSelectStudent(student)}
                        className={`p-2 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${
                          form.studentId === student._id
                            ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.studentId}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-indigo-600">{student.grade}</span>
                            <span className="text-xs text-slate-400 ml-1">Class {student.className}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {form.studentId && (
                  <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">Selected:</p>
                    <p className="text-sm font-semibold text-emerald-800">{form.studentName}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {locations.map(l => (<option key={l} value={l}>{l}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">What was said? *</label>
                <textarea
                  value={form.context}
                  onChange={(e) => setForm({...form, context: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Record exactly what the student said..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action Taken</label>
                <select
                  value={form.actionTaken}
                  onChange={(e) => setForm({...form, actionTaken: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Red Card">🔴 Red Card</option>
                  <option value="Warning">⚠️ Warning</option>
                  <option value="Verbal Warning">🗣️ Verbal Warning</option>
                  <option value="Parent Meeting">👨‍👩‍👧 Parent Meeting</option>
                </select>
              </div>

              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  ⚠️ This will be recorded as an English policy violation.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading || !form.studentId} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Recording..." : "Record Violation"}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📊 English Performance Report</h2>
              <button onClick={() => setShowReport(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Violations</p>
                  <p className="text-xl font-bold text-blue-700">{reportData.totalViolations}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Avg per Student</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData.averageViolationsPerStudent}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Trend</p>
                  <p className="text-xl font-bold text-amber-700">{reportData.improvementTrend}</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-600">Need Intervention</p>
                  <p className="text-xl font-bold text-rose-700">{reportData.studentsNeedingIntervention}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Violation Details Modal */}
      {showViolationDetails && selectedStudentDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViolationDetails(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">Violation History - {selectedStudentDetails.studentName}</h2>
              <button onClick={() => setShowViolationDetails(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Student ID</p>
                  <p className="text-sm font-semibold">{selectedStudentDetails.studentId}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-sm font-semibold">{selectedStudentDetails.grade} {selectedStudentDetails.className}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Total Violations</p>
                  <p className="text-2xl font-bold text-rose-600">{selectedStudentDetails.violationCount}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">Violation Records</h3>
                {selectedStudentDetails.recentViolations?.map((violation, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Violation #{idx + 1}</span>
                      <span className="text-xs text-slate-400">{new Date(violation.date).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">
                      <span className="font-semibold">What was said:</span> "{violation.context}"
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <p><span className="font-semibold">Location:</span> {violation.location}</p>
                      <p><span className="font-semibold">Action:</span> {violation.actionTaken || "Red Card"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}