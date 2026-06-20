import React, { useEffect, useState, useCallback } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse, getTeachers } from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];

  // Form state
  const [formData, setFormData] = useState({
    courseName: "",
    description: "",
    grade: "S1",
    coefficient: 1,
    teacher: ""
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, teachersRes] = await Promise.all([
        getCourses(),
        getTeachers()
      ]);
      
      // Safely extract data
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      const teachersData = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      
      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load data");
      setCourses([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset form
  const resetForm = () => {
    setFormData({
      courseName: "",
      description: "",
      grade: "S1",
      coefficient: 1,
      teacher: ""
    });
    setEditingCourse(null);
    setError(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.courseName.trim()) {
      setError("Course name is required");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingCourse) {
        response = await updateCourse(editingCourse._id, formData);
        setSuccess("Course updated successfully!");
      } else {
        response = await createCourse(formData);
        setSuccess("Course added successfully!");
      }
      
      resetForm();
      setShowForm(false);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Save course error:", err);
      setError(err.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName || "",
      description: course.description || "",
      grade: course.grade || "S1",
      coefficient: course.coefficient || 1,
      teacher: course.teacher?._id || course.teacher || ""
    });
    setShowForm(true);
    setError(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    
    setLoading(true);
    try {
      await deleteCourse(id);
      setSuccess("Course deleted successfully!");
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete course error:", err);
      setError(err.response?.data?.message || "Failed to delete course");
    } finally {
      setLoading(false);
    }
  };

  // Get teacher name from ID or object
  const getTeacherName = (teacher) => {
    if (!teacher) return "Not Assigned";
    if (typeof teacher === 'object' && teacher !== null) {
      return teacher.name || "Not Assigned";
    }
    if (typeof teacher === 'string') {
      const found = teachers.find(t => t._id === teacher);
      return found?.name || "Not Assigned";
    }
    return "Not Assigned";
  };

  // Get teacher qualification
  const getTeacherQualification = (teacher) => {
    if (!teacher) return "";
    if (typeof teacher === 'object' && teacher !== null) {
      return teacher.qualification || "";
    }
    if (typeof teacher === 'string') {
      const found = teachers.find(t => t._id === teacher);
      return found?.qualification || "";
    }
    return "";
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    if (!course) return false;
    const matchesSearch = !searchTerm || 
      (course.courseName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (course.courseCode?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === "ALL" || course.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const totalCourses = courses.length;
  const subjectsByGrade = {};
  courses.forEach(c => {
    if (c.grade) {
      subjectsByGrade[c.grade] = (subjectsByGrade[c.grade] || 0) + 1;
    }
  });
  const teachersAssigned = new Set(courses.map(c => {
    if (c.teacher && typeof c.teacher === 'object') return c.teacher._id;
    return c.teacher;
  }).filter(Boolean)).size;

  // Export data
  const exportData = courses.map(course => ({
    courseCode: course.courseCode || "-",
    courseName: course.courseName || "-",
    grade: course.grade || "-",
    coefficient: course.coefficient || 1,
    teacher: getTeacherName(course.teacher),
    qualification: getTeacherQualification(course.teacher),
    description: course.description || "-"
  }));

  const exportColumns = [
    { key: "courseCode", label: "Course Code" },
    { key: "courseName", label: "Course Name" },
    { key: "grade", label: "Grade" },
    { key: "coefficient", label: "Coefficient" },
    { key: "teacher", label: "Assigned Teacher" },
    { key: "qualification", label: "Teacher Qualification" },
    { key: "description", label: "Description" }
  ];

  return (
    <div className="space-y-4">
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
          success ? "bg-emerald-500" : "bg-rose-500"
        } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
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
                📚 Courses & Subjects
              </h1>
              <p className="text-slate-300 text-sm">
                Manage academic courses, assign teachers, and set coefficients
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-white/20 hover:scale-105 text-sm"
            >
              <span className="text-xl">+</span>
              Add Course
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Total Courses</p>
              <p className="text-2xl font-bold text-white">{totalCourses}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Grades Covered</p>
              <p className="text-2xl font-bold text-emerald-400">{Object.keys(subjectsByGrade).length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Teachers Assigned</p>
              <p className="text-2xl font-bold text-purple-400">{teachersAssigned}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Avg Coefficient</p>
              <p className="text-2xl font-bold text-amber-400">
                {totalCourses > 0 ? (courses.reduce((sum, c) => sum + (c.coefficient || 1), 0) / totalCourses).toFixed(1) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="🔍 Search by course name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Export Section */}
      {courses.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Courses List</h3>
            <DownloadButton
              data={exportData}
              columns={exportColumns}
              title="Courses Report"
              filename={`courses_export_${new Date().toISOString().slice(0, 10)}`}
              variant="primary"
            />
          </div>
        </div>
      )}

      {/* Courses Table */}
      {loading && courses.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📚</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No courses found</h3>
          <p className="text-slate-500 text-sm">
            {searchTerm || filterGrade !== "ALL"
              ? "Try adjusting your filters"
              : 'Click "Add Course" to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Course Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Grade</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Coeff</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Teacher</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Qualification</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCourses.map((course) => {
                  const teacherName = getTeacherName(course.teacher);
                  const teacherQual = getTeacherQualification(course.teacher);
                  const isAssigned = teacherName !== "Not Assigned";
                  
                  return (
                    <tr key={course._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs font-bold text-indigo-600">
                        {course.courseCode || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-slate-800">{course.courseName || "-"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {course.grade || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="font-bold text-amber-600">{course.coefficient || 1}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isAssigned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isAssigned ? "✅" : "⭕"} {teacherName}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-xs">
                        {teacherQual || "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(course)}
                            className="p-1 rounded hover:bg-indigo-50 text-indigo-600 transition-all"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(course._id)}
                            className="p-1 rounded hover:bg-rose-50 text-rose-500 transition-all"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    page = currentPage - 2 + i;
                    if (page > totalPages) page = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded text-xs font-medium transition ${
                        currentPage === page
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold text-white">
                {editingCourse ? "Edit Course" : "Add New Course"}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({...formData, courseName: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                  placeholder="e.g., Mathematics, English, Physics"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Coefficient</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.coefficient}
                    onChange={(e) => setFormData({...formData, coefficient: parseFloat(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Teacher</label>
                <select
                  value={formData.teacher}
                  onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers
                    .filter(t => t.status === "ACTIVE")
                    .map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} {t.qualification ? `(${t.qualification})` : ""}
                      </option>
                    ))}
                </select>
                {formData.teacher && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✅ Teacher will be assigned to this course
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Course description, syllabus overview..."
                />
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : (editingCourse ? "Update" : "Create")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}