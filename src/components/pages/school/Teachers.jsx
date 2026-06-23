import React, { useEffect, useState, useCallback } from "react";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  User,
  Briefcase,
  Clock,
  Plus,
  X,
  Filter
} from "lucide-react";

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

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTeachers();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Save teacher error:", err);
      setError(err.response?.data?.message || "Failed to save teacher");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredTeachers = teachers.filter(teacher => {
    if (!teacher) return false;
    const matchesSearch = !searchTerm || 
      (teacher.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (teacher.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (teacher.teacherId?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      "ACTIVE": "bg-emerald-100 text-emerald-700",
      "INACTIVE": "bg-slate-100 text-slate-700",
      "ON_LEAVE": "bg-amber-100 text-amber-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "ACTIVE": return <CheckCircle className="w-3 h-3" />;
      case "INACTIVE": return <XCircle className="w-3 h-3" />;
      case "ON_LEAVE": return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      "ACTIVE": "Active",
      "INACTIVE": "Inactive",
      "ON_LEAVE": "On Leave"
    };
    return labels[status] || status;
  };

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

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === "ACTIVE").length;
  const onLeaveTeachers = teachers.filter(t => t.status === "ON_LEAVE").length;
  const inactiveTeachers = teachers.filter(t => t.status === "INACTIVE").length;

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
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✓" : "⚠"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    Teachers Management
                  </h1>
                  <p className="text-slate-300 text-sm">
                    Manage teaching staff, qualifications, and permissions
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="group bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-white/20 hover:scale-105 text-sm"
            >
              <UserPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Add Teacher
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">
                <Users className="w-3 h-3" /> Total
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">{totalTeachers}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Active
              </p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1">{activeTeachers}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> On Leave
              </p>
              <p className="text-2xl md:text-3xl font-bold text-amber-400 mt-1">{onLeaveTeachers}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Inactive
              </p>
              <p className="text-2xl md:text-3xl font-bold text-slate-400 mt-1">{inactiveTeachers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
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
        {(searchTerm || filterStatus !== "ALL") && (
          <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
            <button 
              onClick={() => { setSearchTerm(""); setFilterStatus("ALL"); }} 
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Export Section */}
      {teachers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Export Teachers List</h3>
                <p className="text-xs text-slate-400">Download in CSV, Excel, or PDF format</p>
              </div>
            </div>
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

      {/* Results Count */}
      {filteredTeachers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-3">
          <p className="text-xs text-slate-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTeachers.length)} of {filteredTeachers.length} teachers
          </p>
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
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Qualification</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-indigo-600">
                      {teacher.teacherId || "-"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center text-sm">
                          {teacher.name?.charAt(0) || "T"}
                        </div>
                        <span className="font-medium text-slate-800">{teacher.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-sm">{teacher.email || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        <span className="text-sm">{teacher.qualification || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teacher.status)}`}>
                        {getStatusIcon(teacher.status)} {getStatusLabel(teacher.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
                    <ChevronLeft className="w-3 h-3" /> Prev
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
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">
                  {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
                </h2>
              </div>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Enter teacher's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="teacher@school.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="e.g., Bachelor's Degree"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="e.g., Mathematics, English"
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Home address"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? "Saving..." : (editingTeacher ? "Update Teacher" : "Add Teacher")}
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
    </div>
  );
}