import React, { useEffect, useState } from "react";
import { 
  createVisitor, 
  getVisitors, 
  checkoutVisitor,
  getVisitorStatistics,
  getVisitorReport,
  updateVisitor,
  deleteVisitor
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Get user role
  const userType = localStorage.getItem("userType");
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "superadmin" || userType === "school_admin";
  const isCustomerCare = userType === "customer_care";

  const reasonCategories = [
    { value: "PARENT_CLAIM", label: "Parent Claim", icon: "👨‍👩‍👧", color: "bg-blue-100 text-blue-700" },
    { value: "INFORMATION_SEEKING", label: "Information Seeking", icon: "ℹ️", color: "bg-emerald-100 text-emerald-700" },
    { value: "MEETING", label: "Meeting", icon: "🤝", color: "bg-purple-100 text-purple-700" },
    { value: "DELIVERY", label: "Delivery", icon: "📦", color: "bg-amber-100 text-amber-700" },
    { value: "MAINTENANCE", label: "Maintenance", icon: "🔧", color: "bg-slate-100 text-slate-700" },
    { value: "OTHER", label: "Other", icon: "📌", color: "bg-rose-100 text-rose-700" }
  ];

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    reasonForVisit: "",
    reasonCategory: "PARENT_CLAIM",
    personToMeet: "",
    notes: ""
  });

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await getVisitors();
      let filtered = res.data?.visitors || res.data || [];
      if (searchTerm) {
        filtered = filtered.filter(v => 
          v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.phone?.includes(searchTerm) ||
          v.reasonForVisit?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setVisitors(filtered);
    } catch (error) {
      console.error("Failed to load visitors:", error);
      setError("Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await getVisitorStatistics({ period: filterPeriod });
      setStatsData(res.data?.statistics || res.data);
      setShowStats(true);
    } catch (error) {
      console.error("Failed to load statistics:", error);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await getVisitorReport({});
      setReportData(res.data);
      setShowReport(true);
    } catch (error) {
      console.error("Failed to load report:", error);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [searchTerm]);

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("Please provide name and phone number");
      return;
    }
    
    setLoading(true);
    try {
      const submitData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email || "",
        reasonForVisit: form.reasonForVisit,
        reasonCategory: form.reasonCategory,
        personToMeet: form.personToMeet || "",
        notes: form.notes || ""
      };
      
      await createVisitor(submitData);
      setSuccess("Visitor checked in successfully!");
      setShowAddForm(false);
      setForm({
        name: "",
        phone: "",
        email: "",
        reasonForVisit: "",
        reasonCategory: "PARENT_CLAIM",
        personToMeet: "",
        notes: ""
      });
      fetchVisitors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to record visitor:", error);
      setError(error.response?.data?.message || "Failed to record visitor");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (id) => {
    setLoading(true);
    try {
      await checkoutVisitor(id);
      setSuccess("Visitor checked out successfully!");
      fetchVisitors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to checkout visitor:", error);
      setError(error.response?.data?.message || "Failed to checkout visitor");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisitor = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email || "",
        reasonForVisit: form.reasonForVisit,
        reasonCategory: form.reasonCategory,
        personToMeet: form.personToMeet || "",
        notes: form.notes || ""
      };
      
      await updateVisitor(editingVisitor._id, submitData);
      setSuccess("Visitor updated successfully!");
      setEditingVisitor(null);
      setShowAddForm(false);
      setForm({
        name: "",
        phone: "",
        email: "",
        reasonForVisit: "",
        reasonCategory: "PARENT_CLAIM",
        personToMeet: "",
        notes: ""
      });
      fetchVisitors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to update visitor:", error);
      setError(error.response?.data?.message || "Failed to update visitor");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (visitor) => {
    setEditingVisitor(visitor);
    setForm({
      name: visitor.name,
      phone: visitor.phone,
      email: visitor.email || "",
      reasonForVisit: visitor.reasonForVisit,
      reasonCategory: visitor.reasonCategory,
      personToMeet: visitor.personToMeet || "",
      notes: visitor.notes || ""
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      setError("You don't have permission to delete visitors");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this visitor record?")) return;
    
    setLoading(true);
    try {
      await deleteVisitor(id);
      setSuccess("Visitor record deleted!");
      fetchVisitors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to delete visitor:", error);
      setError(error.response?.data?.message || "Failed to delete visitor");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category) => {
    return reasonCategories.find(c => c.value === category) || reasonCategories[5];
  };

  const getDurationDisplay = (minutes) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVisitors = visitors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(visitors.length / itemsPerPage);

  const exportData = visitors.map(v => ({
    name: v.name,
    phone: v.phone,
    email: v.email || "-",
    reasonCategory: v.reasonCategory?.replace("_", " "),
    reasonForVisit: v.reasonForVisit,
    personToMeet: v.personToMeet || "-",
    checkInTime: new Date(v.checkInTime).toLocaleString(),
    checkOutTime: v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "Still inside",
    duration: getDurationDisplay(v.durationMinutes)
  }));

  const exportColumns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "reasonCategory", label: "Category" },
    { key: "reasonForVisit", label: "Reason" },
    { key: "personToMeet", label: "Person to Meet" },
    { key: "checkInTime", label: "Check In" },
    { key: "checkOutTime", label: "Check Out" },
    { key: "duration", label: "Duration" }
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

  const activeVisitors = visitors.filter(v => !v.checkOutTime && v.status !== "CHECKED_OUT").length;

  // If not authorized for visitors
  if (!isAdmin && !isCustomerCare) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view visitors.</p>
        </div>
      </div>
    );
  }

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
                👥 Visitor Management
              </h1>
              <p className="text-slate-300 text-sm">
                Track school visitors, reasons for visits, and generate reports
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingVisitor(null); setShowAddForm(true); }}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
              >
                <span>➕</span> Check In Visitor
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={fetchStats}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                  >
                    <span>📊</span> Statistics
                  </button>
                  <button
                    onClick={fetchReport}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                  >
                    <span>📋</span> Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Total Visitors</p>
              <p className="text-2xl font-bold text-white mt-1">{visitors.length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Currently Inside</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{activeVisitors}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <p className="text-slate-300 text-xs">Today's Visitors</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {visitors.filter(v => new Date(v.checkInTime).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search by name, phone, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>
      </div>

      {/* Export Section */}
      {visitors.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Visitors Log</h3>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Visitors Log Report" 
              filename={`visitors_log_${new Date().toISOString().slice(0, 10)}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Visitors Table */}
      {loading && visitors.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : visitors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">👥</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No visitors recorded</h3>
          <p className="text-slate-500 text-sm">Click "Check In Visitor" to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Visitor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Reason</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Check In</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Duration</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentVisitors.map((visitor) => {
                  const categoryInfo = getCategoryInfo(visitor.reasonCategory);
                  return (
                    <tr key={visitor._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{visitor.name}</p>
                          <p className="text-xs text-slate-400">{visitor.phone}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.icon} {categoryInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-sm max-w-xs truncate">{visitor.reasonForVisit}</td>
                      <td className="px-3 py-2 text-slate-600 text-sm">
                        {new Date(visitor.checkInTime).toLocaleTimeString()}
                        <br />
                        <span className="text-xs text-slate-400">{new Date(visitor.checkInTime).toLocaleDateString()}</span>
                      </td>
                      <td className="px-3 py-2">
                        {visitor.checkOutTime ? (
                          <span className="text-emerald-600 text-sm">{getDurationDisplay(visitor.durationMinutes)}</span>
                        ) : (
                          <span className="text-amber-600 text-sm font-medium">● Active</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex gap-1 justify-center">
                          {!visitor.checkOutTime && (
                            <button
                              onClick={() => handleCheckout(visitor._id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(visitor)}
                            className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                          >
                            ✏️ Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(visitor._id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition"
                            >
                              🗑️ Delete
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500">Page {currentPage} of {totalPages}</div>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-2 py-1 rounded text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50">← Prev</button>
                  {getPageNumbers().map((page, idx) => (
                    <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} className={`w-7 h-7 rounded text-xs font-medium transition ${currentPage === page ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm" : page === '...' ? "text-slate-400 cursor-default" : "bg-white text-slate-700 hover:bg-slate-100"}`} disabled={page === '...'}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-2 py-1 rounded text-xs bg-white text-slate-700 hover:bg-slate-100 shadow-sm disabled:opacity-50">Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Visitor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => { setShowAddForm(false); setEditingVisitor(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3 flex justify-between items-center bg-gradient-to-r from-teal-500 to-emerald-500 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">{editingVisitor ? "✏️ Edit Visitor" : "➕ Check In Visitor"}</h2>
              <button onClick={() => { setShowAddForm(false); setEditingVisitor(null); }} className="text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={editingVisitor ? handleUpdateVisitor : handleAddVisitor} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Category *</label>
                <select
                  value={form.reasonCategory}
                  onChange={(e) => setForm({...form, reasonCategory: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {reasonCategories.map(c => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit *</label>
                <textarea
                  value={form.reasonForVisit}
                  onChange={(e) => setForm({...form, reasonForVisit: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Meeting with Principal about child's progress..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Person to Meet (Optional)</label>
                <input
                  type="text"
                  value={form.personToMeet}
                  onChange={(e) => setForm({...form, personToMeet: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Mr. John Doe - Principal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Saving..." : (editingVisitor ? "Update Visitor" : "Check In Visitor")}
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); setEditingVisitor(null); }} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Modal - Admin only */}
      {isAdmin && showStats && statsData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowStats(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📊 Visitor Statistics</h2>
              <button onClick={() => setShowStats(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Visitors</p>
                  <p className="text-xl font-bold text-blue-700">{statsData.totalVisitors || visitors.length}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Currently Inside</p>
                  <p className="text-xl font-bold text-emerald-700">{statsData.activeVisitors || activeVisitors}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">Today's Visitors</p>
                  <p className="text-xl font-bold text-purple-700">{statsData.todayVisitors || visitors.filter(v => new Date(v.checkInTime).toDateString() === new Date().toDateString()).length}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">By Reason Category</p>
                <div className="space-y-2">
                  {Object.entries(statsData.byReason || {}).map(([category, count]) => {
                    const catInfo = reasonCategories.find(c => c.value === category);
                    return (
                      <div key={category} className="flex items-center gap-2">
                        <div className="w-32 text-xs font-medium text-slate-700">
                          {catInfo?.icon} {catInfo?.label || category}
                        </div>
                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                            style={{ width: `${(count / (statsData.totalVisitors || 1) * 100)}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs font-bold text-teal-600">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal - Admin only */}
      {isAdmin && showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 flex justify-between items-center text-white rounded-t-xl">
              <h2 className="text-base font-bold">📋 Visitor Management Report</h2>
              <button onClick={() => setShowReport(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Visitors</p>
                  <p className="text-xl font-bold text-blue-700">{reportData.summary?.totalVisitors || visitors.length}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Completed Visits</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData.summary?.completedVisits || visitors.filter(v => v.checkOutTime).length}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Active Visits</p>
                  <p className="text-xl font-bold text-amber-700">{reportData.summary?.activeVisits || activeVisitors}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}