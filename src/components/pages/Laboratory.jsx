import { useEffect, useState } from "react";
import { 
  getLaboratoryItems, 
  createLaboratoryItem, 
  updateLaboratoryItem, 
  deleteLaboratoryItem,
  getExpiredChemicals,
  getLowStockLabItems
} from "../services/laboratoryService";
import DownloadButton from "../DownloadButton";

export default function Laboratory() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expiredCount, setExpiredCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCondition, setSelectedCondition] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  const [form, setForm] = useState({
    name: "",
    itemType: "EQUIPMENT",
    quantity: 1,
    unit: "pcs",
    condition: "Good",
    storageLocation: "Laboratory",
    isHazardous: false,
    expirationDate: "",
    responsiblePerson: "",
    dateReceived: new Date().toISOString().split('T')[0],
    minStockLevel: 1,
    notes: "",
  });

  const itemTypes = [
    { value: "EQUIPMENT", label: "Equipment", icon: "🔬" },
    { value: "CHEMICAL", label: "Chemical", icon: "🧪" },
    { value: "GLASSWARE", label: "Glassware", icon: "🥛" },
    { value: "CONSUMABLE", label: "Consumable", icon: "📦" },
    { value: "SPECIMEN", label: "Specimen", icon: "🔍" },
  ];

  const units = ["g", "kg", "ml", "l", "pcs", "pairs", "packs", "boxes"];
  const conditions = ["New", "Good", "Fair", "Poor", "Broken", "Needs Calibration"];
  const locations = ["Laboratory", "Storage Room", "Chemical Cabinet", "Refrigerator", "Safety Cabinet"];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, expiredRes, lowStockRes] = await Promise.all([
        getLaboratoryItems(),
        getExpiredChemicals(),
        getLowStockLabItems()
      ]);
      setItems(itemsRes.data || []);
      setExpiredCount(expiredRes.data?.length || 0);
      setLowStockCount(lowStockRes.data?.length || 0);
      setError("");
    } catch (error) {
      console.error("Error fetching lab items:", error);
      setError("Failed to load laboratory items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responsiblePerson?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "ALL" || item.itemType === selectedType;
    const matchesCondition = selectedCondition === "ALL" || item.condition === selectedCondition;
    return matchesSearch && matchesType && matchesCondition;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCondition]);

  const resetForm = () => {
    setForm({
      name: "",
      itemType: "EQUIPMENT",
      quantity: 1,
      unit: "pcs",
      condition: "Good",
      storageLocation: "Laboratory",
      isHazardous: false,
      expirationDate: "",
      responsiblePerson: "",
      dateReceived: new Date().toISOString().split('T')[0],
      minStockLevel: 1,
      notes: "",
    });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("ALL");
    setSelectedCondition("ALL");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError("Item name is required");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (editingId) {
        await updateLaboratoryItem(editingId, form);
        setSuccess("✅ Laboratory item updated successfully!");
      } else {
        await createLaboratoryItem(form);
        setSuccess("✅ Laboratory item created successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving lab item:", error);
      setError(error.response?.data?.message || "Failed to save item");
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      itemType: item.itemType || "EQUIPMENT",
      quantity: item.quantity || 1,
      unit: item.unit || "pcs",
      condition: item.condition || "Good",
      storageLocation: item.storageLocation || "Laboratory",
      isHazardous: item.isHazardous || false,
      expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : "",
      responsiblePerson: item.responsiblePerson || "",
      dateReceived: item.dateReceived ? new Date(item.dateReceived).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      minStockLevel: item.minStockLevel || 1,
      notes: item.notes || "",
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this laboratory item?")) {
      setLoading(true);
      try {
        await deleteLaboratoryItem(id);
        setSuccess("✅ Item deleted successfully!");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deleting lab item:", error);
        setError("Failed to delete item");
        setLoading(false);
      }
    }
  };

  const getConditionColor = (condition) => {
    const colors = {
      "New": "bg-blue-100 text-blue-700",
      "Good": "bg-emerald-100 text-emerald-700",
      "Fair": "bg-amber-100 text-amber-700",
      "Poor": "bg-orange-100 text-orange-700",
      "Broken": "bg-rose-100 text-rose-700",
      "Needs Calibration": "bg-purple-100 text-purple-700",
    };
    return colors[condition] || "bg-slate-100 text-slate-700";
  };

  const getConditionEmoji = (condition) => {
    const emojis = {
      "New": "✨",
      "Good": "✅",
      "Fair": "👍",
      "Poor": "⚠️",
      "Broken": "❌",
      "Needs Calibration": "🔧"
    };
    return emojis[condition] || "📋";
  };

  const isExpired = (expirationDate) => {
    return expirationDate && new Date(expirationDate) < new Date();
  };

  const isLowStock = (item) => {
    return item.quantity <= item.minStockLevel;
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

  const exportData = filteredItems.map(item => ({
    name: item.name,
    type: item.itemType || "-",
    quantity: item.quantity || 0,
    unit: item.unit || "-",
    condition: item.condition || "-",
    location: item.storageLocation || "-",
    hazardous: item.isHazardous ? "Yes" : "No",
    expirationDate: item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : "-",
    responsiblePerson: item.responsiblePerson || "-",
    dateReceived: item.dateReceived ? new Date(item.dateReceived).toLocaleDateString() : "-",
    minStockLevel: item.minStockLevel || "-"
  }));

  const exportColumns = [
    { key: "name", label: "Item Name" },
    { key: "type", label: "Item Type" },
    { key: "quantity", label: "Quantity" },
    { key: "unit", label: "Unit" },
    { key: "condition", label: "Condition" },
    { key: "location", label: "Storage Location" },
    { key: "hazardous", label: "Hazardous" },
    { key: "expirationDate", label: "Expiration Date" },
    { key: "responsiblePerson", label: "Responsible Person" },
    { key: "dateReceived", label: "Date Received" },
    { key: "minStockLevel", label: "Min Stock Level" }
  ];

  return (
    <div className="space-y-4">
      
      {/* Toast Messages */}
      {(success || error) && (
        <div className={`fixed top-20 right-4 z-50 animate-slide-in ${
          success ? "bg-emerald-500" : "bg-rose-500"
        } text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-sm max-w-[90vw] md:max-w-md`}>
          <span className="text-lg flex-shrink-0">{success ? "✅" : "⚠️"}</span>
          <p className="font-medium">{success || error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative px-4 py-5 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur rounded-xl text-2xl">🔬</div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                    Laboratory Management
                  </h1>
                  <p className="text-slate-300 text-xs md:text-sm">
                    Track lab equipment, chemicals, and supplies
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold border border-white/20 text-sm"
            >
              <span className="text-lg">➕</span>
              Add Item
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">📦 Total</p>
              <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">🔬 Equipment</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {items.filter(i => i.itemType === "EQUIPMENT").length}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">🧪 Chemicals</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {items.filter(i => i.itemType === "CHEMICAL").length}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
              <p className="text-slate-300 text-xs flex items-center gap-1">📦 Consumables</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {items.filter(i => i.itemType === "CONSUMABLE").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      {(expiredCount > 0 || lowStockCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expiredCount > 0 && (
            <div className="bg-rose-50 border-l-4 border-rose-500 rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-rose-800 text-sm">Expired Chemicals</p>
                <p className="text-xs text-rose-600">{expiredCount} chemical(s) have expired.</p>
              </div>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-semibold text-amber-800 text-sm">Low Stock Alert</p>
                <p className="text-xs text-amber-600">{lowStockCount} item(s) below minimum stock.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by name or responsible person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '12px'
            }}
          >
            <option value="ALL">📂 All Types</option>
            {itemTypes.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
          
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '12px'
            }}
          >
            <option value="ALL">🏷️ All Conditions</option>
            {conditions.map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedType !== "ALL" || selectedCondition !== "ALL") && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Found {filteredItems.length} item(s)</span>
            <button onClick={resetFilters} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Export Section */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📥</span>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Export Laboratory Items</h3>
                <p className="text-xs text-slate-400">Download in CSV, Excel, or PDF</p>
              </div>
            </div>
            <DownloadButton
              data={exportData}
              columns={exportColumns}
              title="School Inventory - Laboratory Items Report"
              filename="laboratory_items_export"
              variant="primary"
            />
          </div>
        </div>
      )}

      {/* Results Count */}
      {filteredItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-3">
          <p className="text-xs text-slate-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && !showForm && items.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-indigo-500"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-3">🔬</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No laboratory items found</h3>
          <p className="text-slate-500 text-sm mb-4">Get started by adding your first lab item</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            ✨ Add Your First Item
          </button>
        </div>
      ) : (
        /* Laboratory Items Table */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[180px]">Item</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">Type</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[70px]">Qty</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[80px]">Unit</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Condition</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[130px]">Location</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Expiry</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((item, index) => {
                  const expired = isExpired(item.expirationDate);
                  const lowStock = isLowStock(item);
                  const typeIcon = itemTypes.find(t => t.value === item.itemType)?.icon || "📦";
                  
                  return (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <span className="text-base flex-shrink-0">{typeIcon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800 text-sm truncate" title={item.name}>
                              {item.name}
                            </p>
                            {item.isHazardous && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded mt-0.5">
                                ⚠️ Hazardous
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          {item.itemType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-center">
                        <span className={`font-semibold text-sm ${lowStock ? 'text-rose-500' : 'text-slate-700'}`}>
                          {item.quantity}
                        </span>
                        {lowStock && <span className="ml-1 text-[10px] text-amber-500 whitespace-nowrap">(Low)</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 text-xs">{item.unit}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${getConditionColor(item.condition)}`}>
                          {getConditionEmoji(item.condition)} {item.condition}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 text-xs">
                        <span className="truncate max-w-[100px] inline-block" title={item.storageLocation}>
                          📍 {item.storageLocation}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {item.expirationDate ? (
                          <span className={`text-xs ${expired ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                            📅 {new Date(item.expirationDate).toLocaleDateString()}
                            {expired && <span className="ml-1 text-rose-500 whitespace-nowrap">Expired</span>}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleEdit(item)} 
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(item._id)} 
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors text-sm"
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
                    ◀ Prev
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
                    Next ▶
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
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔬</span>
                <h2 className="text-lg font-bold text-white">{editingId ? "Edit Item" : "Add New Item"}</h2>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-xl">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="e.g., Microscope, Sodium Chloride"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Type</label>
                <select
                  value={form.itemType}
                  onChange={(e) => setForm({ ...form, itemType: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white appearance-none transition-all"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '12px'
                  }}
                >
                  {itemTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white appearance-none transition-all"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '12px'
                    }}
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white appearance-none transition-all"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '12px'
                    }}
                  >
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location</label>
                  <select
                    value={form.storageLocation}
                    onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white appearance-none transition-all"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '12px'
                    }}
                  >
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHazardous"
                  checked={form.isHazardous}
                  onChange={(e) => setForm({ ...form, isHazardous: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isHazardous" className="text-sm text-slate-700 flex items-center gap-1">
                  ⚠️ Hazardous Material
                </label>
              </div>

              {form.itemType === "CHEMICAL" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={form.minStockLevel}
                    onChange={(e) => setForm({ ...form, minStockLevel: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Received</label>
                  <input
                    type="date"
                    value={form.dateReceived}
                    onChange={(e) => setForm({ ...form, dateReceived: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Responsible Person</label>
                <input
                  type="text"
                  value={form.responsiblePerson}
                  onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Lab technician in charge"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Safety precautions, storage instructions..."
                />
              </div>
              
              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  💾 {loading ? "Saving..." : (editingId ? "Update Item" : "Create Item")}
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}