import { useEffect, useState } from "react";
import API from "../../services/api";
import { Link } from "react-router-dom";

export default function AdminSchools() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
        adminUserType: "school_admin",
        plan: "free_trial",
    });

    const userTypes = [
        { value: "school_admin", label: "School Administrator", icon: "👑" },
        { value: "teacher", label: "Teacher", icon: "👨‍🏫" },
        { value: "bursar", label: "Bursar", icon: "💰" },
        { value: "stock_keeper", label: "Stock Keeper", icon: "📦" },
        { value: "customer_care", label: "Customer Care", icon: "🤝" },
    ];

    const subscriptionPlans = [
        { value: "free_trial", label: "Free Trial", price: "Free", duration: "14 days", icon: "🎁", color: "slate" },
        { value: "monthly", label: "Monthly", price: "$29/mo", duration: "30 days", icon: "📅", color: "blue" },
        { value: "yearly", label: "Yearly", price: "$299/yr", duration: "365 days", icon: "🌟", color: "green" },
        { value: "lifetime", label: "Lifetime", price: "$999", duration: "Lifetime", icon: "💎", color: "purple" },
    ];

    useEffect(() => {
        fetchSchools();
    }, [filter, search]);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter !== "all") params.status = filter;
            if (search) params.search = search;
            
            const res = await API.get("/admin/schools", { params });
            setSchools(res.data || []);
            setCurrentPage(1);
            setMessage({ type: "", text: "" });
        } catch (error) {
            console.error("Error fetching schools:", error);
            setMessage({ type: "error", text: "Failed to load schools" });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            phone: "",
            address: "",
            adminName: "",
            adminEmail: "",
            adminPassword: "",
            adminUserType: "school_admin",
            plan: "free_trial",
        });
    };

    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [newCredentials, setNewCredentials] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    
    const handleAddSchool = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await API.post("/admin/schools", form);
            setNewCredentials(response.data.credentials);
            setShowCredentialsModal(true);
            setMessage({ type: "success", text: `School "${form.name}" registered!` });
            setShowAddModal(false);
            resetForm();
            fetchSchools();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to register school" });
        } finally {
            setLoading(false);
        }
    };

    const handleShareCredentials = async (schoolId, schoolName) => {
        setIsSharing(true);
        try {
            const schoolDetail = await API.get(`/admin/schools/${schoolId}`);
            const adminUser = schoolDetail.data.users.find(user => user.role === "admin" || user.userType === "school_admin");
            
            if (!adminUser) {
                setMessage({ type: "error", text: "No admin user found" });
                return;
            }
            
            const response = await API.post(`/admin/users/${adminUser._id}/reset-password`);
            
            if (response.data.success) {
                setNewCredentials({ ...response.data.credentials, isPasswordReset: true });
                setShowCredentialsModal(true);
                setMessage({ type: "success", text: `New credentials for ${schoolName}!` });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            }
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to share credentials" });
        } finally {
            setIsSharing(false);
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        setMessage({ type: "success", text: `${label} copied!` });
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Approve this school? They will get full access.")) return;
        setLoading(true);
        try {
            await API.put(`/admin/schools/${id}/approve`);
            setMessage({ type: "success", text: "School approved!" });
            fetchSchools();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to approve" });
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (id) => {
        const reason = prompt("Reason for suspension:");
        if (!reason) return;
        setLoading(true);
        try {
            await API.put(`/admin/schools/${id}/suspend`, { reason });
            setMessage({ type: "success", text: "School suspended!" });
            fetchSchools();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to suspend" });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id) => {
        if (!window.confirm("Activate this school? All users will be reactivated.")) return;
        setLoading(true);
        try {
            await API.put(`/admin/schools/${id}/activate`);
            setMessage({ type: "success", text: "School activated!" });
            fetchSchools();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to activate" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, schoolName) => {
        const confirmMessage = `⚠️ PERMANENT ACTION: Delete "${schoolName}"?\n\nThis will delete ALL data.\nThis action CANNOT be undone!`;
        if (!window.confirm(confirmMessage)) return;
        
        const confirmText = prompt(`Type "${schoolName}" to confirm:`);
        if (confirmText !== schoolName) {
            setMessage({ type: "error", text: "Deletion cancelled" });
            return;
        }
        
        setLoading(true);
        try {
            await API.delete(`/admin/schools/${id}`);
            setMessage({ type: "success", text: `School "${schoolName}" deleted!` });
            fetchSchools();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to delete" });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case "active": return "bg-emerald-100 text-emerald-700";
            case "pending": return "bg-amber-100 text-amber-700";
            case "suspended": return "bg-rose-100 text-rose-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case "active": return "✅";
            case "pending": return "⏳";
            case "suspended": return "❌";
            default: return "📋";
        }
    };

    const getPlanDetails = (plan) => {
        return subscriptionPlans.find(p => p.value === plan) || subscriptionPlans[0];
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSchools = schools.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(schools.length / itemsPerPage);

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
            
            {/* Toast Message */}
            {message.text && (
                <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
                    message.type === "success" ? "bg-emerald-500" : "bg-rose-500"
                } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm`}>
                    <span className="text-lg">{message.type === "success" ? "✓" : "⚠"}</span>
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                <div className="relative px-5 py-5 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">🏫</span>
                                <h1 className="text-xl md:text-2xl font-bold text-white">Schools Management</h1>
                            </div>
                            <p className="text-slate-300 text-xs mt-1">Manage all registered schools</p>
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)} 
                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
                        >
                            <span className="text-lg">+</span>
                            Register New School
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex flex-wrap gap-2">
                        {["all", "pending", "active", "suspended"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    filter === status
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {status === "all" ? "📋 All" : 
                                 status === "pending" ? "⏳ Pending" : 
                                 status === "active" ? "✅ Active" : "❌ Suspended"}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by name, email, or school code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            {schools.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-3">
                    <p className="text-xs text-slate-500">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, schools.length)} of {schools.length} schools
                    </p>
                </div>
            )}

            {/* Add School Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-sm">➕</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Register New School</h2>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-2xl">&times;</button>
                        </div>
                        
                        <form onSubmit={handleAddSchool} className="p-5 space-y-4">
                            {/* School Information */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">🏛️ School Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">School Name *</label>
                                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">School Email *</label>
                                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                                        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                                        <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Administrator Account */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">👤 Administrator Account</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Name *</label>
                                        <input type="text" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Email *</label>
                                        <input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Password</label>
                                        <input type="text" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" placeholder="Auto-generate if empty" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Admin User Type</label>
                                        <select
                                            value={form.adminUserType}
                                            onChange={(e) => setForm({ ...form, adminUserType: e.target.value })}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                        >
                                            {userTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription Plan */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">💰 Subscription Plan</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {subscriptionPlans.map((plan) => (
                                        <div
                                            key={plan.value}
                                            onClick={() => setForm({ ...form, plan: plan.value })}
                                            className={`border-2 rounded-xl p-2 cursor-pointer transition-all text-center ${
                                                form.plan === plan.value ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="text-xl">{plan.icon}</div>
                                            <div className="text-xs font-bold text-slate-700">{plan.label}</div>
                                            <div className="text-xs font-bold text-indigo-600">{plan.price}</div>
                                            <div className="text-[10px] text-slate-400">{plan.duration}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-slate-100">
                                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all">Register School</button>
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credentials Modal */}
            {showCredentialsModal && newCredentials && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCredentialsModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className={`sticky top-0 ${newCredentials.isPasswordReset ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'} px-5 py-3 flex justify-between items-center text-white rounded-t-xl`}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{newCredentials.isPasswordReset ? "🔄" : "✅"}</span>
                                <h2 className="text-base font-bold">{newCredentials.isPasswordReset ? 'Credentials Reset' : 'School Registered!'}</h2>
                            </div>
                            <button onClick={() => setShowCredentialsModal(false)} className="text-white text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-5 space-y-3">
                            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-2">
                                <p className="text-xs text-amber-800">⚠️ These credentials are shown only once. Please copy and share them.</p>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🏫 School Name</label>
                                    <div className="bg-slate-50 p-2 rounded-lg text-sm">{newCredentials.schoolName}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🔑 School Code</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-slate-50 p-2 rounded-lg font-mono text-sm">{newCredentials.schoolCode}</code>
                                        <button onClick={() => copyToClipboard(newCredentials.schoolCode, "School code")} className="bg-slate-500 text-white px-2 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">👤 Admin Name</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 p-2 rounded-lg text-sm">{newCredentials.name || newCredentials.adminName}</div>
                                        <button onClick={() => copyToClipboard(newCredentials.name || newCredentials.adminName, "Name")} className="bg-slate-500 text-white px-2 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">📧 Admin Email</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 p-2 rounded-lg text-sm">{newCredentials.adminEmail || newCredentials.email}</div>
                                        <button onClick={() => copyToClipboard(newCredentials.adminEmail || newCredentials.email, "Email")} className="bg-slate-500 text-white px-2 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🔐 {newCredentials.isPasswordReset ? 'NEW Password' : 'Password'}</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-slate-50 p-2 rounded-lg font-mono text-sm font-bold text-emerald-600">{newCredentials.adminPassword || newCredentials.password}</code>
                                        <button onClick={() => copyToClipboard(newCredentials.adminPassword || newCredentials.password, "Password")} className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">🔗 Login URL</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 p-2 rounded-lg text-xs truncate">{newCredentials.loginUrl}</div>
                                        <button onClick={() => copyToClipboard(newCredentials.loginUrl, "URL")} className="bg-slate-500 text-white px-2 py-1 rounded-lg text-xs">Copy</button>
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={() => setShowCredentialsModal(false)} className={`w-full ${newCredentials.isPasswordReset ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'} text-white py-2 rounded-lg font-semibold text-sm mt-2`}>
                                I've Copied the Credentials
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schools Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
                    </div>
                ) : schools.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-3">🏫</div>
                        <p className="text-slate-500 text-sm">No schools found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">School</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Code</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Plan</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Registered</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Users</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentSchools.map((school) => {
                                        const plan = getPlanDetails(school.subscription?.plan);
                                        return (
                                            <tr key={school._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{school.name}</p>
                                                        <p className="text-xs text-slate-400">{school.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">{school.schoolCode}</code>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${plan.color}-100 text-${plan.color}-700`}>
                                                        {plan.icon} {plan.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(school.status)}`}>
                                                        {getStatusIcon(school.status)} {school.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-slate-500">
                                                    {new Date(school.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                        {school.stats?.userCount || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                        {school.status === "pending" && (
                                                            <button onClick={() => handleApprove(school._id)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition">Approve</button>
                                                        )}
                                                        {school.status === "active" && (
                                                            <button onClick={() => handleSuspend(school._id)} className="px-2 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition">Suspend</button>
                                                        )}
                                                        {school.status === "suspended" && (
                                                            <button onClick={() => handleActivate(school._id)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition">Activate</button>
                                                        )}
                                                        <button onClick={() => handleShareCredentials(school._id, school.name)} disabled={isSharing} className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition disabled:opacity-50">Share</button>
                                                        <Link to={`/admin/schools/${school._id}`} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition">View</Link>
                                                        <button onClick={() => handleDelete(school._id, school.name)} className="px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition">Delete</button>
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
                            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                    <div className="text-xs text-slate-500">Page {currentPage} of {totalPages}</div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`px-2 py-1 rounded text-xs font-medium transition ${currentPage === 1 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"}`}>← Prev</button>
                                        {getPageNumbers().map((page, idx) => (
                                            <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} className={`w-7 h-7 rounded text-xs font-medium transition ${currentPage === page ? "bg-indigo-600 text-white shadow-sm" : page === '...' ? "text-slate-400 cursor-default" : "bg-white text-slate-700 hover:bg-slate-100"}`} disabled={page === '...'}>{page}</button>
                                        ))}
                                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`px-2 py-1 rounded text-xs font-medium transition ${currentPage === totalPages ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"}`}>Next →</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}