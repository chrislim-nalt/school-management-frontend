import { useEffect, useState } from "react";
import { getCategories } from "../services/categoryService";
import { getItems, createItem, updateItem, deleteItem } from "../services/itemService";
import DownloadButton from "../components/DownloadButton";

export default function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  
  // Pagination states per category
  const [categoryPages, setCategoryPages] = useState({});

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "kgs",
    assetType: "CONSUMABLE",
    currentQuantity: 0,
    minStockLevel: 0,
    condition: "Good condition",
    location: "Storage",
    dateReceived: new Date().toISOString().split('T')[0],
    unitPrice: 0,
    notes: "",
  });

  const units = ["kgs", "liters", "l", "pcs", "cartons", "pairs", "jerrycan", "bottles", "packs", "boxes", "sets", "grams", "ml"];
  const assetTypes = [
    { value: "CONSUMABLE", label: "Consumable", icon: "📦", color: "from-emerald-400 to-emerald-500" },
    { value: "NON_CONSUMABLE", label: "Non-Consumable", icon: "🔧", color: "from-blue-400 to-blue-500" },
    { value: "FIXED_ASSET", label: "Fixed Asset", icon: "🏗️", color: "from-purple-400 to-purple-500" },
    { value: "LIVESTOCK", label: "Livestock", icon: "🐄", color: "from-amber-400 to-amber-500" },
    { value: "CHEMICAL", label: "Chemical", icon: "⚗️", color: "from-rose-400 to-rose-500" },
    { value: "BOOK", label: "Book", icon: "📚", color: "from-indigo-400 to-indigo-500" }
  ];
  const conditions = ["Good condition", "Damaged", "Defective", "Anormal", "Non longer working", "Under repair", "New"];
  const locations = [
    "Kitchen", "Refectory", "Staff room", "Head teacher", "Finance office", 
    "Library", "Laboratory", "Smart classroom", "Classroom", "Dortoir", 
    "Sport field", "Farm", "Administration", "Igikoni", "Storage", "Other"
  ];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "ALL" || item.assetType === selectedType;
    const matchesCategory = selectedCategory === "ALL" || item.category?._id === selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((groups, item) => {
    const categoryName = item.category?.name || "Uncategorized";
    if (!groups[categoryName]) groups[categoryName] = [];
    groups[categoryName].push(item);
    return groups;
  }, {});

  const sortedCategories = Object.keys(groupedItems).sort();

  // Get current page for a category
  const getCurrentPage = (categoryName) => {
    return categoryPages[categoryName] || 1;
  };

  // Set page for a category
  const setCategoryPage = (categoryName, page) => {
    setCategoryPages(prev => ({ ...prev, [categoryName]: page }));
  };

  // Get paginated items for a category
  const getPaginatedItems = (categoryName, itemsPerPage = 10) => {
    const allItems = groupedItems[categoryName] || [];
    const currentPage = getCurrentPage(categoryName);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      items: allItems.slice(start, end),
      totalPages: Math.ceil(allItems.length / itemsPerPage),
      totalItems: allItems.length,
      currentPage
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([getCategories(), getItems()]);
      setCategories(catRes.data || []);
      setItems(itemRes.data || []);
      setError("");
    } catch (error) {
      setError("Failed to load data");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("ALL");
    setSelectedCategory("ALL");
    setCategoryPages({});
  };

  const resetForm = () => {
    setForm({
      name: "", category: "", unit: "kgs", assetType: "CONSUMABLE",
      currentQuantity: 0, minStockLevel: 0, condition: "Good condition",
      location: "Storage", dateReceived: new Date().toISOString().split('T')[0],
      unitPrice: 0, notes: "",
    });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Item name required"); return; }
    if (!form.category) { setError("Select a category"); return; }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (editingId) {
        await updateItem(editingId, form);
        setSuccess("Item updated!");
      } else {
        await createItem(form);
        setSuccess("Item created!");
      }
      resetForm();
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save");
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      category: item.category?._id || item.category,
      unit: item.unit || "kgs",
      assetType: item.assetType || "CONSUMABLE",
      currentQuantity: item.currentQuantity || 0,
      minStockLevel: item.minStockLevel || 0,
      condition: item.condition || "Good condition",
      location: item.location || "Storage",
      dateReceived: item.dateReceived ? new Date(item.dateReceived).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      unitPrice: item.unitPrice || 0,
      notes: item.notes || "",
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item?")) {
      setLoading(true);
      try {
        await deleteItem(id);
        setSuccess("Item deleted!");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        setError("Failed to delete");
        setLoading(false);
      }
    }
  };

  const getAssetTypeStyle = (type) => {
    return assetTypes.find(t => t.value === type) || assetTypes[0];
  };

  const getConditionStyle = (condition) => {
    const styles = {
      "Good condition": "bg-emerald-100 text-emerald-700",
      "Damaged": "bg-rose-100 text-rose-700",
      "Defective": "bg-orange-100 text-orange-700",
      "Anormal": "bg-amber-100 text-amber-700",
      "Non longer working": "bg-gray-100 text-gray-700",
      "Under repair": "bg-purple-100 text-purple-700",
      "New": "bg-blue-100 text-blue-700"
    };
    return styles[condition] || "bg-gray-100 text-gray-700";
  };

  const stats = {
    total: items.length,
    totalValue: items.reduce((sum, i) => sum + ((i.unitPrice || 0) * (i.currentQuantity || 0)), 0),
    lowStock: items.filter(i => (i.currentQuantity || 0) <= (i.minStockLevel || 0) && i.minStockLevel > 0).length,
    categories: categories.length
  };

  // Prepare data for export - FIXED: Ensure all values are properly formatted
  const exportData = items.map(item => ({
    name: item.name || "-",
    category: item.category?.name || "-",
    type: item.assetType?.replace(/_/g, ' ') || "-",
    quantity: item.currentQuantity || 0,
    unit: item.unit || "-",
    condition: item.condition || "-",
    location: item.location || "-",
    unitPrice: item.unitPrice ? `${item.unitPrice.toLocaleString()} RWF` : "-",
    totalValue: item.unitPrice && item.currentQuantity ? `${(item.unitPrice * item.currentQuantity).toLocaleString()} RWF` : "-"
  }));

  const exportColumns = [
    { key: "name", label: "Item Name" },
    { key: "category", label: "Category" },
    { key: "type", label: "Asset Type" },
    { key: "quantity", label: "Quantity" },
    { key: "unit", label: "Unit" },
    { key: "condition", label: "Condition" },
    { key: "location", label: "Location" },
    { key: "unitPrice", label: "Unit Price" },
    { key: "totalValue", label: "Total Value" }
  ];

  // Handle category export - FIXED: Proper async function
  const handleCategoryExport = async (catName, categoryItems) => {
    try {
      const catData = categoryItems.map(item => ({
        name: item.name || "-",
        type: item.assetType?.replace(/_/g, ' ') || "-",
        quantity: item.currentQuantity || 0,
        unit: item.unit || "-",
        condition: item.condition || "-",
        location: item.location || "-",
        unitPrice: item.unitPrice ? `${item.unitPrice.toLocaleString()} RWF` : "-",
        totalValue: item.unitPrice && item.currentQuantity ? `${(item.unitPrice * item.currentQuantity).toLocaleString()} RWF` : "-"
      }));
      
      const categoryExportColumns = [
        { key: "name", label: "Item Name" },
        { key: "type", label: "Asset Type" },
        { key: "quantity", label: "Quantity" },
        { key: "unit", label: "Unit" },
        { key: "condition", label: "Condition" },
        { key: "location", label: "Location" },
        { key: "unitPrice", label: "Unit Price" },
        { key: "totalValue", label: "Total Value" }
      ];
      
      const { exportToExcel } = await import("../services/exportService");
      exportToExcel(catData, categoryExportColumns, `${catName.toLowerCase().replace(/ /g, '_')}_items`);
    } catch (err) {
      console.error("Category export failed:", err);
      alert("Failed to export category. Please try again.");
    }
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

      {/* Hero Section - Compact */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="relative px-5 py-6 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                Items Inventory
              </h1>
              <p className="text-slate-300 text-sm">
                Manage all stock items, equipment, and assets
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="group bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-white/20 hover:scale-105 shadow-lg text-sm"
            >
              <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
              Add Item
            </button>
          </div>

          {/* Stats Cards - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs">Total Items</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs">Total Value</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400 mt-1">{stats.totalValue.toLocaleString()} RWF</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs">Low Stock</p>
              <p className="text-2xl md:text-3xl font-bold text-amber-400 mt-1">{stats.lowStock}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs">Categories</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">{stats.categories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters - Compact */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="🔍 Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
          >
            <option value="ALL">All Types</option>
            {assetTypes.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        {(searchTerm || selectedType !== "ALL" || selectedCategory !== "ALL") && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Found {filteredItems.length} item(s)</span>
            <button onClick={resetFilters} className="text-xs text-indigo-600 hover:text-indigo-700">Clear Filters ✕</button>
          </div>
        )}
      </div>

      {/* Download Section - Compact */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span>📥</span> Export Items
              </h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              <DownloadButton
                data={exportData}
                items={items}
                columns={exportColumns}
                title="G.S AGATEKO - Complete Items Report"
                filename="all_items_export"
                variant="primary"
                useItemsPDF={true}
              />
              
              <div className="relative group">
                <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg transition-all flex items-center gap-1 text-sm">
                  📁 By Category
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-20 border border-slate-100 hidden group-hover:block max-h-80 overflow-y-auto">
                  {[...new Set(items.map(i => i.category?.name).filter(Boolean))].map(catName => {
                    const categoryItems = items.filter(i => i.category?.name === catName);
                    return (
                      <button
                        key={catName}
                        onClick={() => handleCategoryExport(catName, categoryItems)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span>{catName}</span>
                        <span className="text-xs text-slate-400">({categoryItems.length})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !showForm ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">📦</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No items found</h3>
          <p className="text-slate-500 text-sm mb-4">Get started by adding your first item</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            <span>✨</span> Add Your First Item
          </button>
        </div>
      ) : (
        /* Items Display - Grouped by Category with Pagination */
        <div className="space-y-4">
          {sortedCategories.map((categoryName) => {
            const { items: paginatedItems, totalPages, totalItems, currentPage } = getPaginatedItems(categoryName, 10);
            
            return (
              <div key={categoryName} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Category Header - Compact */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📁</span>
                      <div>
                        <h2 className="text-base font-bold text-white">{categoryName}</h2>
                        <p className="text-slate-300 text-xs">{totalItems} items</p>
                      </div>
                    </div>
                    <div className="text-xs text-white/80">
                      Total: {groupedItems[categoryName].reduce((sum, i) => sum + (i.currentQuantity || 0), 0)} units
                    </div>
                  </div>
                </div>
                
                {/* Items Table - Compact */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Unit</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Condition</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Location</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Unit Price</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Total</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedItems.map((item) => {
                        const assetStyle = getAssetTypeStyle(item.assetType);
                        const totalValue = (item.unitPrice || 0) * (item.currentQuantity || 0);
                        const isLowStock = (item.currentQuantity || 0) <= (item.minStockLevel || 0) && item.minStockLevel > 0;
                        
                        return (
                          <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm">
                                  {assetStyle.icon}
                                </div>
                                <span className="font-medium text-slate-800 text-sm">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r ${assetStyle.color} text-white`}>
                                {assetStyle.icon} {assetStyle.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <span className={`font-semibold text-sm ${isLowStock ? 'text-rose-500' : 'text-slate-700'}`}>
                                {item.currentQuantity || 0}
                              </span>
                              {item.minStockLevel > 0 && (
                                <div className="text-xs text-slate-400">Min: {item.minStockLevel}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-slate-600 text-sm">{item.unit}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getConditionStyle(item.condition)}`}>
                                {item.condition}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-slate-600 text-sm">{item.location}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-slate-700">
                              {item.unitPrice?.toLocaleString() || 0} RWF
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-emerald-600 text-sm">
                              {totalValue.toLocaleString()} RWF
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleEdit(item)} className="p-1 rounded hover:bg-indigo-50 text-indigo-600 text-sm" title="Edit">✏️</button>
                                <button onClick={() => handleDelete(item._id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 text-sm" title="Delete">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination for Category - Compact */}
                {totalPages > 1 && (
                  <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-slate-500">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCategoryPage(categoryName, currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-2 py-1 rounded text-xs font-medium transition ${
                            currentPage === 1
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                          }`}
                        >
                          ← Prev
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage <= 2) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 1) {
                              pageNum = totalPages - 2 + i;
                            } else {
                              pageNum = currentPage - 1 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCategoryPage(categoryName, pageNum)}
                                className={`w-7 h-7 rounded text-xs font-medium transition ${
                                  currentPage === pageNum
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                                    : "bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          {totalPages > 3 && currentPage < totalPages - 1 && (
                            <>
                              <span className="text-slate-400 text-xs px-1">...</span>
                              <button
                                onClick={() => setCategoryPage(categoryName, totalPages)}
                                className="w-7 h-7 rounded text-xs font-medium bg-white text-slate-700 hover:bg-slate-100"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => setCategoryPage(categoryName, currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-2 py-1 rounded text-xs font-medium transition ${
                            currentPage === totalPages
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                          }`}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal - Compact */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">{editingId ? "✏️" : "➕"}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-800">{editingId ? "Edit Item" : "Add New Item"}</h2>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 text-xl flex items-center justify-center">
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    placeholder="Enter item name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Type</label>
                  <select
                    value={form.assetType}
                    onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    {assetTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Quantity</label>
                  <input
                    type="number"
                    value={form.currentQuantity}
                    onChange={(e) => setForm({ ...form, currentQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={form.minStockLevel}
                    onChange={(e) => setForm({ ...form, minStockLevel: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (RWF)</label>
                  <input
                    type="number"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <select
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Received</label>
                  <input
                    type="date"
                    value={form.dateReceived}
                    onChange={(e) => setForm({ ...form, dateReceived: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  rows="2"
                  placeholder="Additional information..."
                />
              </div>
              
              <div className="flex gap-3 mt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : (editingId ? "Update Item" : "Create Item")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-all text-sm"
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