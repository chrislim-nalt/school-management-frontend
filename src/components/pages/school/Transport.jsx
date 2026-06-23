import React, { useEffect, useState } from "react";
import { 
  getTransportPayments, 
  createTransportPayment, 
  updateTransportPayment, 
  getTransportRecords, 
  createTransportRecord, 
  getTransportFinancialSummary,
  getStudentsByClassForTransport,
  getOutstandingPayments,
  getTransportClasses,
  deleteTransportPayment,
  deleteTransportRecord
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function Transport() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [outstandingData, setOutstandingData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState("TERM1");
  const [activeTab, setActiveTab] = useState("payments");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [showOutstanding, setShowOutstanding] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // For student selection in modals
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const userType = localStorage.getItem("userType") || "staff";
  const userRole = localStorage.getItem("userRole") || "staff";
  const schoolId = localStorage.getItem("schoolId");
  
  const isBursar = userRole === "superadmin" || userType === "bursar" || userType === "school_admin" || userType === "admin";
  const isTeacher = userType === "teacher" || userType === "staff";
  const isAuthenticated = !!localStorage.getItem("token");

  const grades = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
  const semesters = [
    { value: "TERM1", label: "Term 1" },
    { value: "TERM2", label: "Term 2" },
    { value: "TERM3", label: "Term 3" }
  ];
  const paymentMethods = [
    { value: "CASH", label: "Cash", icon: "💵" },
    { value: "MOBILE_MONEY", label: "Mobile Money", icon: "📱" },
    { value: "BANK_TRANSFER", label: "Bank Transfer", icon: "🏦" },
    { value: "CHEQUE", label: "Cheque", icon: "📄" }
  ];

  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    studentName: "",
    studentGrade: "",
    studentClass: "",
    semester: "TERM1",
    year: new Date().getFullYear(),
    amount: "",
    amountPaid: "",
    paymentMethod: "CASH",
    reference: "",
    notes: ""
  });

  const [recordForm, setRecordForm] = useState({
    studentId: "",
    studentName: "",
    studentGrade: "",
    studentClass: "",
    date: new Date().toISOString().split('T')[0],
    pickupLocation: "",
    dropoffLocation: "",
    distance: "",
    status: "COMPLETED",
    notes: ""
  });

  const fetchSchoolClasses = async () => {
    try {
      const res = await getTransportClasses();
      setSchoolClasses(res.data.classes || []);
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  };

  const fetchStudentsByClass = async () => {
    if (selectedGrade === "ALL" || selectedClass === "ALL") {
      setFilteredStudents([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await getStudentsByClassForTransport(selectedGrade, selectedClass);
      setFilteredStudents(res.data.students || []);
    } catch (error) {
      console.error("Failed to load students:", error);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSchoolClasses();
    }
  }, []);

  useEffect(() => {
    if (selectedGrade !== "ALL" && selectedClass !== "ALL") {
      fetchStudentsByClass();
    } else {
      setFilteredStudents([]);
    }
  }, [selectedGrade, selectedClass]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError("");
    try {
      const [paymentsRes, recordsRes, summaryRes] = await Promise.all([
        getTransportPayments({ 
          year: selectedYear, 
          semester: selectedSemester,
          grade: filterGrade !== "ALL" ? filterGrade : undefined,
          className: filterClass !== "ALL" ? filterClass : undefined
        }).catch(() => ({ data: { payments: [] } })),
        getTransportRecords({ 
          startDate: `${selectedYear}-01-01`, 
          endDate: `${selectedYear}-12-31`,
          grade: filterGrade !== "ALL" ? filterGrade : undefined,
          className: filterClass !== "ALL" ? filterClass : undefined
        }).catch(() => ({ data: { records: [] } })),
        getTransportFinancialSummary(selectedYear, selectedSemester).catch(() => ({ data: {} }))
      ]);
      
      setPayments(paymentsRes.data?.payments || []);
      setRecords(recordsRes.data?.records || []);
      setSummary(summaryRes.data?.summary || summaryRes.data || {});
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const res = await getOutstandingPayments();
      setOutstandingData(res.data);
      setShowOutstanding(true);
    } catch (error) {
      console.error("Failed to load outstanding:", error);
      setError("Failed to load outstanding payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [selectedYear, selectedSemester, filterGrade, filterClass]);

  const handleSelectStudentForPayment = (student) => {
    setPaymentForm({
      ...paymentForm,
      studentId: student._id,
      studentName: student.name,
      studentGrade: student.grade,
      studentClass: student.className,
    });
    setSearchTerm("");
  };

  const handleSelectStudentForRecord = (student) => {
    setRecordForm({
      ...recordForm,
      studentId: student._id,
      studentName: student.name,
      studentGrade: student.grade,
      studentClass: student.className,
    });
    setSearchTerm("");
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.studentId) {
      setError("Please select a student");
      return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const submitData = {
        studentId: paymentForm.studentId,
        semester: paymentForm.semester,
        year: parseInt(paymentForm.year),
        amount: parseFloat(paymentForm.amount),
        amountPaid: parseFloat(paymentForm.amountPaid) || 0,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference || "",
        notes: paymentForm.notes || ""
      };
      
      let response;
      if (editingPaymentId) {
        response = await updateTransportPayment(editingPaymentId, submitData);
        setSuccess("✅ Payment updated successfully!");
      } else {
        response = await createTransportPayment(submitData);
        setSuccess("✅ Payment recorded successfully!");
      }
      
      resetPaymentForm();
      setShowPaymentForm(false);
      setEditingPaymentId(null);
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Payment submit error:", error);
      setError(error.response?.data?.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.studentId) {
      setError("Please select a student");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const submitData = {
        studentId: recordForm.studentId,
        date: recordForm.date,
        pickupLocation: recordForm.pickupLocation,
        dropoffLocation: recordForm.dropoffLocation,
        distance: parseFloat(recordForm.distance) || 0,
        status: recordForm.status,
        notes: recordForm.notes
      };
      
      if (editingRecordId) {
        setSuccess("Record updated successfully!");
      } else {
        await createTransportRecord(submitData);
        setSuccess("✅ Transport record added successfully!");
      }
      
      resetRecordForm();
      setShowRecordForm(false);
      setEditingRecordId(null);
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    
    setLoading(true);
    try {
      await deleteTransportPayment(id);
      setSuccess("✅ Payment deleted successfully!");
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transport record?")) return;
    
    setLoading(true);
    try {
      await deleteTransportRecord(id);
      setSuccess("✅ Record deleted successfully!");
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      studentId: "",
      studentName: "",
      studentGrade: "",
      studentClass: "",
      semester: selectedSemester,
      year: selectedYear,
      amount: "",
      amountPaid: "",
      paymentMethod: "CASH",
      reference: "",
      notes: ""
    });
    setSelectedGrade("ALL");
    setSelectedClass("ALL");
    setSearchTerm("");
    setFilteredStudents([]);
  };

  const resetRecordForm = () => {
    setRecordForm({
      studentId: "",
      studentName: "",
      studentGrade: "",
      studentClass: "",
      date: new Date().toISOString().split('T')[0],
      pickupLocation: "",
      dropoffLocation: "",
      distance: "",
      status: "COMPLETED",
      notes: ""
    });
    setSelectedGrade("ALL");
    setSelectedClass("ALL");
    setSearchTerm("");
    setFilteredStudents([]);
  };

  const getStatusColor = (status) => {
    const colors = { 
      "PAID": "bg-emerald-100 text-emerald-700", 
      "PARTIAL": "bg-amber-100 text-amber-700", 
      "UNPAID": "bg-rose-100 text-rose-700", 
      "COMPLETED": "bg-emerald-100 text-emerald-700", 
      "ABSENT": "bg-rose-100 text-rose-700",
      "HOLIDAY": "bg-blue-100 text-blue-700",
      "CANCELLED": "bg-gray-100 text-gray-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusIcon = (status) => {
    const icons = {
      "PAID": "✅",
      "PARTIAL": "⚠️",
      "UNPAID": "❌",
      "COMPLETED": "✅",
      "ABSENT": "❌",
      "HOLIDAY": "🏖️",
      "CANCELLED": "🚫"
    };
    return icons[status] || "📋";
  };

  const getStatusLabel = (status) => {
    const labels = {
      "PAID": "Paid",
      "PARTIAL": "Partial",
      "UNPAID": "Unpaid",
      "COMPLETED": "Completed",
      "ABSENT": "Absent",
      "HOLIDAY": "Holiday",
      "CANCELLED": "Cancelled"
    };
    return labels[status] || status;
  };

  const exportPaymentsData = payments.map(p => ({
    studentName: p.studentName,
    studentId: p.studentId,
    grade: p.grade,
    className: p.className,
    semester: p.semester?.replace("TERM", "Term "),
    year: p.year,
    amount: p.amount?.toLocaleString(),
    paid: p.amountPaid?.toLocaleString(),
    balance: p.balance?.toLocaleString(),
    status: getStatusLabel(p.status),
    paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "-"
  }));

  const exportColumns = [
    { key: "studentName", label: "Student Name" },
    { key: "studentId", label: "Student ID" },
    { key: "grade", label: "Grade" },
    { key: "className", label: "Class" },
    { key: "semester", label: "Term" },
    { key: "year", label: "Year" },
    { key: "amount", label: "Amount (RWF)" },
    { key: "paid", label: "Paid (RWF)" },
    { key: "balance", label: "Balance (RWF)" },
    { key: "status", label: "Status" }
  ];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = payments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(payments.length / itemsPerPage);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-500">Please login to access transport management.</p>
        </div>
      </div>
    );
  }

  if (isTeacher && !isBursar) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
          <div className="relative px-5 py-6 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                  🚌 Transport Management
                </h1>
                <p className="text-slate-300 text-sm">View transport payments and records</p>
                <p className="text-xs text-amber-400 mt-1">👁️ View only mode</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              {semesters.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="ALL">All Grades</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl shadow-lg p-3"><p className="text-xs text-slate-400">Expected</p><p className="text-lg font-bold text-slate-800">{summary.totalExpected?.toLocaleString()} RWF</p></div>
            <div className="bg-white rounded-xl shadow-lg p-3"><p className="text-xs text-slate-400">Paid</p><p className="text-lg font-bold text-emerald-600">{summary.totalPaid?.toLocaleString()} RWF</p></div>
            <div className="bg-white rounded-xl shadow-lg p-3"><p className="text-xs text-slate-400">Collection</p><p className="text-lg font-bold text-blue-600">{summary.collectionRate}%</p></div>
            <div className="bg-white rounded-xl shadow-lg p-3"><p className="text-xs text-slate-400">Students</p><p className="text-lg font-bold text-amber-600">{summary.studentsSummary?.paid}/{summary.studentsSummary?.total}</p></div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr><th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Student</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Grade/Class</th><th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount</th><th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Paid</th><th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Balance</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (<tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>) : payments.length === 0 ? (<tr><td colSpan="6" className="text-center py-8 text-slate-500">No payment records found</td></tr>) : (
                  payments.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><div><p className="font-medium text-slate-800">{p.studentName}</p><p className="text-xs text-slate-400">{p.studentId}</p></div></td>
                      <td className="px-4 py-3 text-slate-600">{p.grade} {p.className}</td>
                      <td className="px-4 py-3 text-right font-semibold">{p.amount?.toLocaleString()} RWF</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{p.amountPaid?.toLocaleString()} RWF</td>
                      <td className="px-4 py-3 text-right text-rose-600">{p.balance?.toLocaleString()} RWF</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>{getStatusIcon(p.status)} {getStatusLabel(p.status)}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${success ? "bg-emerald-500" : "bg-rose-500"} text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-[90vw] md:max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✅" : "⚠️"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-4 py-5 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">🚌</div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">Transport Management</h1>
                  <p className="text-slate-300 text-xs md:text-sm">Manage student transport payments and daily trip records</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { resetPaymentForm(); setShowPaymentForm(true); setEditingPaymentId(null); }} className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5">
                <span>💰</span> <span className="hidden xs:inline">Add Payment</span>
              </button>
              <button onClick={() => { resetRecordForm(); setShowRecordForm(true); setEditingRecordId(null); }} className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5">
                <span>📝</span> <span className="hidden xs:inline">Add Trip</span>
              </button>
              <button onClick={fetchOutstanding} className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5">
                <span>📋</span> <span className="hidden xs:inline">Outstanding</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">💰 Expected</p>
                <p className="text-lg font-bold text-white mt-0.5">{summary.totalExpected?.toLocaleString()} RWF</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">✅ Paid</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">{summary.totalPaid?.toLocaleString()} RWF</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">📊 Collection</p>
                <p className="text-lg font-bold text-blue-400 mt-0.5">{summary.collectionRate}%</p>
                <div className="mt-1 w-full bg-white/20 rounded-full h-1"><div className="bg-blue-400 h-1 rounded-full" style={{ width: `${summary.collectionRate}%` }}></div></div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs flex items-center gap-1">👥 Students</p>
                <p className="text-lg font-bold text-amber-400 mt-0.5">{summary.studentsSummary?.paid}/{summary.studentsSummary?.total} Paid</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none">
            <option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option>
          </select>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none">
            {semesters.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none">
            <option value="ALL">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="col-span-1 border border-slate-200 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none">
            <option value="ALL">All Classes</option>
            {["A", "B", "C", "D"].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-0.5">
        <button onClick={() => setActiveTab("payments")} className={`px-4 py-2 text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === "payments" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>
          💰 Payments ({payments.length})
        </button>
        <button onClick={() => setActiveTab("records")} className={`px-4 py-2 text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === "records" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>
          📝 Daily Records ({records.length})
        </button>
      </div>

      {/* Export Section */}
      {payments.length > 0 && activeTab === "payments" && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2"><span className="text-lg">📥</span><div><h3 className="font-semibold text-slate-800 text-sm">Export Payments</h3><p className="text-xs text-slate-400">Download report</p></div></div>
            <DownloadButton data={exportPaymentsData} columns={exportColumns} title="Transport Payments Report" filename={`transport_payments_${selectedYear}`} variant="primary" />
          </div>
        </div>
      )}

      {/* Results Count */}
      {payments.length > 0 && activeTab === "payments" && (
        <div className="bg-white rounded-xl shadow-lg p-3">
          <p className="text-xs text-slate-500">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, payments.length)} of {payments.length} payments</p>
        </div>
      )}

      {/* Payments Table */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 md:w-12 md:h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No payment records found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Grade/Class</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Amount</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Paid</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Balance</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Term</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentPayments.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2"><div><p className="font-medium text-slate-800 text-sm">{p.studentName}</p><p className="text-[10px] text-slate-400">{p.studentId}</p></div></td>
                        <td className="px-3 py-2 text-slate-600 text-xs">{p.grade} {p.className}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-700 text-sm">{p.amount?.toLocaleString()} RWF</td>
                        <td className="px-3 py-2 text-right text-emerald-600 text-sm">{p.amountPaid?.toLocaleString()} RWF</td>
                        <td className="px-3 py-2 text-right text-rose-600 text-sm">{p.balance?.toLocaleString()} RWF</td>
                        <td className="px-3 py-2"><span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(p.status)}`}>{getStatusIcon(p.status)} {getStatusLabel(p.status)}</span></td>
                        <td className="px-3 py-2 text-[10px] text-slate-500">{p.semester?.replace("TERM", "Term ")} {p.year}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setPaymentForm({ studentId: p.student?._id || p.student, studentName: p.studentName, studentGrade: p.grade, studentClass: p.className, semester: p.semester || "TERM1", year: p.year || new Date().getFullYear(), amount: p.amount || "", amountPaid: p.amountPaid || "", paymentMethod: p.paymentMethod || "CASH", reference: p.reference || "", notes: p.notes || "" }); setEditingPaymentId(p._id); setShowPaymentForm(true); }} className="p-1 rounded hover:bg-indigo-50 text-indigo-600 transition text-sm" title="Edit">✏️</button>
                            <button onClick={() => handleDeletePayment(p._id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 transition text-sm" title="Delete">🗑️</button>
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
                    <div className="text-xs text-slate-500">Page {currentPage} of {totalPages}</div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1">◀ Prev</button>
                      {getPageNumbers().map((page, idx) => (
                        <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${currentPage === page ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md" : page === '...' ? "text-slate-400 cursor-default" : "bg-white text-slate-700 hover:bg-slate-100"}`} disabled={page === '...'}>{page}</button>
                      ))}
                      <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1">Next ▶</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Records Table */}
      {activeTab === "records" && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 md:w-12 md:h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div></div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No transport records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Student</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Grade/Class</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Pickup</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Dropoff</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th><th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-xs text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 text-sm">{r.studentName}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{r.grade} {r.className}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{r.pickupLocation || "-"}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{r.dropoffLocation || "-"}</td>
                      <td className="px-3 py-2"><span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(r.status)}`}>{getStatusIcon(r.status)} {getStatusLabel(r.status)}</span></td>
                      <td className="px-3 py-2 text-center"><button onClick={() => handleDeleteRecord(r._id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 transition text-sm" title="Delete">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => { setShowPaymentForm(false); setEditingPaymentId(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">{editingPaymentId ? "Edit Payment" : "New Transport Payment"}</h2>
              <p className="text-xs text-indigo-100">Record student transport fee payment</p>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              {/* Student Selection */}
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">👥 Select Student</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass("ALL"); setFilteredStudents([]); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                    <option value="ALL">All Grades</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setFilteredStudents([]); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                    <option value="ALL">All Classes</option>
                    {["A", "B", "C", "D"].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                {selectedGrade !== "ALL" && selectedClass !== "ALL" && (
                  <div className="relative mb-2">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); const term = e.target.value.toLowerCase(); const filtered = filteredStudents.filter(s => s.name?.toLowerCase().includes(term) || s.studentId?.toLowerCase().includes(term)); setFilteredStudents(filtered); }} className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm" />
                  </div>
                )}
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg">
                  {selectedGrade === "ALL" || selectedClass === "ALL" ? (<div className="p-3 text-center text-slate-400 text-sm">Select grade and class</div>) : filteredStudents.length === 0 ? (<div className="p-3 text-center text-slate-400 text-sm">{searchTerm ? "No matching students" : "No students in this class"}</div>) : (
                    filteredStudents.map(student => (
                      <div key={student._id} onClick={() => handleSelectStudentForPayment(student)} className={`p-2 cursor-pointer transition border-b border-slate-100 last:border-0 ${paymentForm.studentId === student._id ? "bg-indigo-50 border-l-4 border-l-indigo-500" : "hover:bg-slate-50"}`}>
                        <div className="flex justify-between items-center">
                          <div><p className="font-medium text-slate-800 text-sm">{student.name}</p><p className="text-xs text-slate-400">{student.studentId}</p></div>
                          <div className="text-right"><span className="text-xs font-medium text-indigo-600">{student.grade}</span><span className="text-xs text-slate-400 ml-1">Class {student.className}</span>{student.transportSubscribed && <span className="block text-xs text-emerald-500">✅ Subscribed</span>}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {paymentForm.studentId && (
                  <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">Selected:</p>
                    <p className="text-sm font-semibold text-emerald-800">{paymentForm.studentName}</p>
                    <p className="text-xs text-emerald-600">{paymentForm.studentGrade} Class {paymentForm.studentClass}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Term</label><select value={paymentForm.semester} onChange={(e) => setPaymentForm({...paymentForm, semester: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">{semesters.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Year</label><input type="number" value={paymentForm.year} onChange={(e) => setPaymentForm({...paymentForm, year: parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Amount (RWF) *</label><input type="number" placeholder="Total amount" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required min="0" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid</label><input type="number" placeholder="Amount paid" value={paymentForm.amountPaid} onChange={(e) => setPaymentForm({...paymentForm, amountPaid: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" min="0" /></div>
              </div>

              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label><select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">{paymentMethods.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Reference</label><input type="text" placeholder="Reference number" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label><textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} rows="2" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Additional notes..." /></div>

              {error && <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2"><span>⚠️</span><span>{error}</span></div>}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">💾 {loading ? "Saving..." : (editingPaymentId ? "Update" : "Save")}</button>
                <button type="button" onClick={() => { setShowPaymentForm(false); setEditingPaymentId(null); }} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowRecordForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">{editingRecordId ? "Edit Record" : "Add Transport Record"}</h2>
              <p className="text-xs text-teal-100">Record daily student transport trip</p>
            </div>
            <form onSubmit={handleRecordSubmit} className="p-5 space-y-4">
              {/* Similar student selection as above */}
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">👥 Select Student</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass("ALL"); setFilteredStudents([]); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                    <option value="ALL">All Grades</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setFilteredStudents([]); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                    <option value="ALL">All Classes</option>
                    {["A", "B", "C", "D"].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                {selectedGrade !== "ALL" && selectedClass !== "ALL" && (
                  <div className="relative mb-2">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); const term = e.target.value.toLowerCase(); const filtered = filteredStudents.filter(s => s.name?.toLowerCase().includes(term) || s.studentId?.toLowerCase().includes(term)); setFilteredStudents(filtered); }} className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm" />
                  </div>
                )}
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg">
                  {selectedGrade === "ALL" || selectedClass === "ALL" ? (<div className="p-3 text-center text-slate-400 text-sm">Select grade and class</div>) : filteredStudents.length === 0 ? (<div className="p-3 text-center text-slate-400 text-sm">{searchTerm ? "No matching students" : "No students in this class"}</div>) : (
                    filteredStudents.map(student => (
                      <div key={student._id} onClick={() => handleSelectStudentForRecord(student)} className={`p-2 cursor-pointer transition border-b border-slate-100 last:border-0 ${recordForm.studentId === student._id ? "bg-indigo-50 border-l-4 border-l-indigo-500" : "hover:bg-slate-50"}`}>
                        <div className="flex justify-between items-center">
                          <div><p className="font-medium text-slate-800 text-sm">{student.name}</p><p className="text-xs text-slate-400">{student.studentId}</p></div>
                          <div className="text-right"><span className="text-xs font-medium text-indigo-600">{student.grade}</span><span className="text-xs text-slate-400 ml-1">Class {student.className}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {recordForm.studentId && (
                  <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">Selected:</p>
                    <p className="text-sm font-semibold text-emerald-800">{recordForm.studentName}</p>
                    <p className="text-xs text-emerald-600">{recordForm.studentGrade} Class {recordForm.studentClass}</p>
                  </div>
                )}
              </div>

              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Date</label><input type="date" value={recordForm.date} onChange={(e) => setRecordForm({...recordForm, date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Location</label><input type="text" placeholder="Pickup point" value={recordForm.pickupLocation} onChange={(e) => setRecordForm({...recordForm, pickupLocation: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Dropoff Location</label><input type="text" placeholder="Dropoff point" value={recordForm.dropoffLocation} onChange={(e) => setRecordForm({...recordForm, dropoffLocation: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Distance (km)</label><input type="number" step="0.1" placeholder="Distance" value={recordForm.distance} onChange={(e) => setRecordForm({...recordForm, distance: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Status</label><select value={recordForm.status} onChange={(e) => setRecordForm({...recordForm, status: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="COMPLETED">✅ Completed</option><option value="ABSENT">❌ Absent</option><option value="HOLIDAY">🏖️ Holiday</option><option value="CANCELLED">🚫 Cancelled</option>
                </select></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label><textarea value={recordForm.notes} onChange={(e) => setRecordForm({...recordForm, notes: e.target.value})} rows="2" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Additional notes..." /></div>

              {error && <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2"><span>⚠️</span><span>{error}</span></div>}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">💾 {loading ? "Saving..." : "Save Record"}</button>
                <button type="button" onClick={() => setShowRecordForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outstanding Payments Modal */}
      {showOutstanding && outstandingData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowOutstanding(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-lg font-bold">📋 Outstanding Payments</h2>
              <button onClick={() => setShowOutstanding(false)} className="text-white text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition">×</button>
            </div>
            <div className="p-5">
              <div className="bg-amber-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-amber-800">Total Outstanding: {outstandingData.totalOutstanding?.toLocaleString()} RWF</p>
                <p className="text-xs text-amber-600">Students with unpaid or partial payments: {outstandingData.outstandingCount}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr><th className="px-3 py-2 text-left text-xs font-semibold">Student</th><th className="px-3 py-2 text-left text-xs font-semibold">Class</th><th className="px-3 py-2 text-right text-xs font-semibold">Balance</th><th className="px-3 py-2 text-left text-xs font-semibold">Status</th></tr>
                  </thead>
                  <tbody>
                    {outstandingData.payments?.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50">
                        <td className="px-3 py-2"><div><p className="font-medium text-slate-800">{p.studentName}</p><p className="text-xs text-slate-400">{p.studentId}</p></div></td>
                        <td className="px-3 py-2 text-slate-600">{p.grade} {p.className}</td>
                        <td className="px-3 py-2 text-right font-semibold text-rose-600">{p.balance?.toLocaleString()} RWF</td>
                        <td className="px-3 py-2"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>{getStatusIcon(p.status)} {getStatusLabel(p.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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