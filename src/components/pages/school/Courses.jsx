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

  const [formData, setFormData] = useState({
    courseName: "",
    description: "",
    grade: "S1",
    coefficient: 1,
    teacher: ""
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, teachersRes] = await Promise.all([
        getCourses(),
        getTeachers()
      ]);
      
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
        setSuccess("✅ Course updated successfully!");
      } else {
        response = await createCourse(formData);
        setSuccess("✅ Course added successfully!");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    
    setLoading(true);
    try {
      await deleteCourse(id);
      setSuccess("✅ Course deleted successfully!");
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete course error:", err);
      setError(err.response?.data?.message || "Failed to delete course");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredCourses = courses.filter(course => {
    if (!course) return false;
    const matchesSearch = !searchTerm || 
      (course.courseName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (course.courseCode?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === "ALL" || course.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
          success ? "bg-emerald-500" : "bg-rose-500"
        } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✅" : "⚠️"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">📚</div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    Courses & Subjects
                  </h1>
                  <p className="text-slate-300 text-sm">
                    Manage academic courses, assign teachers, and set coefficients
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-white/20 hover:scale-105 text-sm"
            >
              <span className="text-lg">➕</span>
              Add Course
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs flex items-center gap-1">📚 Total</p>
              <p className="text-2xl font-bold text-white mt-1">{totalCourses}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs flex items-center gap-1">🎯 Grades</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{Object.keys(subjectsByGrade).length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs flex items-center gap-1">👨‍🏫 Teachers</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{teachersAssigned}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs flex items-center gap-1">📊 Avg Coeff</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {totalCourses > 0 ? (courses.reduce((sum, c) => sum + (c.coefficient || 1), 0) / totalCourses).toFixed(1) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters - Clean Selects */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by course name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '12px'
            }}
          >
            <option value="ALL">📂 All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Export Section */}
      {courses.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📥</span>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Export Courses List</h3>
                <p className="text-xs text-slate-400">Download in CSV, Excel, or PDF</p>
              </div>
            </div>
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

      {/* Results Count */}
      {filteredCourses.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-3">
          <p className="text-xs text-slate-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} courses
          </p>
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
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Code</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Course Name</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Grade</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Coeff</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Teacher</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Qualification</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCourses.map((course) => {
                  const teacherName = getTeacherName(course.teacher);
                  const teacherQual = getTeacherQualification(course.teacher);
                  const isAssigned = teacherName !== "Not Assigned";
                  
                  return (
                    <tr key={course._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-indigo-600">
                        {course.courseCode || "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-slate-800">{course.courseName || "-"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          🏫 {course.grade || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-bold text-amber-600">{course.coefficient || 1}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isAssigned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isAssigned ? "✅" : "⭕"} {teacherName}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 text-xs">
                        {teacherQual || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(course)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(course._id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors text-sm"
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
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    ◀ Prev
                  </button>
                  {getPageNumbers().map((page, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => typeof page === 'number' && setCurrentPage(page)} 
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === page 
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md" 
                          : page === '...' 
                          ? "text-slate-400 cursor-default" 
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal - Fixed Selects */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <h2 className="text-lg font-bold text-white">
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </h2>
              </div>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({...formData, courseName: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="e.g., Mathematics, English, Physics"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '12px'
                    }}
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Teacher</label>
                <select
                  value={formData.teacher}
                  onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '12px'
                  }}
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
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Course description, syllabus overview..."
                />
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  💾 {loading ? "Saving..." : (editingCourse ? "Update Course" : "Create Course")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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