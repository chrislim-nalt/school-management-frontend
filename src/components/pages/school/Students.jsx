import React, { useEffect, useState } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent } from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  UserCheck,
  UserX,
  Bus,
  Calendar,
  MapPin,
  RefreshCw,
  School,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Eye
} from "lucide-react";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const classes = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  const [form, setForm] = useState({
    name: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    grade: "S1",
    className: "A",
    dateOfBirth: "",
    gender: "MALE",
    status: "ACTIVE",
    transportSubscribed: false,
    transportRoute: "",
    address: "",
    parentOccupation: "",
    parentAddress: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    emergencyRelationship: "",
    medicalInfo: "",
    allergies: "",
    bloodGroup: "",
    previousSchool: "",
    transportPickupPoint: "",
    transportDropoffPoint: ""
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      setStudents(res.data || []);
    } catch (error) {
      console.error("Fetch students error:", error);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.parentPhone?.includes(searchTerm);
    const matchesGrade = filterGrade === "ALL" || student.grade === filterGrade;
    const matchesClass = filterClass === "ALL" || student.className === filterClass;
    const matchesStatus = filterStatus === "ALL" || student.status === filterStatus;
    return matchesSearch && matchesGrade && matchesClass && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const resetForm = () => {
    setForm({
      name: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      grade: "S1",
      className: "A",
      dateOfBirth: "",
      gender: "MALE",
      status: "ACTIVE",
      transportSubscribed: false,
      transportRoute: "",
      address: "",
      parentOccupation: "",
      parentAddress: "",
      emergencyContact: "",
      emergencyContactPhone: "",
      emergencyRelationship: "",
      medicalInfo: "",
      allergies: "",
      bloodGroup: "",
      previousSchool: "",
      transportPickupPoint: "",
      transportDropoffPoint: ""
    });
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name) {
      setError("Student name is required");
      return;
    }
    
    if (!form.grade) {
      setError("Grade is required");
      return;
    }
    
    if (!form.className) {
      setError("Class name is required");
      return;
    }
    
    setLoading(true);
    try {
      const submitData = {
        name: form.name.trim(),
        grade: form.grade,
        className: form.className,
        parentName: form.parentName || "",
        parentPhone: form.parentPhone || "",
        parentEmail: form.parentEmail || "",
        address: form.address || "",
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        status: form.status,
        transportSubscribed: form.transportSubscribed,
        transportRoute: form.transportRoute || "",
        parentOccupation: form.parentOccupation || "",
        parentAddress: form.parentAddress || "",
        emergencyContact: form.emergencyContact || "",
        emergencyContactPhone: form.emergencyContactPhone || "",
        emergencyRelationship: form.emergencyRelationship || "",
        medicalInfo: form.medicalInfo || "",
        allergies: form.allergies || "",
        bloodGroup: form.bloodGroup || "",
        previousSchool: form.previousSchool || "",
        transportPickupPoint: form.transportPickupPoint || "",
        transportDropoffPoint: form.transportDropoffPoint || ""
      };
      
      if (editingId) {
        await updateStudent(editingId, submitData);
        setSuccess("Student updated successfully!");
      } else {
        await createStudent(submitData);
        setSuccess("Student added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchStudents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving student:", error.response?.data);
      setError(error.response?.data?.message || "Failed to save student");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setForm({
      name: student.name || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      parentEmail: student.parentEmail || "",
      grade: student.grade || "S1",
      className: student.className || "A",
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "",
      gender: student.gender || "MALE",
      status: student.status || "ACTIVE",
      transportSubscribed: student.transportSubscribed || false,
      transportRoute: student.transportRoute || "",
      address: student.address || "",
      parentOccupation: student.parentOccupation || "",
      parentAddress: student.parentAddress || "",
      emergencyContact: student.emergencyContact || "",
      emergencyContactPhone: student.emergencyContactPhone || "",
      emergencyRelationship: student.emergencyRelationship || "",
      medicalInfo: student.medicalInfo || "",
      allergies: student.allergies || "",
      bloodGroup: student.bloodGroup || "",
      previousSchool: student.previousSchool || "",
      transportPickupPoint: student.transportPickupPoint || "",
      transportDropoffPoint: student.transportDropoffPoint || ""
    });
    setEditingId(student._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setLoading(true);
      try {
        await deleteStudent(id);
        setSuccess("Student deleted successfully!");
        fetchStudents();
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Delete student error:", error);
        setError("Failed to delete student");
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "ACTIVE": "bg-emerald-100 text-emerald-700",
      "INACTIVE": "bg-slate-100 text-slate-700",
      "GRADUATED": "bg-blue-100 text-blue-700",
      "TRANSFERRED": "bg-amber-100 text-amber-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "ACTIVE": return <CheckCircle className="w-3 h-3" />;
      case "INACTIVE": return <UserX className="w-3 h-3" />;
      case "GRADUATED": return <GraduationCap className="w-3 h-3" />;
      case "TRANSFERRED": return <RefreshCw className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const exportData = students.map(student => ({
    studentId: student.studentId,
    name: student.name,
    grade: student.grade,
    class: student.className,
    parentName: student.parentName || "-",
    parentPhone: student.parentPhone || "-",
    gender: student.gender === "MALE" ? "Boy" : "Girl",
    status: student.status,
    transport: student.transportSubscribed ? "Yes" : "No",
    enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "-"
  }));

  const exportColumns = [
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "grade", label: "Grade" },
    { key: "class", label: "Class" },
    { key: "parentName", label: "Parent Name" },
    { key: "parentPhone", label: "Parent Phone" },
    { key: "gender", label: "Gender" },
    { key: "status", label: "Status" },
    { key: "transport", label: "Transport" },
    { key: "enrollmentDate", label: "Enrollment Date" }
  ];

  const totalStudents = students.length;
  const boys = students.filter(s => s.gender === "MALE").length;
  const girls = students.filter(s => s.gender === "FEMALE").length;
  const transportSubscribed = students.filter(s => s.transportSubscribed).length;
  const activeStudents = students.filter(s => s.status === "ACTIVE").length;

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
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    Students Management
                  </h1>
                  <p className="text-slate-300 text-sm">
                    Manage student profiles, enrollment, and transport subscriptions
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="group bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-white/20 hover:scale-105 shadow-lg text-sm"
            >
              <UserPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Add Student
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">
                <Users className="w-3 h-3" /> Total
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">{totalStudents}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Active
              </p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1">{activeStudents}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">👦 Boys</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-400 mt-1">{boys}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">👧 Girls</p>
              <p className="text-2xl md:text-3xl font-bold text-pink-400 mt-1">{girls}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">
                <Bus className="w-3 h-3" /> Transport
              </p>
              <p className="text-2xl md:text-3xl font-bold text-amber-400 mt-1">{transportSubscribed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, ID, or parent phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
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
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="GRADUATED">Graduated</option>
            <option value="TRANSFERRED">Transferred</option>
          </select>
        </div>
        {(searchTerm || filterGrade !== "ALL" || filterClass !== "ALL" || filterStatus !== "ALL") && (
          <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
            <button 
              onClick={() => { setSearchTerm(""); setFilterGrade("ALL"); setFilterClass("ALL"); setFilterStatus("ALL"); }} 
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Export Section */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Export Students List</h3>
                <p className="text-xs text-slate-400">Download in CSV, Excel, or PDF format</p>
              </div>
            </div>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Students Report" 
              filename={`students_export_${new Date().toISOString().slice(0, 10)}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Results Count */}
      {filteredStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-3">
          <p className="text-xs text-slate-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} students
          </p>
        </div>
      )}

      {/* Students Table */}
      {loading && students.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">👨‍🎓</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No students found</h3>
          <p className="text-slate-500 text-sm mb-4">Click "Add Student" to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Grade/Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Parent Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-indigo-600">{student.studentId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center text-sm">
                          {student.name?.charAt(0) || "S"}
                        </div>
                        <span className="font-medium text-slate-800 text-sm">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-sm">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                        <School className="w-3 h-3" /> {student.grade} {student.className}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-sm">
                      {student.parentPhone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {student.parentPhone}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-sm">
                      {student.gender === "MALE" ? "👦 Boy" : "👧 Girl"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {getStatusIcon(student.status)} {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleEdit(student)} 
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student._id)} 
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">{editingId ? "Edit Student" : "Add New Student"}</h2>
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
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Enter student's full name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade *</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({...form, grade: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  >
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm({...form, className: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  >
                    {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({...form, gender: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  >
                    <option value="MALE">👦 Boy</option>
                    <option value="FEMALE">👧 Girl</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({...form, dateOfBirth: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Name</label>
                <input
                  type="text"
                  value={form.parentName}
                  onChange={(e) => setForm({...form, parentName: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Parent or guardian name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Phone</label>
                  <input
                    type="tel"
                    value={form.parentPhone}
                    onChange={(e) => setForm({...form, parentPhone: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Email</label>
                  <input
                    type="email"
                    value={form.parentEmail}
                    onChange={(e) => setForm({...form, parentEmail: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Home address"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="transport"
                  checked={form.transportSubscribed}
                  onChange={(e) => setForm({...form, transportSubscribed: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="transport" className="text-sm text-slate-700 flex items-center gap-1">
                  <Bus className="w-4 h-4" /> Subscribe to School Transport
                </label>
              </div>

              {form.transportSubscribed && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transport Route</label>
                  <input
                    type="text"
                    value={form.transportRoute}
                    onChange={(e) => setForm({...form, transportRoute: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="e.g., Kigali - School"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({...form, status: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="TRANSFERRED">Transferred</option>
                </select>
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
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? "Saving..." : (editingId ? "Update Student" : "Create Student")}
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