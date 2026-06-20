import React, { useEffect, useState, useCallback } from "react";
import { 
  getMarks, 
  getClassMarks,
  getClassStudents,
  bulkUpsertClassMarks,
  getMarksAnalytics, 
  getStudents, 
  getCourses,
  deleteMark,
  getStudentMarks
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

// --- Error Boundary ---
class MarksErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Marks Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-rose-800">Something went wrong</h3>
          <p className="text-rose-600 text-sm mt-1">
            {this.state.error?.message || "Failed to load marks. Please refresh the page."}
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
function MarksComponent() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classMarksData, setClassMarksData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState("TERM1");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [marksData, setMarksData] = useState({});
  const [showStudentMarks, setShowStudentMarks] = useState(null);
  const [saveCount, setSaveCount] = useState(0);

  const terms = ["TERM1", "TERM2", "TERM3"];
  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D"];

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch courses
      const coursesRes = await getCourses();
      let coursesData = [];
      
      if (Array.isArray(coursesRes.data)) {
        coursesData = coursesRes.data;
      } else if (coursesRes.data && Array.isArray(coursesRes.data.courses)) {
        coursesData = coursesRes.data.courses;
      }
      
      setCourses(coursesData);
      
      // If no grade, class, or course selected, stop here
      if (!selectedGrade || !selectedClass || !selectedCourse) {
        setStudents([]);
        setClassMarksData(null);
        setMarksData({});
        setLoading(false);
        return;
      }
      
      // Fetch class marks
      const marksRes = await getClassMarks({
        grade: selectedGrade,
        className: selectedClass,
        courseId: selectedCourse,
        term: selectedTerm,
        year: selectedYear
      });
      
      console.log("Class marks response:", marksRes.data);
      
      const data = marksRes.data;
      setClassMarksData(data);
      
      // Make sure students array exists
      const studentsList = data?.students || [];
      setStudents(studentsList);
      
      // Initialize marks data from fetched marks - using studentId as key
      const initialMarks = {};
      studentsList.forEach(student => {
        initialMarks[student.studentId] = {
          continuousAssessment: student.continuousAssessment !== undefined ? student.continuousAssessment : "",
          examScore: student.examScore !== undefined ? student.examScore : "",
          markId: student.markId || null
        };
      });
      setMarksData(initialMarks);
      
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load data");
      setStudents([]);
      setClassMarksData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm, selectedYear, selectedCourse, selectedGrade, selectedClass]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        term: selectedTerm,
        year: selectedYear
      };
      if (selectedGrade) params.grade = selectedGrade;
      if (selectedClass) params.className = selectedClass;
      
      const res = await getMarksAnalytics(params);
      setAnalytics(res.data);
      setShowAnalytics(true);
    } catch (err) {
      console.error("Fetch analytics error:", err);
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  // Handle mark change
  const handleMarkChange = (studentId, field, value) => {
    const numValue = value === "" ? "" : parseFloat(value);
    setMarksData(prev => ({
      ...prev,
      [studentId]: { 
        ...prev[studentId], 
        [field]: numValue,
        markId: prev[studentId]?.markId || null
      }
    }));
  };

  // Calculate total score for a student
  const getTotalScore = (studentId) => {
    const data = marksData[studentId] || {};
    const ca = parseFloat(data.continuousAssessment) || 0;
    const exam = parseFloat(data.examScore) || 0;
    return ca + exam;
  };

  // Get grade based on total score
  const getGrade = (total) => {
    if (total >= 80) return { letter: "A", color: "text-emerald-600", bg: "bg-emerald-100 text-emerald-700" };
    if (total >= 70) return { letter: "B", color: "text-blue-600", bg: "bg-blue-100 text-blue-700" };
    if (total >= 60) return { letter: "C", color: "text-amber-600", bg: "bg-amber-100 text-amber-700" };
    if (total >= 50) return { letter: "D", color: "text-orange-600", bg: "bg-orange-100 text-orange-700" };
    return { letter: "F", color: "text-rose-600", bg: "bg-rose-100 text-rose-700" };
  };

  // Handle save marks
  const handleSubmit = async () => {
    if (!selectedCourse || !selectedGrade || !selectedClass) {
      setError("Please select a course, grade, and class");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare marks data - ensure we're sending studentId correctly
      const marksToSubmit = students.map(student => {
        const mark = marksData[student.studentId] || {};
        return {
          studentId: student.studentId, // This is the display ID (STD-0001)
          continuousAssessment: parseFloat(mark.continuousAssessment) || 0,
          examScore: parseFloat(mark.examScore) || 0
        };
      });
      
      console.log("Submitting marks:", marksToSubmit);
      
      const response = await bulkUpsertClassMarks({ 
        marks: marksToSubmit, 
        term: selectedTerm, 
        year: selectedYear,
        grade: selectedGrade,
        className: selectedClass,
        courseId: selectedCourse
      });
      
      const count = response.data?.count || response.data?.results?.length || 0;
      setSaveCount(count);
      setSuccess(`Marks saved successfully! (${count} records)`);
      
      // Refresh data after save
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Save marks error:", err);
      setError(err.response?.data?.message || "Failed to save marks");
    } finally {
      setLoading(false);
    }
  };

  // View student marks
  const viewStudentMarks = async (studentId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Viewing marks for student:", studentId);
      const res = await getStudentMarks(studentId, { term: selectedTerm, year: selectedYear });
      console.log("Student marks response:", res.data);
      setShowStudentMarks(res.data);
    } catch (err) {
      console.error("View student marks error:", err);
      setError("Failed to load student marks");
    } finally {
      setLoading(false);
    }
  };

  // Get course info
  const selectedCourseObj = courses.find(c => c._id === selectedCourse);

  // Export data
  const exportData = students.map(student => {
    const total = getTotalScore(student.studentId);
    const grade = getGrade(total);
    return {
      studentId: student.studentId || "-",
      studentName: student.studentName || "-",
      continuousAssessment: marksData[student.studentId]?.continuousAssessment || 0,
      examScore: marksData[student.studentId]?.examScore || 0,
      totalScore: total,
      grade: grade.letter
    };
  });

  const exportColumns = [
    { key: "studentId", label: "Student ID" },
    { key: "studentName", label: "Student Name" },
    { key: "continuousAssessment", label: "CA (40%)" },
    { key: "examScore", label: "Exam (60%)" },
    { key: "totalScore", label: "Total (100%)" },
    { key: "grade", label: "Grade" }
  ];

  // Summary stats
  const totalStudents = students.length;
  const totalWithMarks = students.filter(s => {
    const data = marksData[s.studentId] || {};
    return (data.continuousAssessment || data.examScore);
  }).length;
  const avgScore = classMarksData?.summary?.averageScore || 0;

  return (
    <div className="space-y-4">
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✓" : "⚠"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                📝 Marks & Grading
              </h1>
              <p className="text-slate-300 text-sm">
                Record student marks by class, track performance, and generate grade reports
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchAnalytics} 
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span>📊</span> View Analytics
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {selectedCourse && selectedGrade && selectedClass && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Students</p>
                <p className="text-2xl font-bold text-white">{totalStudents}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">With Marks</p>
                <p className="text-2xl font-bold text-emerald-400">{totalWithMarks}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Class Average</p>
                <p className="text-2xl font-bold text-blue-400">{avgScore}%</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Pass Rate</p>
                <p className="text-2xl font-bold text-emerald-400">{classMarksData?.summary?.passRate || 0}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)} 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            {terms.map(t => <option key={t} value={t}>{t.replace("TERM", "Term ")}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <select 
            value={selectedGrade} 
            onChange={(e) => setSelectedGrade(e.target.value)} 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="">Select Grade</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)} 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            disabled={!selectedGrade}
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)} 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            disabled={!selectedGrade || !selectedClass}
          >
            <option value="">Select Course</option>
            {Array.isArray(courses) && courses.length > 0 ? (
              courses.filter(c => c.grade === selectedGrade).map(c => (
                <option key={c._id} value={c._id}>
                  {c.courseName}
                </option>
              ))
            ) : (
              <option value="" disabled>No courses available</option>
            )}
          </select>
        </div>
        {(!selectedGrade || !selectedClass) && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            ℹ️ Please select a grade and class to start recording marks
          </div>
        )}
        {selectedGrade && selectedClass && (!selectedCourse) && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            ℹ️ Please select a course to start recording marks
          </div>
        )}
      </div>

      {/* Course Info Card */}
      {selectedCourse && selectedGrade && selectedClass && selectedCourseObj && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="text-xs text-slate-500">Class</span>
              <p className="font-bold text-indigo-700">{selectedGrade} {selectedClass}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Course</span>
              <p className="font-bold text-indigo-700">{selectedCourseObj.courseName}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Code</span>
              <p className="font-mono text-indigo-600 font-semibold">{selectedCourseObj.courseCode}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Coefficient</span>
              <p className="font-bold text-amber-600">{selectedCourseObj.coefficient}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Teacher</span>
              <p className="text-sm">{selectedCourseObj.teacher?.name || "Not Assigned"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      {selectedCourse && students.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Marks</h3>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title={`Marks Report - ${selectedGrade} ${selectedClass} - ${selectedCourseObj?.courseName}`} 
              filename={`marks_${selectedGrade}_${selectedClass}_${selectedCourse}_${selectedTerm}_${selectedYear}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Marks Entry Table */}
      {selectedGrade && selectedClass && selectedCourse && students.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">CA (40%)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Exam (60%)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Total (100%)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Grade</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const total = getTotalScore(student.studentId);
                  const grade = getGrade(total);
                  const hasMark = marksData[student.studentId]?.continuousAssessment !== "" || marksData[student.studentId]?.examScore !== "";
                  
                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-indigo-600">{student.studentId}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{student.studentName}</td>
                      <td className="px-3 py-2 text-center">
                        <input 
                          type="number" 
                          min="0" 
                          max="40" 
                          step="0.5"
                          value={marksData[student.studentId]?.continuousAssessment !== undefined ? marksData[student.studentId].continuousAssessment : ""} 
                          onChange={(e) => handleMarkChange(student.studentId, "continuousAssessment", e.target.value)} 
                          className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" 
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input 
                          type="number" 
                          min="0" 
                          max="60" 
                          step="0.5"
                          value={marksData[student.studentId]?.examScore !== undefined ? marksData[student.studentId].examScore : ""} 
                          onChange={(e) => handleMarkChange(student.studentId, "examScore", e.target.value)} 
                          className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" 
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-bold ${grade.color}`}>{total}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${grade.bg}`}>
                          {grade.letter}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {hasMark && (
                            <button
                              onClick={() => viewStudentMarks(student.studentId)}
                              className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                              title="View marks"
                            >
                              📋 View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs text-slate-500">
              {students.length} students • {students.filter(s => marksData[s.studentId]?.continuousAssessment || marksData[s.studentId]?.examScore).length} have marks
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50"
            >
              💾 {loading ? "Saving..." : "Save All Marks"}
            </button>
          </div>
        </div>
      ) : selectedGrade && selectedClass && selectedCourse && students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No students found</h3>
          <p className="text-slate-500 text-sm">No students enrolled in {selectedGrade} {selectedClass}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📚</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Select a Class and Course</h3>
          <p className="text-slate-500 text-sm">Choose a grade, class, and course from the dropdowns above to start recording marks</p>
        </div>
      )}

      {/* Student Marks Modal */}
      {showStudentMarks && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowStudentMarks(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📋 Student Marks</h2>
              <button onClick={() => setShowStudentMarks(null)} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-blue-600">Total Marks</p>
                  <p className="text-lg font-bold text-blue-700">{showStudentMarks?.totalMarks || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-emerald-600">Average</p>
                  <p className="text-lg font-bold text-emerald-700">{showStudentMarks?.average || 0}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-purple-600">Passing</p>
                  <p className="text-lg font-bold text-purple-700">
                    {Object.values(showStudentMarks?.gradeDistribution || {}).slice(0, 3).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-rose-600">Failing</p>
                  <p className="text-lg font-bold text-rose-700">{showStudentMarks?.gradeDistribution?.F || 0}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Course</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">CA</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">Exam</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">Total</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(showStudentMarks?.marks || []).map((mark) => {
                      const grade = getGrade(mark.totalScore);
                      return (
                        <tr key={mark._id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-800">{mark.course?.courseName}</td>
                          <td className="px-3 py-2 text-center">{mark.continuousAssessment}</td>
                          <td className="px-3 py-2 text-center">{mark.examScore}</td>
                          <td className="px-3 py-2 text-center font-bold">{mark.totalScore}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${grade.bg}`}>
                              {grade.letter}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAnalytics(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📊 Performance Analytics</h2>
              <button onClick={() => setShowAnalytics(false)} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Students</p>
                  <p className="text-xl font-bold text-blue-700">{analytics?.totalStudents || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Avg Score</p>
                  <p className="text-xl font-bold text-emerald-700">{analytics?.averageScore || 0}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">Pass Rate</p>
                  <p className="text-xl font-bold text-purple-700">{analytics?.passRate || 0}%</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Total Marks</p>
                  <p className="text-xl font-bold text-amber-700">{analytics?.totalMarks || 0}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Grade Distribution</p>
                <div className="space-y-2">
                  {Object.entries(analytics?.gradeDistribution || {}).map(([grade, count]) => {
                    const total = analytics?.totalMarks || 1;
                    const percentage = ((count / total) * 100).toFixed(1);
                    const colors = {
                      A: "bg-emerald-500",
                      B: "bg-blue-500", 
                      C: "bg-amber-500",
                      D: "bg-orange-500",
                      F: "bg-rose-500"
                    };
                    return (
                      <div key={grade} className="flex items-center gap-2">
                        <div className="w-8 text-sm font-bold text-slate-600">{grade}</div>
                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[grade] || "bg-slate-500"} rounded-full transition-all`} 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                        <div className="w-16 text-sm text-slate-500">{count} ({percentage}%)</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Course Performance</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(analytics?.coursePerformance || []).map((course, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">{course?.course}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-indigo-600 font-bold">{course?.average || 0}%</span>
                        <span className="text-slate-500">{course?.studentsCount || 0} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Wrapped Export with Error Boundary ---
export default function Marks() {
  return (
    <MarksErrorBoundary>
      <MarksComponent />
    </MarksErrorBoundary>
  );
}