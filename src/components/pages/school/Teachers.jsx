import React, { useEffect, useState, useCallback } from "react";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    qualification: "",
    specialization: "",
    hireDate: new Date().toISOString().split('T')[0],
    status: "ACTIVE"
  });

  // Fetch teachers
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTeachers();
      // Ensure we have an array
      const teachersData = Array.isArray(response.data) ? response.data : [];
      setTeachers(teachersData);
    } catch (err) {
      console.error("Fetch teachers error:", err);
      setError(err.response?.data?.message || "Failed to load teachers");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      qualification: "",
      specialization: "",
      hireDate: new Date().toISOString().split('T')[0],
      status: "ACTIVE"
    });
    setEditingTeacher(null);
    setError(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and email are required");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingTeacher) {
        response = await updateTeacher(editingTeacher._id, formData);
        setSuccess("Teacher updated successfully!");
      } else {
        response = await createTeacher(formData);
        setSuccess("Teacher added successfully!");
      }
      
      resetForm();
      setShowForm(false);
      await fetchTeachers();
      
      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Save teacher error:", err);
      setError(err.response?.data?.message || "Failed to save teacher");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      address: teacher.address || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
      hireDate: teacher.hireDate ? new Date(teacher.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: teacher.status || "ACTIVE"
    });
    setShowForm(true);
    setError(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    
    setLoading(true);
    try {
      await deleteTeacher(id);
      setSuccess("Teacher deleted successfully!");
      await fetchTeachers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete teacher error:", err);
      setError(err.response?.data?.message || "Failed to delete teacher");
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    if (!teacher) return false;
    const matchesSearch = !searchTerm || 
      (teacher.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (teacher.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (teacher.teacherId?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status color helper
  const getStatusColor = (status) => {
    const colors = {
      "ACTIVE": "bg-emerald-100 text-emerald-700",
      "INACTIVE": "bg-slate-100 text-slate-700",
      "ON_LEAVE": "bg-amber-100 text-amber-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  // Export data
  const exportData = teachers.map(t => ({
    teacherId: t.teacherId || "-",
    name: t.name || "-",
    email: t.email || "-",
    phone: t.phone || "-",
    qualification: t.qualification || "-",
    specialization: t.specialization || "-",
    hireDate: t.hireDate ? new Date(t.hireDate).toLocaleDateString() : "-",
    status: t.status || "-"
  }));

  const exportColumns = [
    { key: "teacherId", label: "Teacher ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "qualification", label: "Qualification" },
    { key: "specialization", label: "Specialization" },
    { key: "hireDate", label: "Hire Date" },
    { key: "status", label: "Status" }
  ];

  // Stats
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === "ACTIVE").length;
  const onLeaveTeachers = teachers.filter(t => t.status === "ON_LEAVE").length;
  const inactiveTeachers = teachers.filter(t => t.status === "INACTIVE").length;

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
                👨‍🏫 Teachers Management
              </h1>
              <p className="text-slate-300 text-sm">
                Manage teaching staff, qualifications, and permissions
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-white/20 hover:scale-105 text-sm"
            >
              <span className="text-xl">+</span>
              Add Teacher
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Total Teachers</p>
              <p className="text-2xl font-bold text-white">{totalTeachers}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Active</p>
              <p className="text-2xl font-bold text-emerald-400">{activeTeachers}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">On Leave</p>
              <p className="text-2xl font-bold text-amber-400">{onLeaveTeachers}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Inactive</p>
              <p className="text-2xl font-bold text-slate-400">{inactiveTeachers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="🔍 Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      </div>

      {/* Export Section */}
      {teachers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Teachers List</h3>
            <DownloadButton
              data={exportData}
              columns={exportColumns}
              title="Teachers Report"
              filename={`teachers_export_${new Date().toISOString().slice(0, 10)}`}
              variant="primary"
            />
          </div>
        </div>
      )}

      {/* Teachers Table */}
      {loading && teachers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">👨‍🏫</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No teachers found</h3>
          <p className="text-slate-500 text-sm">
            {searchTerm || filterStatus !== "ALL" 
              ? "Try adjusting your filters" 
              : 'Click "Add Teacher" to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Qualification</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-indigo-600">
                      {teacher.teacherId || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-800">{teacher.name || "-"}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{teacher.email || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{teacher.qualification || "-"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teacher.status)}`}>
                        {teacher.status?.replace("_", " ") || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="p-1 rounded hover:bg-indigo-50 text-indigo-600 transition-all"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-500 transition-all"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTeachers.length)} of {filteredTeachers.length}
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
                {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="e.g., Bachelor's Degree"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
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
                  {loading ? "Saving..." : (editingTeacher ? "Update" : "Create")}
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