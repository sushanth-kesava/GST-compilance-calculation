import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, ShieldAlert, Cpu } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState('');
  const [storeGstin, setStoreGstin] = useState('');
  const [storeState, setStoreState] = useState('');
  const [msg, setMsg] = useState('');

  const fetchStoreConfig = async () => {
    try {
      const res: any = await api.get('/settings/store');
      if (res.success && res.data) {
        setStoreName(res.data.name || '');
        setStoreGstin(res.data.gstin || '');
        setStoreState(res.data.state || '');
      }
    } catch (err) {
      // Fallback to defaults if settings API is not available yet
      setStoreName('SmartRetail 360 flagship');
      setStoreGstin('29AAAAA1111A1Z1');
      setStoreState('Karnataka');
      toast('warning', 'Could not connect to server. Using local defaults.');
    }
  };

  useEffect(() => {
    fetchStoreConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings/store', {
        name: storeName,
        gstin: storeGstin,
        state: storeState
      });
      setMsg('Store configuration saved successfully!');
      toast('success', 'Store configuration saved successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      toast('error', 'Failed to save store configuration.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl text-foreground flex items-center gap-2">
            <SettingsIcon size={24} className="text-primary" />
            <span>Store Configuration Settings</span>
          </h1>
          <p className="text-sm text-muted-foreground">Adjust shop profiles, tax variables, and regional options.</p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-3.5 flex gap-2 text-xs font-semibold">
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: FORM EDIT */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Store className="text-primary" size={18} />
            <h3 className="font-bold text-sm text-foreground">Flagship Store Profile</h3>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Company / Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Store GSTIN number</label>
              <input
                type="text"
                value={storeGstin}
                onChange={(e) => setStoreGstin(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Store Location State (CGST/SGST vs IGST Pivot)</label>
              <input
                type="text"
                value={storeState}
                onChange={(e) => setStoreState(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              />
              <p className="text-[9px] text-muted-foreground mt-1">
                If client billing state is different from <span className="font-bold text-foreground">{storeState}</span>, transaction is treated as IGST.
              </p>
            </div>

            <div className="col-span-2 flex justify-end pt-4 border-t border-border mt-2">
              <button 
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md shadow-primary/10"
              >
                <Save size={14} />
                <span>Save Config Parameters</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: POLICY & SEC STATS */}
        <div className="space-y-6">
          
          {/* Security policy */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <ShieldAlert className="text-amber-500" size={16} />
              <h4 className="font-bold text-foreground">ERP Security Policies</h4>
            </div>
            
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Role-based access verification</li>
              <li>Stateless JWT security filters</li>
              <li>5 unsuccessful login lockout checkouts</li>
              <li>Local auditing tracking logs enabled</li>
            </ul>
          </div>

          {/* Engine variables */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Cpu className="text-purple-500" size={16} />
              <h4 className="font-bold text-foreground">Services Engine Status</h4>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">REST API Middleware:</span>
                <span className="text-emerald-500 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">WebSocket Broadcasts:</span>
                <span className="text-emerald-500 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">AI Forecasting models:</span>
                <span className="text-emerald-500 font-bold">COMPILING</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;
