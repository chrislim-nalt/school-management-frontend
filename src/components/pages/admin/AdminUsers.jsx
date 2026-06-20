import { useEffect, useState } from "react";
import API from "../../services/api";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showCredentials, setShowCredentials] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [filterUserType, setFilterUserType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        schoolId: "",
        role: "staff",
        userType: "staff",
        permissions: null
    });

    const userTypes = [
        { value: "superadmin", label: "Super Admin", icon: "👑", color: "purple" },
        { value: "school_admin", label: "School Admin", icon: "🏫", color: "blue" },
        { value: "teacher", label: "Teacher", icon: "👨‍🏫", color: "emerald" },
        { value: "bursar", label: "Bursar", icon: "💰", color: "amber" },
        { value: "stock_keeper", label: "Stock Keeper", icon: "📦", color: "indigo" },
        { value: "customer_care", label: "Customer Care", icon: "🤝", color: "rose" },
        { value: "staff", label: "Staff", icon: "👤", color: "slate" },
        { value: "viewer", label: "Viewer", icon: "👁️", color: "cyan" },
    ];

    useEffect(() => {
        fetchData();
    }, [filterUserType, filterStatus, searchTerm]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterUserType) params.userType = filterUserType;
            if (filterStatus) params.isActive = filterStatus === "active";
            if (searchTerm) params.search = searchTerm;
            
            const [usersRes, schoolsRes] = await Promise.all([
                API.get("/admin/users", { params }),
                API.get("/admin/schools")
            ]);
            setUsers(usersRes.data);
            setSchools(schoolsRes.data);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error fetching data:", error);
            setMessage({ type: "error", text: "Failed to load data" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.schoolId) {
            setMessage({ type: "error", text: "Please fill all required fields" });
            return;
        }

        setLoading(true);
        try {
            const response = await API.post("/admin/users", {
                name: form.name,
                email: form.email,
                password: form.password || undefined,
                schoolId: form.schoolId,
                role: form.role,
                userType: form.userType,
            });
            
            if (response.data.credentials) {
                setShowCredentials(response.data.credentials);
            }
            
            setMessage({ type: "success", text: response.data.message || "User created successfully!" });
            setShowForm(false);
            setForm({ name: "", email: "", password: "", schoolId: "", role: "staff", userType: "staff", permissions: null });
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ 
                type: "error", 
                text: error.response?.data?.message || "Failed to create user" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        setLoading(true);
        try {
            await API.put(`/admin/users/${id}`, { isActive: !currentStatus });
            setMessage({ type: "success", text: "User status updated!" });
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to update user" });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (id, newUserType, newRole) => {
        setLoading(true);
        try {
            await API.put(`/admin/users/${id}`, { userType: newUserType, role: newRole });
            setMessage({ type: "success", text: "User role updated!" });
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to update role" });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (userId, userName) => {
        if (!window.confirm(`Reset password for ${userName}? New credentials will be generated.`)) return;
        
        setLoading(true);
        try {
            const response = await API.post(`/admin/users/${userId}/reset-password`);
            if (response.data.credentials) {
                setShowCredentials({ ...response.data.credentials, isPasswordReset: true });
                setMessage({ type: "success", text: `Password reset for ${userName}!` });
            }
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to reset password" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id, userName) => {
        if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
        
        setLoading(true);
        try {
            await API.delete(`/admin/users/${id}`);
            setMessage({ type: "success", text: `User "${userName}" deleted!` });
            fetchData();
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to delete user" });
        } finally {
            setLoading(false);
        }
    };

    const getUserTypeInfo = (userType) => {
        return userTypes.find(t => t.value === userType) || userTypes[6];
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        setMessage({ type: "success", text: `${label} copied!` });
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);

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

            {/* Credentials Modal */}
            {showCredentials && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className={`px-6 py-4 ${showCredentials.isPasswordReset ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{showCredentials.isPasswordReset ? "🔄" : "🎉"}</span>
                                <h3 className="text-lg font-bold text-white">{showCredentials.isPasswordReset ? 'Password Reset!' : 'User Created Successfully!'}</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                Please save these credentials and share them securely with the user:
                            </p>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs font-semibold text-slate-500">NAME:</span>
                                    <span className="text-sm font-medium text-slate-800">{showCredentials.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs font-semibold text-slate-500">EMAIL:</span>
                                    <span className="text-sm font-medium text-slate-800">{showCredentials.email}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs font-semibold text-slate-500">PASSWORD:</span>
                                    <code className="text-sm font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                        {showCredentials.password}
                                    </code>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs font-semibold text-slate-500">SCHOOL:</span>
                                    <span className="text-sm text-slate-800">{showCredentials.schoolName || showCredentials.school} ({showCredentials.schoolCode})</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-500">ROLE:</span>
                                    <span className="text-sm capitalize">{showCredentials.userTypeDisplay || showCredentials.userType || showCredentials.role}</span>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => {
                                        const credText = `Email: ${showCredentials.email}\nPassword: ${showCredentials.password}\nSchool Code: ${showCredentials.schoolCode}\nLogin: ${showCredentials.loginUrl}`;
                                        navigator.clipboard.writeText(credText);
                                        setMessage({ type: "success", text: "Credentials copied to clipboard!" });
                                    }}
                                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm transition"
                                >
                                    📋 Copy All
                                </button>
                                <button
                                    onClick={() => setShowCredentials(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold text-sm transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                <div className="relative px-5 py-5 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">👥</span>
                                <h1 className="text-xl md:text-2xl font-bold text-white">User Management</h1>
                            </div>
                            <p className="text-slate-300 text-xs mt-1">Manage system users across all schools</p>
                        </div>
                        <button 
                            onClick={() => setShowForm(!showForm)} 
                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
                        >
                            <span className="text-lg">{showForm ? "✕" : "+"}</span>
                            {showForm ? "Close Form" : "Add User"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                    </div>
                    <select
                        value={filterUserType}
                        onChange={(e) => setFilterUserType(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    >
                        <option value="">All User Types</option>
                        {userTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    >
                        <option value="">All Status</option>
                        <option value="active">✅ Active</option>
                        <option value="inactive">❌ Inactive</option>
                    </select>
                </div>
            </div>

            {/* Add User Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">➕</span>
                            <h2 className="text-sm font-semibold text-slate-800">Add New User</h2>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                                <input
                                    type="text"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    placeholder="Leave empty to auto-generate"
                                />
                                <p className="text-xs text-slate-400 mt-1">Auto-generates strong password if left empty</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">School *</label>
                                <select
                                    value={form.schoolId}
                                    onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select School</option>
                                    {schools.map((school) => (
                                        <option key={school._id} value={school._id}>
                                            🏫 {school.name} ({school.schoolCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">User Type *</label>
                                <select
                                    value={form.userType}
                                    onChange={(e) => {
                                        const newUserType = e.target.value;
                                        let newRole = "staff";
                                        if (newUserType === "school_admin") newRole = "admin";
                                        else if (newUserType === "teacher") newRole = "manager";
                                        else if (newUserType === "bursar") newRole = "manager";
                                        else if (newUserType === "stock_keeper") newRole = "staff";
                                        else if (newUserType === "customer_care") newRole = "staff";
                                        else if (newUserType === "viewer") newRole = "viewer";
                                        setForm({ ...form, userType: newUserType, role: newRole });
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                >
                                    {userTypes.filter(t => t.value !== "superadmin").map(type => (
                                        <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5 pt-3 border-t border-slate-100">
                            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                                {loading ? "Creating..." : "Create User"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Results Count */}
            {users.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-3">
                    <p className="text-xs text-slate-500">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, users.length)} of {users.length} users
                    </p>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-3">👥</div>
                        <p className="text-slate-500 text-sm">No users found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">User</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">School</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentUsers.map((user) => {
                                        const userTypeInfo = getUserTypeInfo(user.userType);
                                        return (
                                            <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full bg-${userTypeInfo.color}-100 flex items-center justify-center`}>
                                                            <span className="text-sm">{userTypeInfo.icon}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800 text-sm">{user.name}</p>
                                                            {user.userType === "school_admin" && <span className="text-xs text-indigo-600">(School Admin)</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-slate-600">{user.email}</td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs">🏫</span>
                                                        <span className="text-xs text-slate-600">{user.school?.name || "-"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <select
                                                        value={user.userType || user.role}
                                                        onChange={(e) => {
                                                            const newType = e.target.value;
                                                            let newRole = "staff";
                                                            if (newType === "school_admin") newRole = "admin";
                                                            else if (newType === "teacher") newRole = "manager";
                                                            else if (newType === "bursar") newRole = "manager";
                                                            else if (newType === "stock_keeper") newRole = "staff";
                                                            else if (newType === "customer_care") newRole = "staff";
                                                            else if (newType === "viewer") newRole = "viewer";
                                                            handleRoleChange(user._id, newType, newRole);
                                                        }}
                                                        className={`px-2 py-1 rounded-lg text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-400 bg-${userTypeInfo.color}-100 text-${userTypeInfo.color}-700`}
                                                    >
                                                        {userTypes.map(type => (
                                                            <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                                        {user.isActive ? "✅ Active" : "❌ Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <div className="flex gap-1 justify-center flex-wrap">
                                                        <button
                                                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                                                            className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                                                                user.isActive 
                                                                    ? "bg-rose-600 hover:bg-rose-700 text-white" 
                                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            }`}
                                                        >
                                                            {user.isActive ? "Deactivate" : "Activate"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(user._id, user.name)}
                                                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition"
                                                        >
                                                            🔄 Reset
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user._id, user.name)}
                                                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition"
                                                        >
                                                            🗑️ Delete
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