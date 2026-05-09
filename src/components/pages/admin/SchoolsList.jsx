import { useEffect, useState } from "react";
import API from "../../services/api";
import { Link } from "react-router-dom";

export default function SchoolsList() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchSchools();
    }, [filter, search]);

    const fetchSchools = async () => {
        try {
            const params = {};
            if (filter !== "all") params.status = filter;
            if (search) params.search = search;
            
            const res = await API.get("/admin/schools", { params });
            setSchools(res.data);
        } catch (error) {
            console.error("Error fetching schools:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (window.confirm("Approve this school?")) {
            await API.put(`/admin/schools/${id}/approve`);
            fetchSchools();
        }
    };

    const handleSuspend = async (id) => {
        const reason = prompt("Reason for suspension:");
        if (reason) {
            await API.put(`/admin/schools/${id}/suspend`, { reason });
            fetchSchools();
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Reason for rejection:");
        if (reason) {
            await API.put(`/admin/schools/${id}/reject`, { reason });
            fetchSchools();
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            active: "bg-green-100 text-green-800",
            suspended: "bg-red-100 text-red-800",
            rejected: "bg-gray-100 text-gray-800"
        };
        return styles[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
                <Link to="/admin/schools/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add School
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-3 py-1 rounded-lg text-sm ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("pending")}
                            className={`px-3 py-1 rounded-lg text-sm ${filter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-200"}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter("active")}
                            className={`px-3 py-1 rounded-lg text-sm ${filter === "active" ? "bg-green-600 text-white" : "bg-gray-200"}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter("suspended")}
                            className={`px-3 py-1 rounded-lg text-sm ${filter === "suspended" ? "bg-red-600 text-white" : "bg-gray-200"}`}
                        >
                            Suspended
                        </button>
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by name, email, or school code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border rounded-lg px-3 py-1.5 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Schools Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {schools.map((school) => (
                                    <tr key={school._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium">{school.name}</td>
                                        <td className="px-6 py-4 text-sm font-mono">{school.schoolCode}</td>
                                        <td className="px-6 py-4 text-sm">{school.email}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(school.status)}`}>
                                                {school.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{new Date(school.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                                            {school.status === "pending" && (
                                                <>
                                                    <button onClick={() => handleApprove(school._id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs mr-1">
                                                        Approve
                                                    </button>
                                                    <button onClick={() => handleReject(school._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {school.status === "active" && (
                                                <button onClick={() => handleSuspend(school._id)} className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
                                                    Suspend
                                                </button>
                                            )}
                                            <Link to={`/admin/schools/${school._id}`} className="text-blue-600 hover:text-blue-800 ml-2">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {schools.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">No schools found.</div>
                )}
            </div>
        </div>
    );
}