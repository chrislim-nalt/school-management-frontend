import { useEffect, useState } from "react";
import { getItems } from "../services/itemService";
import { getCategories } from "../services/categoryService";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "../services/stockService";
import DownloadButton from "../DownloadButton";

export default function Stock() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterItem, setFilterItem] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // For category-based item selection
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredItemsByCategory, setFilteredItemsByCategory] = useState([]);

  const [form, setForm] = useState({
    item: "",
    type: "IN",
    quantity: "",
    date: new Date().toISOString().split('T')[0],
    reference: "",
    purpose: "",
    borrowerName: "",
    borrowerDepartment: "Classroom",
    borrowedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemRes, transRes, catRes] = await Promise.all([
        getItems(),
        getTransactions(),
        getCategories()
      ]);
      setItems(itemRes.data || []);
      setCategories(catRes.data || []);
      
      let transactionsData = transRes.data || [];
      if (filterItem) {
        transactionsData = transactionsData.filter(t => t.item?._id === filterItem);
      }
      if (filterType !== "ALL") {
        transactionsData = transactionsData.filter(t => t.type === filterType);
      }
      if (filterCategory) {
        transactionsData = transactionsData.filter(t => t.item?.category?._id === filterCategory);
      }
      // Sort by date descending (newest first)
      transactionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(transactionsData);
      setError("");
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Update filtered items when category or items change
  useEffect(() => {
    if (selectedCategory) {
      const filtered = items.filter(item => item.category?._id === selectedCategory);
      setFilteredItemsByCategory(filtered);
    } else {
      setFilteredItemsByCategory([]);
    }
    setForm(prev => ({ ...prev, item: "" }));
  }, [selectedCategory, items]);

  useEffect(() => {
    fetchData();
  }, [filterItem, filterType, filterCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterItem, filterType, filterCategory]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const resetFilters = () => {
    setFilterItem("");
    setFilterType("ALL");
    setFilterCategory("");
  };

  const resetForm = () => {
    setSelectedCategory("");
    setFilteredItemsByCategory([]);
    setForm({
      item: "",
      type: "IN",
      quantity: "",
      date: new Date().toISOString().split('T')[0],
      reference: "",
      purpose: "",
      borrowerName: "",
      borrowerDepartment: "Classroom",
      borrowedDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.item) {
      setError("Please select an item");
      return;
    }
    if (!form.quantity || form.quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    if (form.type === "BORROW" && !form.borrowerName) {
      setError("Please enter borrower name for borrow transaction");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const submitData = {
        item: form.item,
        type: form.type,
        quantity: form.quantity,
        date: form.type === "BORROW" ? form.borrowedDate : form.date,
        reference: form.reference,
        purpose: form.purpose,
      };
      
      if (form.type === "BORROW") {
        submitData.borrowerName = form.borrowerName;
        submitData.borrowerDepartment = form.borrowerDepartment;
        submitData.expectedReturnDate = form.expectedReturnDate;
      }
      
      if (editingId) {
        await updateTransaction(editingId, submitData);
        setSuccess("Transaction updated successfully!");
      } else {
        await createTransaction(submitData);
        setSuccess("Transaction added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving transaction:", error);
      setError(error.response?.data?.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction) => {
    const itemCategory = transaction.item?.category?._id;
    if (itemCategory) {
      setSelectedCategory(itemCategory);
    }
    setForm({
      item: transaction.item?._id,
      type: transaction.type,
      quantity: transaction.quantity,
      date: new Date(transaction.date).toISOString().split('T')[0],
      reference: transaction.reference || "",
      purpose: transaction.purpose || "",
      borrowerName: transaction.borrowerName || "",
      borrowerDepartment: transaction.borrowerDepartment || "Classroom",
      borrowedDate: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedReturnDate: transaction.expectedReturnDate 
        ? new Date(transaction.expectedReturnDate).toISOString().split('T')[0]
        : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    setEditingId(transaction._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setLoading(true);
      try {
        await deleteTransaction(id);
        setSuccess("Transaction deleted successfully!");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        setError("Failed to delete transaction");
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const getCurrentStock = (itemId) => {
    const item = items.find(i => i._id === itemId);
    return item?.currentQuantity || 0;
  };

  const getItemDetails = (itemId) => {
    return items.find(i => i._id === itemId);
  };

  const getSummaryStats = () => {
    let totalIn = 0, totalOut = 0, totalBorrow = 0, totalReturn = 0;
    transactions.forEach(t => {
      if (t.type === "IN") totalIn += t.quantity;
      else if (t.type === "OUT") totalOut += t.quantity;
      else if (t.type === "BORROW") totalBorrow += t.quantity;
      else if (t.type === "RETURN") totalReturn += t.quantity;
    });
    return { totalIn, totalOut, totalBorrow, totalReturn, 
      balance: totalIn - totalOut - totalBorrow + totalReturn };
  };

  const stats = getSummaryStats();

  const getTransactionIcon = (type) => {
    switch(type) {
      case "IN": return "📥";
      case "OUT": return "📤";
      case "BORROW": return "📋";
      case "RETURN": return "🔄";
      default: return "📦";
    }
  };

  const getTransactionColor = (type) => {
    switch(type) {
      case "IN": return "bg-emerald-100 text-emerald-700";
      case "OUT": return "bg-rose-100 text-rose-700";
      case "BORROW": return "bg-amber-100 text-amber-700";
      case "RETURN": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getTransactionGradient = (type) => {
    switch(type) {
      case "IN": return "from-emerald-500 to-emerald-600";
      case "OUT": return "from-rose-500 to-rose-600";
      case "BORROW": return "from-amber-500 to-amber-600";
      case "RETURN": return "from-blue-500 to-blue-600";
      default: return "from-slate-500 to-slate-600";
    }
  };

  const getTransactionDescription = (transaction) => {
    const itemName = transaction.item?.name || "Unknown item";
    const quantity = transaction.quantity;
    const unit = transaction.item?.unit || "units";
    
    switch(transaction.type) {
      case "IN":
        return `Added ${quantity} ${unit} of ${itemName} to inventory`;
      case "OUT":
        return `Removed ${quantity} ${unit} of ${itemName} from inventory`;
      case "BORROW":
        return `Borrowed ${quantity} ${unit} of ${itemName} - Due for return`;
      case "RETURN":
        return `Returned ${quantity} ${unit} of ${itemName} to inventory`;
      default:
        return `Transaction for ${itemName}`;
    }
  };

  const getStatusBadge = (transaction) => {
    if (transaction.type !== "BORROW") return null;
    
    const expectedDate = new Date(transaction.expectedReturnDate);
    const today = new Date();
    const isOverdue = expectedDate < today;
    
    if (isOverdue) {
      return { text: "OVERDUE", color: "bg-rose-600 text-white" };
    }
    const daysLeft = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      return { text: `Due in ${daysLeft} days`, color: "bg-amber-500 text-white" };
    }
    return { text: `Due in ${daysLeft} days`, color: "bg-emerald-500 text-white" };
  };

  // Prepare export data for transactions
  const exportData = transactions.map(transaction => ({
    date: new Date(transaction.date).toLocaleDateString('en-GB'),
    time: new Date(transaction.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    category: transaction.item?.category?.name || "-",
    itemName: transaction.item?.name || "-",
    location: transaction.item?.location || "-",
    type: transaction.type === "IN" ? "Stock IN" : 
           transaction.type === "OUT" ? "Stock OUT" : 
           transaction.type === "BORROW" ? "Borrowed" : "Returned",
    quantity: transaction.quantity,
    unit: transaction.item?.unit || "-",
    description: getTransactionDescription(transaction),
    borrowerName: transaction.borrowerName || "-",
    borrowerDepartment: transaction.borrowerDepartment || "-",
    expectedReturnDate: transaction.expectedReturnDate ? new Date(transaction.expectedReturnDate).toLocaleDateString('en-GB') : "-",
    purpose: transaction.purpose || "-",
    reference: transaction.reference || "-",
    performedBy: transaction.performedBy || "System"
  }));

  const exportColumns = [
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "category", label: "Category" },
    { key: "itemName", label: "Item Name" },
    { key: "location", label: "Location" },
    { key: "type", label: "Transaction Type" },
    { key: "quantity", label: "Quantity" },
    { key: "unit", label: "Unit" },
    { key: "description", label: "Description" },
    { key: "borrowerName", label: "Borrower Name" },
    { key: "borrowerDepartment", label: "Department" },
    { key: "expectedReturnDate", label: "Expected Return Date" },
    { key: "purpose", label: "Purpose" },
    { key: "reference", label: "Reference" },
    { key: "performedBy", label: "Performed By" }
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

  return (
    <div className="space-y-4">
      
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
          success ? "bg-emerald-500" : "bg-rose-500"
        } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm`}>
          <span className="text-lg">{success ? "✓" : "⚠"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                📦 Stock Management
              </h1>
              <p className="text-slate-300 text-sm">
                Track inventory movements: Stock IN, Stock OUT, Borrow, and Return
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="group bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-white/20 hover:scale-105 shadow-lg text-sm"
            >
              <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
              Add Transaction
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">📥 Stock IN</p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1">{stats.totalIn}</p>
              <p className="text-xs text-slate-400 mt-1">items added</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">📤 Stock OUT</p>
              <p className="text-2xl md:text-3xl font-bold text-rose-400 mt-1">{stats.totalOut}</p>
              <p className="text-xs text-slate-400 mt-1">items removed</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">📋 Borrowed</p>
              <p className="text-2xl md:text-3xl font-bold text-amber-400 mt-1">{stats.totalBorrow}</p>
              <p className="text-xs text-slate-400 mt-1">currently out</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">🔄 Returned</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-400 mt-1">{stats.totalReturn}</p>
              <p className="text-xs text-slate-400 mt-1">items back</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">⚖️ Net Balance</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-400 mt-1">{stats.balance}</p>
              <p className="text-xs text-slate-400 mt-1">current stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span>📥</span> Export Transactions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export filtered transactions to PDF, Excel, or CSV
              </p>
            </div>
            <DownloadButton
              data={exportData}
              columns={exportColumns}
              title="School Inventory - Stock Transactions Report"
              filename={`stock_transactions_${new Date().toISOString().slice(0, 10)}`}
              variant="primary"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">📁 Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            >
              <option value="">📂 All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">🔍 Filter by Item</label>
            <select
              value={filterItem}
              onChange={(e) => setFilterItem(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              disabled={!filterCategory}
            >
              <option value="">📦 All Items</option>
              {items
                .filter(item => !filterCategory || item.category?._id === filterCategory)
                .map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} (Stock: {getCurrentStock(i._id)} {i.unit})
                  </option>
                ))}
            </select>
            {!filterCategory && (
              <p className="text-xs text-amber-500 mt-1">⚠️ Select a category first to filter items</p>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">🏷️ Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            >
              <option value="ALL">📋 All Types</option>
              <option value="IN">📥 Stock IN - Received items</option>
              <option value="OUT">📤 Stock OUT - Used items</option>
              <option value="BORROW">📋 Borrow - Items taken out</option>
              <option value="RETURN">🔄 Return - Items brought back</option>
            </select>
          </div>
        </div>
        
        {(filterCategory || filterItem || filterType !== "ALL") && (
          <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-all flex items-center gap-1"
            >
              ✕ Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-3">
          <p className="text-xs text-slate-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && !showForm && transactions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3 animate-float">📦</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No transactions yet</h3>
          <p className="text-slate-500 text-sm mb-4">Get started by adding your first stock transaction</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            ✨ Add Transaction
          </button>
        </div>
      ) : (
        /* Transactions Table - Professional Design */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">📅 Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">📁 Category</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">📦 Item</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">🏷️ Type</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">🔢 Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">📝 Description</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">👤 Borrower</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">⚙️ Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((t) => {
                  const statusBadge = getStatusBadge(t);
                  return (
                    <tr key={t._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-700 text-sm">
                            {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(t.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-base">{t.item?.category?.icon || "📦"}</span>
                          <span className="text-sm text-slate-600">{t.item?.category?.name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm">{t.item?.name}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>📍 {t.item?.location || "-"}</span>
                            <span>📏 {t.item?.unit || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getTransactionColor(t.type)}`}>
                          {getTransactionIcon(t.type)} {t.type === "IN" ? "Stock IN" : t.type === "OUT" ? "Stock OUT" : t.type === "BORROW" ? "Borrowed" : "Returned"}
                        </span>
                        {statusBadge && (
                          <div className={`mt-1 text-center px-1.5 py-0.5 rounded text-[10px] font-bold ${statusBadge.color}`}>
                            {statusBadge.text}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-lg font-bold ${
                            t.type === "IN" ? "text-emerald-600" : 
                            t.type === "OUT" ? "text-rose-600" : 
                            t.type === "BORROW" ? "text-amber-600" : "text-blue-600"
                          }`}>
                            {t.quantity}
                          </span>
                          <span className="text-xs text-slate-400">{t.item?.unit}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="max-w-xs">
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {getTransactionDescription(t)}
                          </p>
                          {t.purpose && (
                            <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                              🎯 {t.purpose}
                            </div>
                          )}
                          {t.reference && (
                            <div className="mt-1 text-[10px] text-slate-400">
                              Ref: {t.reference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {t.type === "BORROW" ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="text-sm">👤</span>
                              <span className="text-sm font-medium text-slate-700">{t.borrowerName || "-"}</span>
                            </div>
                            {t.borrowerDepartment && (
                              <span className="text-xs text-slate-400 mt-0.5">🏢 {t.borrowerDepartment}</span>
                            )}
                            {t.expectedReturnDate && (
                              <div className="flex items-center gap-1 mt-1 text-[10px]">
                                <span>📅</span>
                                <span className="text-slate-500">
                                  Return by: {new Date(t.expectedReturnDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleViewDetails(t)} 
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-all group-hover:scale-105"
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button 
                            onClick={() => handleEdit(t)} 
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-all group-hover:scale-105"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(t._id)} 
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-all group-hover:scale-105"
                            title="Delete"
                          >
                            🗑️
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
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                      currentPage === 1
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                    }`}
                  >
                    ◀ Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {getPageNumbers().map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        className={`w-7 h-7 rounded text-xs font-medium transition ${
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
                    className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                      currentPage === totalPages
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                    }`}
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className={`sticky top-0 bg-gradient-to-r ${getTransactionGradient(selectedTransaction.type)} px-5 py-3 flex justify-between items-center text-white rounded-t-xl`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getTransactionIcon(selectedTransaction.type)}</span>
                <h2 className="text-base font-bold">
                  {selectedTransaction.type === "IN" ? "Stock IN Details" : 
                   selectedTransaction.type === "OUT" ? "Stock OUT Details" : 
                   selectedTransaction.type === "BORROW" ? "Borrow Details" : "Return Details"}
                </h2>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Transaction Summary Card */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Transaction Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">📅 Date & Time</span>
                    <span className="text-slate-700 font-medium text-sm">
                      {new Date(selectedTransaction.date).toLocaleString('en-GB', { 
                        day: '2-digit', month: 'short', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">🏷️ Transaction Type</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${getTransactionColor(selectedTransaction.type)}`}>
                      {getTransactionIcon(selectedTransaction.type)} {selectedTransaction.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">📦 Quantity</span>
                    <span className={`text-lg font-bold ${
                      selectedTransaction.type === "IN" ? "text-emerald-600" : 
                      selectedTransaction.type === "OUT" ? "text-rose-600" : 
                      selectedTransaction.type === "BORROW" ? "text-amber-600" : "text-blue-600"
                    }`}>
                      {selectedTransaction.quantity} {selectedTransaction.item?.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item Details */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Item Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">📦 Item Name</span>
                    <span className="text-slate-700 font-medium text-sm">{selectedTransaction.item?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">📁 Category</span>
                    <span className="text-slate-700 text-sm">
                      {selectedTransaction.item?.category?.icon} {selectedTransaction.item?.category?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">📍 Location</span>
                    <span className="text-slate-700 text-sm">{selectedTransaction.item?.location || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">🏷️ Asset Type</span>
                    <span className="text-slate-700 text-sm">{selectedTransaction.item?.assetType?.replace(/_/g, ' ') || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">⚖️ Current Stock</span>
                    <span className="text-emerald-600 font-bold text-sm">{getCurrentStock(selectedTransaction.item?._id)} {selectedTransaction.item?.unit}</span>
                  </div>
                </div>
              </div>

              {/* Borrow Specific Details */}
              {selectedTransaction.type === "BORROW" && (
                <div className="bg-amber-50 rounded-lg p-3 border-l-4 border-amber-500">
                  <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Borrow Information</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 text-sm">👤 Borrower Name</span>
                      <span className="text-amber-800 font-medium text-sm">{selectedTransaction.borrowerName || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 text-sm">🏢 Department</span>
                      <span className="text-amber-800 text-sm">{selectedTransaction.borrowerDepartment || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 text-sm">📅 Borrowed Date</span>
                      <span className="text-amber-800 text-sm">{new Date(selectedTransaction.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 text-sm">⏰ Expected Return</span>
                      <span className={`text-sm font-semibold ${
                        new Date(selectedTransaction.expectedReturnDate) < new Date() 
                          ? "text-rose-600" 
                          : "text-amber-800"
                      }`}>
                        {selectedTransaction.expectedReturnDate ? new Date(selectedTransaction.expectedReturnDate).toLocaleDateString() : "-"}
                        {new Date(selectedTransaction.expectedReturnDate) < new Date() && " (OVERDUE)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(selectedTransaction.purpose || selectedTransaction.reference) && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Additional Information</p>
                  <div className="space-y-2">
                    {selectedTransaction.purpose && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">🎯 Purpose</span>
                        <span className="text-slate-700 text-sm">{selectedTransaction.purpose}</span>
                      </div>
                    )}
                    {selectedTransaction.reference && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">📄 Reference</span>
                        <span className="text-slate-700 text-sm font-mono">{selectedTransaction.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedTransaction);
                  }}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  ✏️ Edit Transaction
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">{editingId ? "✏️" : "➕"}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-800">{editingId ? "Edit Transaction" : "Add Transaction"}</h2>
              </div>
              <button onClick={() => { resetForm(); setShowForm(false); }} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 text-xl flex items-center justify-center">
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Step 1: Select Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  📁 Step 1: Select Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  disabled={!!editingId}
                  required
                >
                  <option value="">-- Choose a category --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {!selectedCategory && !editingId && (
                  <p className="text-xs text-amber-500 mt-1">⚠️ Select a category first to see its items</p>
                )}
              </div>

              {/* Step 2: Select Item from Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  📦 Step 2: Select Item *
                </label>
                <select
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  required
                  disabled={!!editingId || !selectedCategory}
                >
                  <option value="">-- Select an item --</option>
                  {filteredItemsByCategory.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} (Stock: {getCurrentStock(i._id)} {i.unit} | Location: {i.location})
                    </option>
                  ))}
                </select>
                {selectedCategory && filteredItemsByCategory.length === 0 && !editingId && (
                  <p className="text-xs text-rose-500 mt-1">❌ No items found in this category. Please add items first.</p>
                )}
                {editingId && <p className="text-xs text-slate-400 mt-1">Item cannot be changed when editing</p>}
              </div>

              {/* Selected Item Preview Card */}
              {form.item && !editingId && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-600 mb-2">📋 Selected Item Details</p>
                  {(() => {
                    const selectedItem = getItemDetails(form.item);
                    return selectedItem ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Name:</span>
                          <span className="font-medium text-slate-700">{selectedItem.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Category:</span>
                          <span>{selectedItem.category?.icon} {selectedItem.category?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Current Stock:</span>
                          <span className="font-bold text-emerald-600">{getCurrentStock(form.item)} {selectedItem.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location:</span>
                          <span>{selectedItem.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Condition:</span>
                          <span>{selectedItem.condition}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Loading details...</p>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">🏷️ Transaction Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "IN" })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.type === "IN"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📥 Stock IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "OUT" })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.type === "OUT"
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📤 Stock OUT
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "BORROW" })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.type === "BORROW"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📋 Borrow
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">🔢 Quantity *</label>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">📅 Date</label>
                  <input
                    type="date"
                    value={form.type === "BORROW" ? form.borrowedDate : form.date}
                    onChange={(e) => {
                      if (form.type === "BORROW") {
                        setForm({ ...form, borrowedDate: e.target.value });
                      } else {
                        setForm({ ...form, date: e.target.value });
                      }
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Borrow specific fields */}
              {form.type === "BORROW" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">👤 Borrower Name *</label>
                    <input
                      type="text"
                      value={form.borrowerName}
                      onChange={(e) => setForm({ ...form, borrowerName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="e.g., Mr. John, Class S6"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">📅 Borrowed Date</label>
                      <input
                        type="date"
                        value={form.borrowedDate}
                        onChange={(e) => setForm({ ...form, borrowedDate: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">⏰ Expected Return Date</label>
                      <input
                        type="date"
                        value={form.expectedReturnDate}
                        onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">🏢 Department</label>
                    <select
                      value={form.borrowerDepartment}
                      onChange={(e) => setForm({ ...form, borrowerDepartment: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    >
                      <option value="Classroom">📚 Classroom</option>
                      <option value="Laboratory">🔬 Laboratory</option>
                      <option value="Library">📖 Library</option>
                      <option value="Office">🏢 Office</option>
                      <option value="Event">🎉 Event</option>
                      <option value="Other">📦 Other</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">🎯 Purpose / Reason</label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                >
                  <option value="">Select Purpose</option>
                  <option value="Cooking">🍳 Cooking</option>
                  <option value="Classroom">📚 Classroom Use</option>
                  <option value="Laboratory">🔬 Laboratory</option>
                  <option value="Cleaning">🧹 Cleaning</option>
                  <option value="Maintenance">🔧 Maintenance</option>
                  <option value="Event">🎉 Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">📄 Reference / Invoice #</label>
                <input
                  placeholder="e.g., INV-001, PO-123"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
              
              {/* Preview Card */}
              {form.item && form.quantity && (
                <div className={`bg-gradient-to-r ${getTransactionGradient(form.type)} rounded-lg p-3 text-white`}>
                  <p className="text-xs font-semibold opacity-90 uppercase mb-2">📊 Preview</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {getItemDetails(form.item)?.name || "Selected Item"}
                      </p>
                      <p className="text-xs opacity-90">
                        {form.quantity} units • {form.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-90">After transaction</p>
                      <p className="font-bold text-base">
                        {getCurrentStock(form.item) + (form.type === "IN" ? parseInt(form.quantity) : form.type === "OUT" || form.type === "BORROW" ? -parseInt(form.quantity) : 0)} units
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !selectedCategory || !form.item}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  💾 {loading ? "Processing..." : (editingId ? "Update" : "Add") + " Transaction"}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-all text-sm"
                >
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
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}