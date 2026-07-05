import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Percent, 
  AlertTriangle, ArrowRight, Layers, Receipt, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface DashboardStats {
  todaySales: number;
  monthlyRevenue: number;
  profit: number;
  gstCollected: number;
  totalOrders: number;
  lowStockCount: number;
  salesChart: any[];
  categoriesChart: any[];
  recentTransactions: any[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeNotifications, setRealTimeNotifications] = useState<string[]>([]);
  const wsRef = useRef<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res: any = await api.get('/analytics/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      toast('error', 'Failed to load dashboard data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time WebSocket subscription for live invoice updates
  useEffect(() => {
    const API_WS_URL = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') 
      : 'http://localhost:8080';

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_WS_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to new invoices
        client.subscribe('/topic/invoices', (message) => {
          try {
            const invoice = JSON.parse(message.body);
            // Show a brief toast notification
            toast('success', `New invoice: ${invoice.invoiceNumber} - INR ${invoice.finalAmount}`);
            // Refresh dashboard data
            fetchStats();
            // Add to real-time notification list
            setRealTimeNotifications((prev) => 
              [`${invoice.invoiceNumber} - ${invoice.customerName} - INR ${invoice.finalAmount}`, ...prev].slice(0, 20)
            );
            // Auto-clear notifications after 15 seconds
            setTimeout(() => {
              setRealTimeNotifications((prev) => prev.slice(0, -1));
            }, 15000);
          } catch (e) {
            // ignore parse errors
          }
        });
      },
      onDisconnect: () => {
        // Will auto-reconnect
      },
    });

    client.activate();
    wsRef.current = client;

    return () => {
      if (wsRef.current) {
        wsRef.current.deactivate();
      }
    };
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = [
    { label: "Today's Sales", value: `INR ${stats.todaySales.toLocaleString()}`, change: "+12.4% vs yesterday", icon: TrendingUp, color: "text-purple-500 bg-purple-500/10" },
    { label: "Monthly Revenue", value: `INR ${stats.monthlyRevenue.toLocaleString()}`, change: "+8.2% vs last month", icon: DollarSign, color: "text-blue-500 bg-blue-500/10" },
    { label: "Net Margin Profit", value: `INR ${stats.profit.toLocaleString()}`, change: "28.5% avg margin", icon: Layers, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "GST Collected", value: `INR ${stats.gstCollected.toLocaleString()}`, change: "Tax summary logs", icon: Percent, color: "text-amber-500 bg-amber-500/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER SUMMARY */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl text-foreground">ERP Overview</h1>
          <p className="text-sm text-muted-foreground">SmartRetail 360 flagship terminal statistics.</p>
        </div>
        <div className="flex gap-3">
          {stats.lowStockCount > 0 && (
            <Link 
              to="/inventory?lowStock=true"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-xl text-sm font-semibold transition-all border border-amber-500/20"
            >
              <AlertTriangle size={16} />
              <span>{stats.lowStockCount} Low Stock Warnings</span>
            </Link>
          )}
          <Link
            to="/invoices"
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-semibold transition-all border border-primary/20"
          >
            <Receipt size={16} />
            <span>Invoice History</span>
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{kpi.label}</p>
                  <h3 className="text-xl font-bold text-foreground mt-2">{kpi.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 font-medium">{kpi.change}</p>
            </div>
          );
        })}
      </div>

      {/* CHARTS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-foreground">Sales & Profit Trends</h3>
            <p className="text-xs text-muted-foreground">Daily operations charts representation.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesChart}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="Sales" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground">Top Performing Categories</h3>
            <p className="text-xs text-muted-foreground">Sales ratio by item department.</p>
          </div>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoriesChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoriesChart.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* REAL-TIME NOTIFICATIONS BANNER */}
      {realTimeNotifications.length > 0 && (
        <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Zap size={14} className="animate-pulse" />
            <span>Real-Time Invoice Activity</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {realTimeNotifications.map((notif, idx) => (
              <span 
                key={idx} 
                className="bg-primary/5 text-primary text-[10px] px-2.5 py-1 rounded-full border border-primary/20 font-semibold animate-fade-in"
              >
                {notif}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-sm text-foreground">Recent POS Transactions</h3>
            <p className="text-xs text-muted-foreground">Latest invoices generated across terminals.</p>
          </div>
          <Link to="/pos" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span>New POS Checkout</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 font-semibold">Invoice No</th>
                <th className="py-3 font-semibold">Customer</th>
                <th className="py-3 font-semibold">Method</th>
                <th className="py-3 font-semibold">Taxable Val</th>
                <th className="py-3 font-semibold">GST Amount</th>
                <th className="py-3 font-semibold text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No transactions recorded yet today. Use the POS console to run checkouts.
                  </td>
                </tr>
              ) : (
                stats.recentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 font-bold text-primary">{tx.invoiceNumber}</td>
                    <td className="py-3 font-medium text-foreground">{tx.customerName}</td>
                    <td className="py-3 uppercase text-muted-foreground font-semibold">{tx.paymentMethod}</td>
                    <td className="py-3 text-foreground">INR {tx.taxableValue.toFixed(2)}</td>
                    <td className="py-3 text-foreground">INR {tx.gstAmount.toFixed(2)}</td>
                    <td className="py-3 text-right font-bold text-foreground">INR {tx.finalAmount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
