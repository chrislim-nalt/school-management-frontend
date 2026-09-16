import { useEffect, useState } from "react";
import { 
    getRecords, 
    createRecord, 
    updateRecord, 
    deleteRecord,
    getStockSummary,
    getDashboardStats,
    generateReport 
} from "../services/feedingService";
import { exportToPDF, exportToExcel } from "../services/exportService";

// Helper function to format date correctly (YYYY-MM-DD)
const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to format date for display (DD/MM/YYYY)
const formatDisplayDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

export default function FeedingRecords() {
    const [records, setRecords] = useState([]);
    const [stockSummary, setStockSummary] = useState([]);
    const [stats, setStats] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);
    const [reportData, setReportData] = useState(null);
    const [reportType, setReportType] = useState("weekly");
    const [dateRange, setDateRange] = useState({
        startDate: (() => {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            return date.toISOString().split('T')[0];
        })(),
        endDate: new Date().toISOString().split('T')[0],
    });

    const [form, setForm] = useState({
        itemName: "",
        category: "Grains",
        unit: "kg",
        date: new Date().toISOString().split('T')[0],
        quantityReceived: "",
        quantityUsed: "",
        supplier: "",
        receivedBy: "",
        purpose: "Other",
        reference: "",
        notes: "",
    });

    const categories = ["Grains", "Vegetables", "Fruits", "Proteins", "Dairy", "Beverages", "Oils", "Spices", "Other"];
    const units = ["kg", "g", "l", "ml", "pcs", "bags", "crates", "bottles", "cartons", "sacks"];
    const purposes = ["Breakfast", "Lunch", "Dinner", "Snack", "Special Event", "Emergency", "Other"];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recordsRes, summaryRes, statsRes] = await Promise.all([
                getRecords(),
                getStockSummary(),
                getDashboardStats()
            ]);
            setRecords(recordsRes.data || []);
            setStockSummary(summaryRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter records
    const filteredRecords = records.filter(record => {
        const matchesSearch = !searchTerm || 
            record.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || record.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedCategory("ALL");
    };

    // Generate Report
    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const res = await generateReport({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            });
            setReportData(res.data);
            setShowReportModal(true);
        } catch (error) {
            setError("Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    const setWeeklyRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        });
        setReportType("weekly");
    };

    const setMonthlyRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        });
        setReportType("monthly");
    };

    const exportReportToPDF = () => {
        if (!reportData) return;
        const reportColumns = [
            { key: "itemName", label: "Item Name" },
            { key: "unit", label: "Unit" },
            { key: "totalReceived", label: "Total Received" },
            { key: "totalUsed", label: "Total Used" },
        ];
        const reportTitle = `${reportType.toUpperCase()} Feeding Report - ${formatDisplayDate(dateRange.startDate)} to ${formatDisplayDate(dateRange.endDate)}`;
        exportToPDF(reportData.records, reportColumns, reportTitle, `feeding_report_${reportType}_${Date.now()}`);
        setSuccess("PDF exported successfully!");
        setTimeout(() => setSuccess(""), 3000);
    };

    const exportReportToExcel = () => {
        if (!reportData) return;
        const reportColumns = [
            { key: "itemName", label: "Item Name" },
            { key: "unit", label: "Unit" },
            { key: "totalReceived", label: "Total Received" },
            { key: "totalUsed", label: "Total Used" },
        ];
        exportToExcel(reportData.records, reportColumns, `feeding_report_${reportType}_${Date.now()}`);
        setSuccess("Excel exported successfully!");
        setTimeout(() => setSuccess(""), 3000);
    };

    const resetForm = () => {
        setForm({
            itemName: "",
            category: "Grains",
            unit: "kg",
            date: new Date().toISOString().split('T')[0],
            quantityReceived: "",
            quantityUsed: "",
            supplier: "",
            receivedBy: "",
            purpose: "Other",
            reference: "",
            notes: "",
        });
        setEditingId(null);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.itemName.trim()) {
            setError("Item name is required");
            return;
        }
        
        const received = parseFloat(form.quantityReceived) || 0;
        const used = parseFloat(form.quantityUsed) || 0;
        
        if (received === 0 && used === 0) {
            setError("Please enter either quantity received OR quantity used");
            return;
        }
        
        setLoading(true);
        try {
            if (editingId) {
                await updateRecord(editingId, form);
                setSuccess("Record updated successfully!");
            } else {
                await createRecord(form);
                setSuccess("Record added successfully!");
            }
            resetForm();
            setShowForm(false);
            fetchData();
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save record");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setForm({
            itemName: record.itemName,
            category: record.category || "Grains",
            unit: record.unit || "kg",
            date: formatDate(record.date),
            quantityReceived: record.quantityReceived || "",
            quantityUsed: record.quantityUsed || "",
            supplier: record.supplier || "",
            receivedBy: record.receivedBy || "",
            purpose: record.purpose || "Other",
            reference: record.reference || "",
            notes: record.notes || "",
        });
        setEditingId(record._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            setLoading(true);
            try {
                await deleteRecord(id);
                setSuccess("Record deleted successfully!");
                fetchData();
                setTimeout(() => setSuccess(""), 3000);
            } catch (error) {
                setError("Failed to delete record");
                setLoading(false);
            }
        }
    };

    const getCategoryIcon = (category) => {
        const icons = {
            "Grains": "🌾",
            "Vegetables": "🥬",
            "Fruits": "🍎",
            "Proteins": "🥩",
            "Dairy": "🥛",
            "Beverages": "🧃",
            "Oils": "🫒",
            "Spices": "🌶️",
            "Other": "📦"
        };
        return icons[category] || "🍽️";
    };

    const getPurposeIcon = (purpose) => {
        const icons = {
            "Breakfast": "🍳",
            "Lunch": "🍲",
            "Dinner": "🍽️",
            "Snack": "🍪",
            "Special Event": "🎉",
            "Emergency": "🚨",
            "Other": "📋"
        };
        return icons[purpose] || "🍽️";
    };

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
        <div className="space-y-3 sm:space-y-4 px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
            
            {/* Toast Messages */}
            {(success || error) && (
                <div className={`fixed top-16 sm:top-20 right-2 sm:right-4 z-50 animate-slide-in ${
                    success ? "bg-emerald-500" : "bg-rose-500"
                } text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm max-w-[90vw] sm:max-w-xs`}>
                    <span className="text-base sm:text-lg flex-shrink-0">{success ? "✓" : "⚠"}</span>
                    <p className="font-medium truncate">{success || error}</p>
                </div>
            )}

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl shadow-xl">
                <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-tr from-orange-500/10 to-amber-500/10 rounded-full blur-3xl"></div>
                
                <div className="relative px-3 sm:px-5 md:px-6 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-full sm:w-auto">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                                🍽️ School Feeding Records
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm">
                                Record food receipts, usage, and track inventory in one place
                            </p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="group w-full sm:w-auto bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold border border-white/20 hover:scale-105 shadow-lg text-xs sm:text-sm"
                        >
                            <span className="text-lg sm:text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
                            New Record
                        </button>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
                            <div className="bg-white/5 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 hover:bg-white/10 transition-all">
                                <p className="text-slate-300 text-[10px] sm:text-xs">Total Items</p>
                                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-white mt-0.5 sm:mt-1">{stats.totalItems || 0}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 hover:bg-white/10 transition-all">
                                <p className="text-slate-300 text-[10px] sm:text-xs">Today's Received</p>
                                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-emerald-400 mt-0.5 sm:mt-1">📥 {stats.todayReceived || 0}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 hover:bg-white/10 transition-all">
                                <p className="text-slate-300 text-[10px] sm:text-xs">Today's Used</p>
                                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-400 mt-0.5 sm:mt-1">📤 {stats.todayUsed || 0}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 hover:bg-white/10 transition-all">
                                <p className="text-slate-300 text-[10px] sm:text-xs">Low Stock</p>
                                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-rose-400 mt-0.5 sm:mt-1">⚠️ {stats.lowStockCount || 0}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alert */}
            {stats?.lowStockCount > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-start gap-2">
                        <span className="text-amber-500 text-base sm:text-lg flex-shrink-0 mt-0.5">⚠️</span>
                        <div className="min-w-0">
                            <p className="font-semibold text-amber-800 text-xs sm:text-sm">Low Stock Alert</p>
                            <p className="text-[10px] sm:text-xs text-amber-700 break-words">
                                {stats.lowStockItems?.slice(0, 3).map(item => `${item.itemName} (${item.balance} ${item.unit})`).join(", ")}
                                {stats.lowStockItems?.length > 3 && ` +${stats.lowStockItems.length - 3} more`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Section */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-xs sm:text-sm">📊</span>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-semibold text-slate-800 text-xs sm:text-sm">Generate Report</h2>
                        <p className="text-[10px] sm:text-xs text-slate-400">Get detailed weekly or monthly consumption reports</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="flex flex-col xs:flex-row gap-2">
                        <button
                            onClick={setWeeklyRange}
                            className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                        >
                            📅 Last 7 Days
                        </button>
                        <button
                            onClick={setMonthlyRange}
                            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                        >
                            📆 Last 30 Days
                        </button>
                    </div>
                    
                    <div className="md:col-span-2">
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <span>📈</span>
                    {loading ? "Generating..." : "Generate Report"}
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    <div className="sm:col-span-2">
                        <div className="relative">
                            <span className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs sm:text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by item name, supplier, or receiver..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                            />
                        </div>
                    </div>
                    
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    >
                        <option value="ALL">📂 All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                {(searchTerm || selectedCategory !== "ALL") && (
                    <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <span className="text-[10px] sm:text-xs text-slate-500">Found {filteredRecords.length} record(s)</span>
                        <button onClick={resetFilters} className="text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-700">Clear Filters ✕</button>
                    </div>
                )}
            </div>

            {/* Results Count */}
            {filteredRecords.length > 0 && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-2.5 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-slate-500">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} records
                    </p>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && reportData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={() => setShowReportModal(false)}>
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-4xl my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-3 sm:px-5 py-2.5 sm:py-3 flex justify-between items-center text-white rounded-t-lg sm:rounded-t-xl">
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5 sm:gap-2">
                                    <span>📊</span>
                                    <span className="truncate">{reportType.toUpperCase()} Consumption Report</span>
                                </h2>
                                <p className="text-[10px] sm:text-xs opacity-90 mt-0.5 truncate">
                                    📅 {formatDisplayDate(reportData.period?.start)} - {formatDisplayDate(reportData.period?.end)}
                                </p>
                            </div>
                            <button onClick={() => setShowReportModal(false)} className="text-white hover:text-gray-200 text-xl sm:text-2xl flex-shrink-0 ml-2">&times;</button>
                        </div>
                        
                        <div className="p-3 sm:p-5">
                            {/* Report Summary Cards */}
                            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                                <div className="bg-blue-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] sm:text-xs text-blue-600">📦 Total Items</p>
                                    <p className="text-base sm:text-xl font-bold text-blue-700">{reportData.summary?.totalItems || 0}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] sm:text-xs text-emerald-600">📥 Total Received</p>
                                    <p className="text-base sm:text-xl font-bold text-emerald-700">{reportData.summary?.totalReceived || 0}</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] sm:text-xs text-amber-600">📤 Total Used</p>
                                    <p className="text-base sm:text-xl font-bold text-amber-700">{reportData.summary?.totalUsed || 0}</p>
                                </div>
                            </div>
                            
                            {/* Report Table - Responsive */}
                            <div className="overflow-x-auto -mx-3 sm:mx-0">
                                <div className="inline-block min-w-full align-middle">
                                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600">Item Name</th>
                                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600">Unit</th>
                                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600">Received</th>
                                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600">Used</th>
                                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600">Net</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {reportData.records?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-800">{item.itemName}</td>
                                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600">{item.unit}</td>
                                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-right text-emerald-600 font-semibold">📥 {item.totalReceived}</td>
                                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-right text-amber-600 font-semibold">📤 {item.totalUsed}</td>
                                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-right font-bold text-indigo-600">
                                                        {item.totalReceived - item.totalUsed}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* Export Buttons */}
                            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100">
                                <button
                                    onClick={exportReportToPDF}
                                    className="flex-1 bg-rose-600 text-white px-3 py-2 rounded-lg hover:bg-rose-700 transition text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    📄 Export PDF
                                </button>
                                <button
                                    onClick={exportReportToExcel}
                                    className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    📊 Export Excel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && !showForm && records.length === 0 ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 text-center">
                    <div className="text-4xl sm:text-6xl mb-3 animate-float">🍽️</div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">No records found</h3>
                    <p className="text-slate-500 text-xs sm:text-sm mb-4">Get started by adding your first feeding record</p>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg transition-all"
                    >
                        ✨ Add Your First Record
                    </button>
                </div>
            ) : (
                /* Records Table - Responsive with horizontal scroll */
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                    <tr>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">📅 Date</th>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">🍽️ Item</th>
                                        <th className="px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">📥 Received</th>
                                        <th className="px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">📤 Used</th>
                                        <th className="px-2 sm:px-3 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">⚖️ Balance</th>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">🏪 Supplier</th>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">👤 Received By</th>
                                        <th className="px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">🎯 Purpose</th>
                                        <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">⚙️ Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentItems.map((record) => {
                                        const isLow = record.remainingBalance <= 10 && record.remainingBalance > 0;
                                        return (
                                            <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-slate-600 text-[10px] sm:text-xs">
                                                    📅 {formatDisplayDate(record.date)}
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                                                    <span className="font-medium text-slate-800 text-xs sm:text-sm">
                                                        {getCategoryIcon(record.category)} {record.itemName}
                                                    </span>
                                                    <span className="text-[10px] sm:text-xs text-slate-400 ml-1">({record.unit})</span>
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-right text-emerald-600 font-semibold text-xs sm:text-sm">
                                                    📥 {record.quantityReceived || 0}
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-right text-amber-600 font-semibold text-xs sm:text-sm">
                                                    📤 {record.quantityUsed || 0}
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-right">
                                                    <span className={`font-semibold text-xs sm:text-sm ${isLow ? 'text-amber-500' : 'text-indigo-600'}`}>
                                                        ⚖️ {record.remainingBalance}
                                                    </span>
                                                    {isLow && <span className="ml-1 text-[10px] sm:text-xs text-amber-500">⚠️ Low</span>}
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-slate-600 text-[10px] sm:text-xs">
                                                    🏪 {record.supplier || "-"}
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-slate-600 text-[10px] sm:text-xs">
                                                    👤 {record.receivedBy || "-"}
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-slate-100 text-slate-600">
                                                        {getPurposeIcon(record.purpose)} {record.purpose}
                                                    </span>
                                                </td>
                                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleEdit(record)} className="p-1 rounded hover:bg-indigo-50 text-indigo-600 text-xs sm:text-sm transition-all" title="Edit">✏️</button>
                                                        <button onClick={() => handleDelete(record._id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 text-xs sm:text-sm transition-all" title="Delete">🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-2 sm:px-3 py-2 border-t border-slate-200 bg-slate-50">
                            <div className="flex flex-col xs:flex-row justify-between items-center gap-2">
                                <div className="text-[10px] sm:text-xs text-slate-500">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition flex items-center gap-1 ${
                                            currentPage === 1
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                                        }`}
                                    >
                                        ◀
                                    </button>
                                    
                                    <div className="flex gap-0.5 sm:gap-1">
                                        {getPageNumbers().map((page, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded text-[10px] sm:text-xs font-medium transition ${
                                                    currentPage === page
                                                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                                                        : page === '...'
                                                        ? "text-slate-400 cursor-default"
                                                        : "bg-white text-slate-700 hover:bg-slate-100"
                                                }`}
                                                disabled={page === '...'}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition flex items-center gap-1 ${
                                            currentPage === totalPages
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                                        }`}
                                    >
                                        ▶
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Form Modal - Fully Responsive */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-3 sm:px-5 py-2.5 sm:py-3 flex justify-between items-center z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs sm:text-sm">{editingId ? "✏️" : "➕"}</span>
                                </div>
                                <h2 className="text-sm sm:text-lg font-bold text-slate-800 truncate">{editingId ? "Edit Record" : "New Feeding Record"}</h2>
                            </div>
                            <button onClick={() => { resetForm(); setShowForm(false); }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-slate-100 text-slate-400 text-lg sm:text-xl flex items-center justify-center flex-shrink-0">
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-3 sm:p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">🍽️ Item Name</label>
                                    <input
                                        type="text"
                                        value={form.itemName}
                                        onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                        placeholder="e.g., Rice, Beans, Cooking Oil, Milk"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">📂 Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">📏 Unit</label>
                                    <select
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    >
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">📅 Date</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">🎯 Purpose</label>
                                    <select
                                        value={form.purpose}
                                        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    >
                                        {purposes.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">📥 Quantity Received</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.quantityReceived}
                                        onChange={(e) => setForm({ ...form, quantityReceived: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">📤 Quantity Used</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.quantityUsed}
                                        onChange={(e) => setForm({ ...form, quantityUsed: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">🏪 Supplier / Source</label>
                                    <input
                                        type="text"
                                        value={form.supplier}
                                        onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                        placeholder="e.g., Local Market, Donation"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">👤 Received By</label>
                                    <input
                                        type="text"
                                        value={form.receivedBy}
                                        onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                        placeholder="Person who received/issued"
                                    />
                                </div>
                                
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">📄 Reference / Invoice #</label>
                                    <input
                                        type="text"
                                        value={form.reference}
                                        onChange={(e) => setForm({ ...form, reference: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                        placeholder="e.g., INV-001, PO-123"
                                    />
                                </div>
                                
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">📝 Notes</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
                                        rows="2"
                                        placeholder="Additional information..."
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100">
                                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                    💾 {loading ? "Saving..." : (editingId ? "Update Record" : "Save Record")}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="flex-1 bg-slate-100 text-slate-700 px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-all text-xs sm:text-sm">
                                    ❌ Cancel
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
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                /* Custom breakpoint for very small devices */
                @media (min-width: 480px) {
                    .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .xs\\:flex-row { flex-direction: row; }
                    .xs\\:items-center { align-items: center; }
                    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
}