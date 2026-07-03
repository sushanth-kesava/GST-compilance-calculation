import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Plus, Edit3, Trash2, AlertTriangle, 
  Upload, CheckCircle, PackageSearch 
} from 'lucide-react';

interface Product {
  id?: string;
  sku: string;
  name: string;
  brand: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  gstPercentage: number;
  hsnCode: string;
  batchNumber: string;
  totalStock: number;
  reorderLevel: number;
  warehouseStock?: any;
}

interface Category {
  id: string;
  name: string;
}

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filtering states
  const [searchFilter, setSearchFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [catId, setCatId] = useState('');
  const [cost, setCost] = useState('0');
  const [selling, setSelling] = useState('0');
  const [mrp, setMrp] = useState('0');
  const [gst, setGst] = useState('18');
  const [hsn, setHsn] = useState('9900');
  const [batch, setBatch] = useState('B-1');
  const [stock, setStock] = useState('100');
  const [reorder, setReorder] = useState('10');

  // Excel file import
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const fetchInventory = async () => {
    try {
      const res: any = await api.get('/products');
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res: any = await api.get('/categories');
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditProduct(null);
    setName('');
    setBrand('');
    setCatId(categories[0]?.id || '');
    setCost('0');
    setSelling('0');
    setMrp('0');
    setGst('18');
    setHsn('9900');
    setBatch('B-1');
    setStock('100');
    setReorder('10');
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditProduct(p);
    setName(p.name);
    setBrand(p.brand);
    setCatId(p.categoryId);
    setCost(p.costPrice.toString());
    setSelling(p.sellingPrice.toString());
    setMrp(p.mrp.toString());
    setGst(p.gstPercentage.toString());
    setHsn(p.hsnCode);
    setBatch(p.batchNumber);
    setStock(p.totalStock.toString());
    setReorder(p.reorderLevel.toString());
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Product = {
      sku: editProduct?.sku || 'SKU-' + Date.now(),
      name,
      brand,
      categoryId: catId,
      costPrice: parseFloat(cost),
      sellingPrice: parseFloat(selling),
      mrp: parseFloat(mrp),
      gstPercentage: parseFloat(gst),
      hsnCode: hsn,
      batchNumber: batch,
      totalStock: parseInt(stock),
      reorderLevel: parseInt(reorder),
      warehouseStock: { "WH-Default": parseInt(stock) } // Mock a single warehouse stocking breakdown
    };

    try {
      if (editProduct?.id) {
        await api.put(`/products/${editProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      alert('Error saving product parameters');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product SKU?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchInventory();
    } catch (err) {
      alert('Delete failed. Verify your manager access privileges.');
    }
  };

  // Mock Excel import
  const handleExcelImport = async () => {
    setImporting(true);
    setImportMsg('');
    try {
      // Simulate multipart file spreadsheet upload
      const formData = new FormData();
      const mockFile = new File(["sku,name,mrp\n101,softdrink,99"], "inventory.xlsx", { type: "application/vnd.ms-excel" });
      formData.append("file", mockFile);
      
      const res: any = await api.post('/products/import', formData);
      if (res.success) {
        setImportMsg(res.message);
        fetchInventory();
      }
    } catch (err) {
      setImportMsg('Failed to process spreadsheet files.');
    } finally {
      setImporting(false);
    }
  };

  // Filter products locally for search responsiveness
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = catFilter ? p.categoryId === catFilter : true;
    const matchesLowStock = lowStockFilter ? p.totalStock <= p.reorderLevel : true;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER BANNER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Stock & Inventory Catalog</h1>
          <p className="text-sm text-muted-foreground">Manage SKUs, product pricing matrix, and stock levels.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExcelImport}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Upload size={14} />
            <span>{importing ? 'Importing Excel...' : 'Bulk Excel Import'}</span>
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs font-semibold transition-all shadow-md shadow-primary/10"
          >
            <Plus size={14} />
            <span>Add Product SKU</span>
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-3.5 flex gap-2.5 items-center text-xs">
          <CheckCircle size={16} />
          <span>{importMsg}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <PackageSearch size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by name, SKU, barcode..."
            className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={lowStockFilter}
            onChange={(e) => setLowStockFilter(e.target.checked)}
            className="rounded text-primary border-border focus:ring-primary w-4 h-4"
          />
          <span className="text-amber-600 font-semibold">Show Low Stock Alerts Only</span>
        </label>
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 font-semibold">SKU / Code</th>
                <th className="py-3 font-semibold">Product Name</th>
                <th className="py-3 font-semibold">Category</th>
                <th className="py-3 font-semibold">GST %</th>
                <th className="py-3 font-semibold text-right">Cost Price</th>
                <th className="py-3 font-semibold text-right">MRP</th>
                <th className="py-3 font-semibold text-right">Selling Price</th>
                <th className="py-3 text-center font-semibold">Stock Qty</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No products matching filter criteria. Create a new SKU or import inventory.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.totalStock <= p.reorderLevel;
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-muted/20">
                      <td className="py-3 font-bold text-muted-foreground">{p.sku}</td>
                      <td className="py-3 font-semibold text-foreground">{p.name}</td>
                      <td className="py-3 text-muted-foreground">{categories.find((c) => c.id === p.categoryId)?.name || 'General'}</td>
                      <td className="py-3 text-muted-foreground font-semibold">{p.gstPercentage}%</td>
                      <td className="py-3 text-right text-foreground">INR {p.costPrice.toFixed(2)}</td>
                      <td className="py-3 text-right text-foreground">INR {p.mrp.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-foreground">INR {p.sellingPrice.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                          <span className={isLow ? 'text-amber-500 font-extrabold' : 'text-foreground'}>
                            {p.totalStock}
                          </span>
                          {isLow && (
                            <span title="Reorder stock">
                              <AlertTriangle size={14} className="text-amber-500 animate-bounce" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-all"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={() => p.id && handleDelete(p.id)}
                            className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE/EDIT OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-card border border-border text-foreground rounded-3xl p-6 w-full max-w-lg shadow-xl grid grid-cols-2 gap-4">
            <h3 className="col-span-2 font-bold text-lg border-b border-border pb-2">
              {editProduct ? 'Edit Product Parameters' : 'Create Product SKU Record'}
            </h3>

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Category</label>
              <select
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Cost Price (INR)</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">MRP Value (INR)</label>
              <input
                type="number"
                step="0.01"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">POS Selling Price (INR)</label>
              <input
                type="number"
                step="0.01"
                value={selling}
                onChange={(e) => setSelling(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">GST percentage</label>
              <select
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">HSN Code</label>
              <input
                type="text"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Batch Number</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Total Stock Count</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Reorder Level Alert Threshold</label>
              <input
                type="number"
                value={reorder}
                onChange={(e) => setReorder(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div className="col-span-2 flex justify-end gap-3.5 mt-4">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border rounded-xl hover:bg-muted text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Inventory;
