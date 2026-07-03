import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Truck, Award, AlertCircle, ShoppingBag, Plus } from 'lucide-react';

interface Supplier {
  id?: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstNumber: string;
  pan: string;
  pendingPayments: number;
  rating: number;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const purchaseOrders: any[] = [];
  const [showModal, setShowModal] = useState(false);

  // Supplier Form
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');

  const fetchSuppliers = async () => {
    try {
      const res: any = await api.get('/suppliers');
      if (res.success && res.data) {
        setSuppliers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      contactName: contact,
      email,
      phone,
      gstNumber: gst,
      pan,
      pendingPayments: 0,
      rating: 5.0
    };
    try {
      await api.post('/suppliers', payload);
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      alert('Failed to register supplier');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Supply Chain & Vendors</h1>
          <p className="text-sm text-muted-foreground">Manage wholesale suppliers, purchase ledgers, and procurement contracts.</p>
        </div>
        <button 
          onClick={() => {
            setName('');
            setContact('');
            setEmail('');
            setPhone('');
            setGst('');
            setPan('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs font-semibold transition-all"
        >
          <Plus size={14} />
          <span>Add Supplier Vendor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: SUPPLIERS DIRECTORY */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-foreground">Supplier Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-2xl shadow-sm">
                No vendors registered. Add a supplier contract.
              </div>
            ) : (
              suppliers.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
                      <p className="text-[10px] text-muted-foreground">Contact: {s.contactName}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                      <Award size={12} />
                      <span>{s.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] text-muted-foreground border-b border-border/30 pb-3">
                    <p><span className="font-semibold text-foreground">Phone:</span> {s.phone} | {s.email}</p>
                    <p><span className="font-semibold text-foreground">GSTIN:</span> {s.gstNumber} | <span className="font-semibold text-foreground">PAN:</span> {s.pan}</p>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Ledger Balance</span>
                    <span className="font-black text-red-500">INR {s.pendingPayments.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: PROCUREMENT STATS */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5 h-fit">
          <h3 className="font-bold text-sm text-foreground">Supply Chain Analytics</h3>
          
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex gap-3.5 items-center">
              <Truck size={24} className="text-primary" />
              <div>
                <p className="font-bold text-foreground">Active Suppliers</p>
                <p className="text-muted-foreground text-[10px]">{suppliers.length} vendors registered</p>
              </div>
            </div>

            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 flex gap-3.5 items-center">
              <AlertCircle size={24} className="text-red-500" />
              <div>
                <p className="font-bold text-foreground">Total Vendor Liabilities</p>
                <p className="text-muted-foreground text-[10px]">
                  INR {suppliers.reduce((acc, curr) => acc + curr.pendingPayments, 0).toLocaleString()} pending
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex gap-3.5 items-center">
              <ShoppingBag size={24} className="text-emerald-500" />
              <div>
                <p className="font-bold text-foreground">Purchase orders</p>
                <p className="text-muted-foreground text-[10px]">{purchaseOrders.length} processed POs</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* NEW SUPPLIER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-card border border-border text-foreground rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-lg border-b border-border pb-2">
              Add Supplier Vendor
            </h3>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Company / Vendor Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Contact Name</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">GSTIN Number</label>
              <input
                type="text"
                required
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">PAN Card Number</label>
              <input
                type="text"
                required
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
                Register Supplier
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
