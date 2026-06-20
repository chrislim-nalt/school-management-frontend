import React, { useEffect, useState } from "react";
import { 
  requestPermission, 
  getMyPermissions, 
  getAllPermissions,
  approvePermission,
  disapprovePermission,
  revokePermission,
  getPermissionReport
} from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [userType, setUserType] = useState(localStorage.getItem("userType") || "staff");
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "staff");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [summary, setSummary] = useState({});
  
  const [form, setForm] = useState({
    reason: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Determine if user is admin or teacher
  const isAdmin = userRole === "superadmin" || userType === "school_admin" || userType === "admin";
  const isTeacher = userType === "teacher" || userType === "staff";

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      let res;
      if (isTeacher && !isAdmin) {
        res = await getMyPermissions();
        setPermissions(res.data?.permissions || res.data || []);
      } else if (isAdmin) {
        const params = filterStatus !== "ALL" ? { status: filterStatus } : {};
        res = await getAllPermissions(params);
        setPermissions(res.data?.permissions || []);
        setSummary(res.data?.summary || {});
      }
    } catch (error) {
      console.error("Failed to load permissions:", error);
      setError("Failed to load permissions");
      // Try to get data from response
      if (error.response?.data) {
        const data = error.response.data;
        setPermissions(data.permissions || []);
        setSummary(data.summary || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [filterStatus]);

  const handleRequest = async (e) => {
    e.preventDefault();
    
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays > 7) {
      setError("Permission cannot exceed 7 days");
      return;
    }
    
    if (start > end) {
      setError("Start date must be before end date");
      return;
    }
    
    setLoading(true);
    try {
      await requestPermission(form);
      setSuccess("Permission request submitted!");
      setShowRequestForm(false);
      setForm({
        reason: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      fetchPermissions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this permission request?")) return;
    
    setLoading(true);
    try {
      await approvePermission(id);
      setSuccess("Permission approved!");
      fetchPermissions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  const handleDisapprove = async (id) => {
    const reason = prompt("Reason for disapproval:");
    if (!reason) return;
    
    setLoading(true);
    try {
      await disapprovePermission(id, { rejectionReason: reason });
      setSuccess("Permission disapproved");
      fetchPermissions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to disapprove");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Revoke this approved permission?")) return;
    
    setLoading(true);
    try {
      await revokePermission(id);
      setSuccess("Permission revoked");
      fetchPermissions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to revoke");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getPermissionReport({});
      setReportData(res.data);
      setShowReport(true);
    } catch (error) {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-amber-100 text-amber-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      DISAPPROVED: "bg-rose-100 text-rose-700",
      REVOKED: "bg-slate-100 text-slate-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: "⏳",
      APPROVED: "✅",
      DISAPPROVED: "❌",
      REVOKED: "🔄"
    };
    return icons[status] || "📋";
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "Pending",
      APPROVED: "Approved",
      DISAPPROVED: "Disapproved",
      REVOKED: "Revoked"
    };
    return labels[status] || status;
  };

  const exportData = permissions.map(p => ({
    teacherName: p.teacherName,
    reason: p.reason,
    startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : "-",
    endDate: p.endDate ? new Date(p.endDate).toLocaleDateString() : "-",
    totalDays: p.totalDays || 0,
    status: getStatusLabel(p.status),
    approvedBy: p.approvedByName || "-",
    requestedOn: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"
  }));

  const exportColumns = [
    { key: "teacherName", label: "Teacher" },
    { key: "reason", label: "Reason" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
    { key: "totalDays", label: "Days" },
    { key: "status", label: "Status" },
    { key: "approvedBy", label: "Approved By" },
    { key: "requestedOn", label: "Requested On" }
  ];

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
                📋 Permission Management
              </h1>
              <p className="text-slate-300 text-sm">
                {isTeacher && !isAdmin ? "Request time off or view your permission history" : "Review and manage teacher permission requests"}
              </p>
            </div>
            <div className="flex gap-2">
              {isTeacher && (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                >
                  <span>📝</span> Request Permission
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={fetchReport}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
                >
                  <span>📊</span> View Report
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards for Admin */}
          {isAdmin && summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Requests</p>
                <p className="text-2xl font-bold text-white mt-1">{summary.total || permissions.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Pending</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{summary.pending || permissions.filter(p => p.status === "PENDING").length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Approved</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.approved || permissions.filter(p => p.status === "APPROVED").length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <p className="text-slate-300 text-xs">Total Days</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{summary.totalDaysRequested || permissions.reduce((sum, p) => sum + (p.totalDays || 0), 0)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters (Admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex gap-2 flex-wrap">
            {["ALL", "PENDING", "APPROVED", "DISAPPROVED", "REVOKED"].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status === "ALL" ? "📋 All" : 
                 status === "PENDING" ? "⏳ Pending" :
                 status === "APPROVED" ? "✅ Approved" :
                 status === "DISAPPROVED" ? "❌ Disapproved" : "🔄 Revoked"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Export Section */}
      {permissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">📥 Export Permissions</h3>
            <DownloadButton 
              data={exportData} 
              columns={exportColumns} 
              title="Permissions Report" 
              filename={`permissions_${new Date().toISOString().slice(0, 10)}`} 
              variant="primary" 
            />
          </div>
        </div>
      )}

      {/* Permissions Table */}
      {loading && permissions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : permissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No permission requests found</h3>
          <p className="text-slate-500 text-sm">
            {isTeacher && !isAdmin ? "Click 'Request Permission' to submit a request" : "No requests to review"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  {isAdmin && <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Teacher</th>}
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Reason</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Start Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">End Date</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Days</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                  {isAdmin && <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((permission) => (
                  <tr key={permission._id} className="hover:bg-slate-50 transition-colors">
                    {isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{permission.teacherName}</p>
                          <p className="text-xs text-slate-400">{permission.teacherEmail}</p>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-2 text-slate-600 text-sm max-w-xs truncate">{permission.reason}</td>
                    <td className="px-3 py-2 text-slate-600 text-sm">{permission.startDate ? new Date(permission.startDate).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-2 text-slate-600 text-sm">{permission.endDate ? new Date(permission.endDate).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-2 text-center font-semibold text-indigo-600">{permission.totalDays || 0}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(permission.status)}`}>
                        {getStatusIcon(permission.status)} {getStatusLabel(permission.status)}
                      </span>
                    </td>
                    {isAdmin && permission.status === "PENDING" && (
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleApprove(permission._id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition"
                            title="Approve"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleDisapprove(permission._id)}
                            className="px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition"
                            title="Disapprove"
                          >
                            ❌ Disapprove
                          </button>
                        </div>
                      </td>
                    )}
                    {isAdmin && permission.status === "APPROVED" && (
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleRevoke(permission._id)}
                          className="px-2 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition"
                          title="Revoke"
                        >
                          🔄 Revoke
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRequestForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">📝 Request Permission</h2>
              <button onClick={() => setShowRequestForm(false)} className="text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleRequest} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for leave *</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason: e.target.value})}
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Medical, personal, family emergency, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  ⚠️ Permission cannot exceed 7 days. You will be notified once approved.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
                <button type="button" onClick={() => setShowRequestForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
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
              <h2 className="text-base font-bold">📊 Permission Analytics Report</h2>
              <button onClick={() => setShowReport(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Total Requests</p>
                  <p className="text-xl font-bold text-blue-700">{reportData.summary?.totalRequests || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600">Approved</p>
                  <p className="text-xl font-bold text-emerald-700">{reportData.summary?.approvedCount || 0}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600">Pending</p>
                  <p className="text-xl font-bold text-amber-700">{reportData.summary?.pendingCount || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">Total Days</p>
                  <p className="text-xl font-bold text-purple-700">{reportData.summary?.totalDaysRequested || 0}</p>
                </div>
              </div>

              {/* Chart Data */}
              {reportData.chartData && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Status Distribution</p>
                  <div className="flex gap-4 flex-wrap">
                    {reportData.chartData.statusDistribution?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.label === "Approved" ? "bg-emerald-500" :
                          item.label === "Pending" ? "bg-amber-500" :
                          item.label === "Disapproved" ? "bg-rose-500" :
                          "bg-slate-500"
                        }`}></div>
                        <span className="text-sm">{item.label}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">By Teacher</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(reportData.byTeacher || {}).map(([teacher, data]) => (
                    <div key={teacher} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">{teacher}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-emerald-600">✅ {data.approved}</span>
                        <span className="text-amber-600">⏳ {data.pending}</span>
                        <span className="text-slate-600">📅 {data.totalDays} days</span>
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