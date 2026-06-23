import React, { useEffect, useState } from "react";
import { 
  getStudentsByClass, 
  markStudentAttendance, 
  getStudentsByClassForAttendance,
  getStudentAttendanceReport,
  getTeachersForAttendance,
  markTeacherAttendance,
  getTeacherAttendanceByDate,
  getTeacherAttendanceReport
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Filter,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  School,
  ChevronLeft,
  ChevronRight,
  Eye,
  Printer,
  RefreshCw,
  Plus,
  Minus,
  Edit,
  Trash2,
  BarChart,
  PieChart,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  UserCog,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Star,
  Award
} from "lucide-react";

export default function Attendance() {
  const [attendanceType, setAttendanceType] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Student attendance states
  const [grades, setGrades] = useState(["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"]);
  const [classes, setClasses] = useState(["A", "B", "C", "D"]);
  const [selectedGrade, setSelectedGrade] = useState("S1");
  const [selectedClass, setSelectedClass] = useState("A");
  const [students, setStudents] = useState([]);
  const [studentAttendanceData, setStudentAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState("DAILY");
  
  // Teacher attendance states
  const [teachers, setTeachers] = useState([]);
  const [teacherAttendanceData, setTeacherAttendanceData] = useState({});
  
  // Report states
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState("STUDENT");
  const [reportStartDate, setReportStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportGrade, setReportGrade] = useState("");
  const [reportClass, setReportClass] = useState("");

  const periods = ["DAILY", "MORNING", "AFTERNOON"];
  
  // Get user info from localStorage
  const userType = localStorage.getItem("userType") || "staff";
  const userRole = localStorage.getItem("userRole") || "staff";
  const userName = localStorage.getItem("userName") || "User";
  
  // Determine permissions
  const canAccessStudentAttendance = userRole === "superadmin" || userType === "school_admin" || userType === "admin" || userType === "teacher" || userType === "staff";
  const canAccessTeacherAttendance = userRole === "superadmin" || userType === "school_admin" || userType === "admin" || userType === "customer_care";

  // Fetch students by class
  const fetchStudentsByClass = async () => {
    if (!selectedGrade || !selectedClass) {
      setError("Please select a grade and class");
      return;
    }
    
    setLoading(true);
    setError("");
    setStudents([]);
    
    try {
      const res = await getStudentsByClassForAttendance(selectedGrade, selectedClass);
      const studentsData = res.data.students || [];
      setStudents(studentsData);
      
      const initialData = {};
      studentsData.forEach(s => {
        initialData[s._id] = { status: "PRESENT", reason: "" };
      });
      setStudentAttendanceData(initialData);
      
      try {
        const existingRes = await getStudentAttendanceByClass({
          grade: selectedGrade,
          className: selectedClass,
          date: selectedDate,
          period: selectedPeriod
        });
        
        if (existingRes.data.attendance) {
          const existingData = {};
          existingRes.data.attendance.forEach(a => {
            if (a.status !== "UNMARKED") {
              existingData[a.studentId] = { status: a.status, reason: a.reason || "" };
            }
          });
          setStudentAttendanceData(prev => ({ ...prev, ...existingData }));
        }
      } catch (existingErr) {
        console.log("No existing attendance found");
      }
      
      if (studentsData.length === 0) {
        setError(`No students found in ${selectedGrade} ${selectedClass}`);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError(error.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers for attendance
  const fetchTeachers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTeachersForAttendance();
      setTeachers(res.data.teachers || []);
      
      const initialData = {};
      (res.data.teachers || []).forEach(t => {
        initialData[t._id] = { status: "PRESENT", reason: "", checkInTime: "", checkOutTime: "" };
      });
      setTeacherAttendanceData(initialData);
      
      try {
        const existingRes = await getTeacherAttendanceByDate({
          date: selectedDate,
          period: selectedPeriod
        });
        
        if (existingRes.data.attendance) {
          const existingData = {};
          existingRes.data.attendance.forEach(a => {
            if (a.status !== "UNMARKED") {
              existingData[a.teacherId] = { 
                status: a.status, 
                reason: a.reason || "",
                checkInTime: a.checkInTime || "",
                checkOutTime: a.checkOutTime || ""
              };
            }
          });
          setTeacherAttendanceData(prev => ({ ...prev, ...existingData }));
        }
      } catch (existingErr) {
        console.log("No existing teacher attendance found");
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attendanceType === "STUDENT" && canAccessStudentAttendance) {
      if (selectedGrade && selectedClass) {
        fetchStudentsByClass();
      }
    } else if (attendanceType === "TEACHER" && canAccessTeacherAttendance) {
      fetchTeachers();
    }
  }, [attendanceType, selectedGrade, selectedClass, selectedDate, selectedPeriod]);

  const handleStudentAttendanceChange = (studentId, field, value) => {
    setStudentAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };

  const handleTeacherAttendanceChange = (teacherId, field, value) => {
    setTeacherAttendanceData(prev => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], [field]: value }
    }));
  };

  const handleSubmitStudentAttendance = async () => {
    if (students.length === 0) {
      setError("No students to mark attendance for");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const records = Object.entries(studentAttendanceData).map(([studentId, data]) => {
        const student = students.find(s => s._id === studentId);
        return {
          studentId,
          name: student?.name || "Unknown",
          status: data.status,
          reason: data.reason || ""
        };
      });
      
      await markStudentAttendance({
        grade: selectedGrade,
        className: selectedClass,
        date: selectedDate,
        period: selectedPeriod,
        records
      });
      
      setSuccess(`✅ Attendance recorded for ${records.length} students in ${selectedGrade} ${selectedClass}!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving attendance:", error);
      setError(error.response?.data?.message || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTeacherAttendance = async () => {
    if (teachers.length === 0) {
      setError("No teachers to mark attendance for");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const records = Object.entries(teacherAttendanceData).map(([teacherId, data]) => {
        const teacher = teachers.find(t => t._id === teacherId);
        return {
          teacherId,
          name: teacher?.name || "Unknown",
          status: data.status,
          reason: data.reason || "",
          checkInTime: data.checkInTime || "",
          checkOutTime: data.checkOutTime || ""
        };
      });
      
      await markTeacherAttendance({
        date: selectedDate,
        period: selectedPeriod,
        records
      });
      
      setSuccess(`✅ Attendance recorded for ${records.length} teachers!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving teacher attendance:", error);
      setError(error.response?.data?.message || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (reportType === "STUDENT") {
        res = await getStudentAttendanceReport({
          grade: reportGrade || undefined,
          className: reportClass || undefined,
          startDate: reportStartDate,
          endDate: reportEndDate,
          period: selectedPeriod
        });
      } else {
        res = await getTeacherAttendanceReport({
          startDate: reportStartDate,
          endDate: reportEndDate,
          period: selectedPeriod
        });
      }
      setReportData(res.data);
      setShowReport(true);
    } catch (error) {
      console.error("Error fetching report:", error);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { 
      "PRESENT": "bg-emerald-100 text-emerald-700", 
      "ABSENT": "bg-rose-100 text-rose-700", 
      "LATE": "bg-amber-100 text-amber-700",
      "UNMARKED": "bg-slate-100 text-slate-500"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "PRESENT": return <CheckCircle className="w-3 h-3" />;
      case "ABSENT": return <XCircle className="w-3 h-3" />;
      case "LATE": return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      "PRESENT": "Present",
      "ABSENT": "Absent", 
      "LATE": "Late",
      "UNMARKED": "Unmarked"
    };
    return labels[status] || status;
  };

  const getExportData = () => {
    if (attendanceType === "STUDENT") {
      return students.map(student => ({
        name: student.name,
        id: student.studentId,
        grade: selectedGrade,
        className: selectedClass,
        status: studentAttendanceData[student._id]?.status || "UNMARKED",
        reason: studentAttendanceData[student._id]?.reason || "",
        date: selectedDate,
        period: selectedPeriod,
        type: "Student"
      }));
    } else {
      return teachers.map(teacher => ({
        name: teacher.name,
        id: teacher.teacherId,
        email: teacher.email,
        status: teacherAttendanceData[teacher._id]?.status || "UNMARKED",
        reason: teacherAttendanceData[teacher._id]?.reason || "",
        checkInTime: teacherAttendanceData[teacher._id]?.checkInTime || "",
        checkOutTime: teacherAttendanceData[teacher._id]?.checkOutTime || "",
        date: selectedDate,
        period: selectedPeriod,
        type: "Teacher"
      }));
    }
  };

  const exportColumns = attendanceType === "STUDENT" 
    ? [
        { key: "name", label: "Student Name" },
        { key: "id", label: "Student ID" },
        { key: "grade", label: "Grade" },
        { key: "className", label: "Class" },
        { key: "status", label: "Status" },
        { key: "reason", label: "Reason" },
        { key: "date", label: "Date" },
        { key: "period", label: "Period" }
      ]
    : [
        { key: "name", label: "Teacher Name" },
        { key: "id", label: "Teacher ID" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status" },
        { key: "reason", label: "Reason" },
        { key: "checkInTime", label: "Check In" },
        { key: "checkOutTime", label: "Check Out" },
        { key: "date", label: "Date" },
        { key: "period", label: "Period" }
      ];

  // Mobile-first responsive design
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  if (!canAccessStudentAttendance && !canAccessTeacherAttendance) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">You don't have permission to view attendance.</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalStudents = students.length;
  const presentCount = Object.values(studentAttendanceData).filter(d => d.status === "PRESENT").length;
  const absentCount = Object.values(studentAttendanceData).filter(d => d.status === "ABSENT").length;
  const lateCount = Object.values(studentAttendanceData).filter(d => d.status === "LATE").length;
  const unmarkedCount = totalStudents - presentCount - absentCount - lateCount;

  return (
    <div className="space-y-4">
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-[90vw] md:max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✓" : "⚠"}</span>
          <p className="font-medium text-xs md:text-sm">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="relative px-4 py-5 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-white/10 backdrop-blur rounded-xl">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">✅ Attendance</h1>
                <p className="text-slate-300 text-xs md:text-sm">Track daily attendance for students and teachers</p>
              </div>
            </div>
            <button 
              onClick={fetchReport} 
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all flex items-center gap-1.5 md:gap-2 font-semibold border border-white/20 text-xs md:text-sm"
            >
              <BarChart className="w-4 h-4" />
              <span className="hidden xs:inline">View Report</span>
              <span className="xs:hidden">Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Type Selector - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 overflow-x-auto">
        <div className="flex gap-1.5 md:gap-2 min-w-max">
          {canAccessStudentAttendance && (
            <button
              onClick={() => setAttendanceType("STUDENT")}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap ${
                attendanceType === "STUDENT"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3 h-3 md:w-4 md:h-4" />
                Students
              </span>
            </button>
          )}
          {canAccessTeacherAttendance && (
            <button
              onClick={() => setAttendanceType("TEACHER")}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap ${
                attendanceType === "TEACHER"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
                Teachers
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Student Attendance Controls - Mobile Optimized */}
      {attendanceType === "STUDENT" && canAccessStudentAttendance && (
        <>
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" 
              />
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button 
              onClick={fetchStudentsByClass}
              disabled={loading}
              className="mt-3 w-full bg-indigo-100 text-indigo-700 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Loading..." : "Load Students"}
            </button>
            {error && (
              <p className="mt-2 text-rose-600 text-xs text-center">{error}</p>
            )}
          </div>

          {/* Summary Stats - Compact */}
          {students.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 md:gap-3">
              <div className="bg-emerald-50 rounded-lg p-1.5 md:p-3 text-center">
                <p className="text-xs md:text-sm font-bold text-emerald-600">{presentCount}</p>
                <p className="text-[8px] md:text-xs text-slate-500">Present</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-1.5 md:p-3 text-center">
                <p className="text-xs md:text-sm font-bold text-amber-600">{lateCount}</p>
                <p className="text-[8px] md:text-xs text-slate-500">Late</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-1.5 md:p-3 text-center">
                <p className="text-xs md:text-sm font-bold text-rose-600">{absentCount}</p>
                <p className="text-[8px] md:text-xs text-slate-500">Absent</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-1.5 md:p-3 text-center">
                <p className="text-xs md:text-sm font-bold text-slate-600">{unmarkedCount}</p>
                <p className="text-[8px] md:text-xs text-slate-500">Unmarked</p>
              </div>
            </div>
          )}

          {/* Export Section - Mobile Optimized */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-3 md:p-4">
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Download className="w-3 h-3 md:w-4 md:h-4 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800 text-xs md:text-sm">Export</h3>
                </div>
                <DownloadButton 
                  data={getExportData()} 
                  columns={exportColumns} 
                  title={`${selectedGrade} ${selectedClass} Attendance Report`} 
                  filename={`attendance_${selectedGrade}_${selectedClass}_${selectedDate}`} 
                  variant="primary" 
                />
              </div>
            </div>
          )}

          {/* Student Attendance Table - Mobile Optimized */}
          {loading ? (
            <div className="flex justify-center py-8 md:py-12">
              <div className="w-8 h-8 md:w-12 md:h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-center">
              <div className="text-4xl md:text-6xl mb-2 md:mb-3">👨‍🎓</div>
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">No students found</h3>
              <p className="text-xs md:text-sm text-slate-500">
                {selectedGrade && selectedClass 
                  ? `No students in ${selectedGrade} ${selectedClass}`
                  : "Please select a grade and class"}
              </p>
              <button 
                onClick={fetchStudentsByClass}
                className="mt-3 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-700 transition"
              >
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 inline mr-1" /> Try Again
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Mobile Card View - Visible on small screens */}
              <div className="block md:hidden">
                {students.map((student) => (
                  <div key={student._id} className="p-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                          {student.name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{student.name}</p>
                          <p className="text-[10px] text-slate-400">{student.studentId}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(studentAttendanceData[student._id]?.status)}`}>
                        {getStatusIcon(studentAttendanceData[student._id]?.status)} {getStatusLabel(studentAttendanceData[student._id]?.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <button 
                        onClick={() => handleStudentAttendanceChange(student._id, "status", "PRESENT")} 
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${studentAttendanceData[student._id]?.status === "PRESENT" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"}`}
                      >
                        ✅ Present
                      </button>
                      <button 
                        onClick={() => handleStudentAttendanceChange(student._id, "status", "LATE")} 
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${studentAttendanceData[student._id]?.status === "LATE" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-amber-100"}`}
                      >
                        ⏰ Late
                      </button>
                      <button 
                        onClick={() => handleStudentAttendanceChange(student._id, "status", "ABSENT")} 
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${studentAttendanceData[student._id]?.status === "ABSENT" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-100"}`}
                      >
                        ❌ Absent
                      </button>
                    </div>
                    <div className="mt-2">
                      <input 
                        type="text" 
                        placeholder="Reason if absent/late"
                        value={studentAttendanceData[student._id]?.reason || ""}
                        onChange={(e) => handleStudentAttendanceChange(student._id, "reason", e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-[10px] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Reason</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-xs text-indigo-600">{student.studentId}</td>
                        <td className="px-3 py-2 font-medium text-slate-800 text-sm">{student.name}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(studentAttendanceData[student._id]?.status)}`}>
                            {getStatusIcon(studentAttendanceData[student._id]?.status)} {getStatusLabel(studentAttendanceData[student._id]?.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="text" 
                            placeholder="Reason..."
                            value={studentAttendanceData[student._id]?.reason || ""}
                            onChange={(e) => handleStudentAttendanceChange(student._id, "reason", e.target.value)}
                            className="w-32 border border-slate-200 rounded px-2 py-1 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 flex-wrap">
                            <button 
                              onClick={() => handleStudentAttendanceChange(student._id, "status", "PRESENT")} 
                              className={`px-2 py-1 rounded text-xs font-medium transition ${studentAttendanceData[student._id]?.status === "PRESENT" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"}`}
                            >
                              Present
                            </button>
                            <button 
                              onClick={() => handleStudentAttendanceChange(student._id, "status", "LATE")} 
                              className={`px-2 py-1 rounded text-xs font-medium transition ${studentAttendanceData[student._id]?.status === "LATE" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-amber-100"}`}
                            >
                              Late
                            </button>
                            <button 
                              onClick={() => handleStudentAttendanceChange(student._id, "status", "ABSENT")} 
                              className={`px-2 py-1 rounded text-xs font-medium transition ${studentAttendanceData[student._id]?.status === "ABSENT" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-100"}`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-3 md:px-4 py-2 md:py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-2">
                <span className="text-[10px] md:text-xs text-slate-500">Total: {students.length} students</span>
                <button 
                  onClick={handleSubmitStudentAttendance} 
                  disabled={loading} 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-xs md:text-sm disabled:opacity-50 flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-center"
                >
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                  {loading ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Teacher Attendance - Mobile Optimized */}
      {attendanceType === "TEACHER" && canAccessTeacherAttendance && (
        <>
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-4">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" 
              />
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button 
              onClick={fetchTeachers}
              disabled={loading}
              className="mt-3 w-full bg-indigo-100 text-indigo-700 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Loading..." : "Load Teachers"}
            </button>
          </div>

          {/* Teacher Attendance Table - Mobile Optimized */}
          {loading ? (
            <div className="flex justify-center py-8 md:py-12">
              <div className="w-8 h-8 md:w-12 md:h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
            </div>
          ) : teachers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-center">
              <div className="text-4xl md:text-6xl mb-2 md:mb-3">👨‍🏫</div>
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">No teachers found</h3>
              <p className="text-xs md:text-sm text-slate-500">No active teachers in the system</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Mobile Card View */}
              <div className="block md:hidden">
                {teachers.map((teacher) => (
                  <div key={teacher._id} className="p-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center text-xs font-bold text-purple-600">
                          {teacher.name?.charAt(0) || "T"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{teacher.name}</p>
                          <p className="text-[10px] text-slate-400">{teacher.teacherId}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(teacherAttendanceData[teacher._id]?.status)}`}>
                        {getStatusIcon(teacherAttendanceData[teacher._id]?.status)} {getStatusLabel(teacherAttendanceData[teacher._id]?.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <button 
                        onClick={() => handleTeacherAttendanceChange(teacher._id, "status", "PRESENT")} 
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${teacherAttendanceData[teacher._id]?.status === "PRESENT" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"}`}
                      >
                        ✅ Present
                      </button>
                      <button 
                        onClick={() => handleTeacherAttendanceChange(teacher._id, "status", "LATE")} 
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${teacherAttendanceData[teacher._id]?.status === "LATE" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-amber-100"}`}
                      >
                        ⏰ Late
                      </button>
                      <button 
                        onClick={() => handleTeacherAttendanceChange(teacher._id, "status", "ABSENT")} 
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${teacherAttendanceData[teacher._id]?.status === "ABSENT" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-100"}`}
                      >
                        ❌ Absent
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      <input 
                        type="time" 
                        placeholder="In"
                        value={teacherAttendanceData[teacher._id]?.checkInTime || ""}
                        onChange={(e) => handleTeacherAttendanceChange(teacher._id, "checkInTime", e.target.value)}
                        className="border border-slate-200 rounded px-1 py-0.5 text-[10px] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                      <input 
                        type="time" 
                        placeholder="Out"
                        value={teacherAttendanceData[teacher._id]?.checkOutTime || ""}
                        onChange={(e) => handleTeacherAttendanceChange(teacher._id, "checkOutTime", e.target.value)}
                        className="border border-slate-200 rounded px-1 py-0.5 text-[10px] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                    <div className="mt-2">
                      <input 
                        type="text" 
                        placeholder="Reason"
                        value={teacherAttendanceData[teacher._id]?.reason || ""}
                        onChange={(e) => handleTeacherAttendanceChange(teacher._id, "reason", e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-[10px] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Reason</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Check In/Out</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((teacher) => (
                      <tr key={teacher._id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-xs text-indigo-600">{teacher.teacherId}</td>
                        <td className="px-3 py-2 font-medium text-slate-800 text-sm">{teacher.name}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs">{teacher.email}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teacherAttendanceData[teacher._id]?.status)}`}>
                            {getStatusIcon(teacherAttendanceData[teacher._id]?.status)} {getStatusLabel(teacherAttendanceData[teacher._id]?.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="text" 
                            placeholder="Reason"
                            value={teacherAttendanceData[teacher._id]?.reason || ""}
                            onChange={(e) => handleTeacherAttendanceChange(teacher._id, "reason", e.target.value)}
                            className="w-24 border border-slate-200 rounded px-2 py-1 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <input 
                              type="time" 
                              placeholder="In"
                              value={teacherAttendanceData[teacher._id]?.checkInTime || ""}
                              onChange={(e) => handleTeacherAttendanceChange(teacher._id, "checkInTime", e.target.value)}
                              className="w-16 border border-slate-200 rounded px-1 py-1 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                            <input 
                              type="time" 
                              placeholder="Out"
                              value={teacherAttendanceData[teacher._id]?.checkOutTime || ""}
                              onChange={(e) => handleTeacherAttendanceChange(teacher._id, "checkOutTime", e.target.value)}
                              className="w-16 border border-slate-200 rounded px-1 py-1 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 flex-wrap">
                            <button 
                              onClick={() => handleTeacherAttendanceChange(teacher._id, "status", "PRESENT")} 
                              className={`px-2 py-1 rounded text-xs font-medium transition ${teacherAttendanceData[teacher._id]?.status === "PRESENT" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"}`}
                            >
                              Present
                            </button>
                            <button 
                              onClick={() => handleTeacherAttendanceChange(teacher._id, "status", "LATE")} 
                              className={`px-2 py-1 rounded text-xs font-medium transition ${teacherAttendanceData[teacher._id]?.status === "LATE" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-amber-100"}`}
                            >
                              Late
                            </button>
                            <button 
                              onClick={() => handleTeacherAttendanceChange(teacher._id, "status", "ABSENT")} 
                              className={`px-2 py-1 rounded text-xs font-medium transition ${teacherAttendanceData[teacher._id]?.status === "ABSENT" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-100"}`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-3 md:px-4 py-2 md:py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button 
                  onClick={handleSubmitTeacherAttendance} 
                  disabled={loading} 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-xs md:text-sm disabled:opacity-50 flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-center"
                >
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                  {loading ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 overflow-y-auto" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-4 md:my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 md:px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-sm md:text-base font-bold">📊 Attendance Report</h2>
              <button onClick={() => setShowReport(false)} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <div className="p-4 md:p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs md:text-sm"><strong>Report Period:</strong> {reportData.summary?.reportPeriod?.startDate} to {reportData.summary?.reportPeriod?.endDate}</p>
                <p className="text-xs md:text-sm"><strong>Overall Attendance:</strong> {reportData.summary?.overallAttendance}%</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-blue-600">Total Days</p>
                  <p className="text-lg md:text-xl font-bold text-blue-700">{reportData.summary?.totalDays || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-emerald-600">Present</p>
                  <p className="text-lg md:text-xl font-bold text-emerald-700">{Object.values(reportData.dailyBreakdown || {}).reduce((sum, d) => sum + d.present, 0) || 0}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-amber-600">Late</p>
                  <p className="text-lg md:text-xl font-bold text-amber-700">{Object.values(reportData.dailyBreakdown || {}).reduce((sum, d) => sum + d.late, 0) || 0}</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-rose-600">Absent</p>
                  <p className="text-lg md:text-xl font-bold text-rose-700">{Object.values(reportData.dailyBreakdown || {}).reduce((sum, d) => sum + d.absent, 0) || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-700 mb-2">Daily Breakdown</p>
                <div className="space-y-1.5 md:space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(reportData.dailyBreakdown || {}).map(([date, data]) => (
                    <div key={date} className="flex flex-wrap justify-between items-center p-1.5 md:p-2 bg-slate-50 rounded-lg text-xs md:text-sm">
                      <span className="font-medium text-slate-700">{date}</span>
                      <div className="flex gap-2 md:gap-3 text-[10px] md:text-xs">
                        <span className="text-emerald-600">✅ {data.present}</span>
                        <span className="text-amber-600">⏰ {data.late}</span>
                        <span className="text-rose-600">❌ {data.absent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        
        /* Custom breakpoint for extra small screens */
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