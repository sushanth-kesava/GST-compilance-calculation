import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Wallet, Sparkles, UserCheck } from 'lucide-react';

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  address: string;
  membershipTier: string;
  rewardPoints: number;
  walletBalance: number;
  purchaseHistory?: any[];
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Wallet deposit states
  const [activeCustId, setActiveCustId] = useState('');
  const [depositAmount, setDepositAmount] = useState('500');

  // Customer Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Karnataka');
  const [address, setAddress] = useState('');

  const fetchCustomers = async () => {
    try {
      const res: any = await api.get('/customers');
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, email, phone, state, address };
    try {
      await api.post('/customers', payload);
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error creating profile');
    }
  };

  const handleWalletDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/customers/${activeCustId}/wallet?amount=${depositAmount}`);
      setShowWalletModal(false);
      fetchCustomers();
    } catch (err) {
      alert('Wallet deposit failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Customer Directory & Loyalty</h1>
          <p className="text-sm text-muted-foreground">Manage customer records, wallet accounts, and loyalty rewards.</p>
        </div>
        <button 
          onClick={() => {
            setName('');
            setEmail('');
            setPhone('');
            setState('Karnataka');
            setAddress('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs font-semibold transition-all"
        >
          <Plus size={14} />
          <span>New Customer Profile</span>
        </button>
      </div>

      {/* CUSTOMER DIRECTORY CARD LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {customers.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-muted-foreground text-xs bg-card border border-border rounded-2xl shadow-sm">
            No customer profiles registered. Add customer parameters or verify phone numbers in the POS console.
          </div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{c.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{c.phone} | {c.email}</p>
                </div>
                <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  c.membershipTier === 'GOLD' ? 'bg-amber-500/10 text-amber-500' :
                  c.membershipTier === 'PREMIUM' ? 'bg-purple-500/10 text-purple-500' :
                  c.membershipTier === 'SILVER' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {c.membershipTier} Member
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 bg-muted/20 border border-border/30 rounded-xl p-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase text-muted-foreground font-semibold">Wallet Balance</span>
                  <p className="font-extrabold text-foreground">INR {c.walletBalance?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase text-muted-foreground font-semibold">Loyalty Points</span>
                  <p className="font-extrabold text-amber-600 flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>{c.rewardPoints} pts</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>GST region: <span className="font-semibold text-foreground">{c.state}</span></span>
                <span>Purchase orders: <span className="font-semibold text-foreground">{c.purchaseHistory?.length || 0}</span></span>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-border mt-2">
                <button 
                  onClick={() => {
                    if (c.id) {
                      setActiveCustId(c.id);
                      setDepositAmount('500');
                      setShowWalletModal(true);
                    }
                  }}
                  className="flex-1 flex justify-center items-center gap-1.5 py-2 border border-border hover:bg-muted rounded-xl text-[10px] font-semibold text-foreground transition-all"
                >
                  <Wallet size={12} />
                  <span>Wallet Deposit</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-card border border-border text-foreground rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-lg border-b border-border pb-2 flex gap-1.5 items-center">
              <UserCheck size={18} className="text-primary" />
              <span>Create Customer Account</span>
            </h3>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Customer State (for GST routing)</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Street Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
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
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WALLET DEPOSIT MODAL */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleWalletDeposit} className="bg-card border border-border text-foreground rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-lg border-b border-border pb-2 flex gap-1.5 items-center">
              <Wallet size={18} className="text-primary" />
              <span>Top-Up Wallet balance</span>
            </h3>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Deposit Amount (INR)</label>
              <input
                type="number"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 px-3 text-sm font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="px-4 py-2 border border-border rounded-xl hover:bg-muted text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs"
              >
                Deposit Funds
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Customers;
