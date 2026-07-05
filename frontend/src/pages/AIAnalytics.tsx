import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, PieChart, Pie
} from 'recharts';
import { 
  Brain, AlertTriangle, ShieldAlert, Sparkles, 
  RefreshCw, TrendingUp, BarChart3 
} from 'lucide-react';
import { useToast } from '../components/Toast';

interface FraudAlert {
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface Segment {
  segment: string;
  value: number;
  description: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const AIAnalytics: React.FC = () => {
  const [frauds, setFrauds] = useState<FraudAlert[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [salesForecast, setSalesForecast] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Demand forecasting selection
  const [selectedProductId, setSelectedProductId] = useState('');
  const [demandForecast, setDemandForecast] = useState<any[]>([]);
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fraudsRes, segmentsRes, forecastRes, recsRes, prodRes]: any = await Promise.all([
        api.get('/ai/frauds'),
        api.get('/ai/segments'),
        api.get('/ai/forecast/sales'),
        api.get('/ai/recommendations'),
        api.get('/products')
      ]);

      if (fraudsRes.success) setFrauds(fraudsRes.data);
      if (segmentsRes.success) setSegments(segmentsRes.data);
      if (forecastRes.success) setSalesForecast(forecastRes.data);
      if (recsRes.success) setRecommendations(recsRes.data);
      
      if (prodRes.success && prodRes.data.length > 0) {
        setProducts(prodRes.data);
        setSelectedProductId(prodRes.data[0].id);
        fetchDemandForecast(prodRes.data[0].id);
      }
    } catch (err) {
      toast('error', 'Failed to load AI analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDemandForecast = async (pid: string) => {
    if (!pid) return;
    try {
      const res: any = await api.get(`/ai/forecast/demand?productId=${pid}`);
      if (res.success && res.data) {
        setDemandForecast(res.data);
      }
    } catch (err) {
      toast('error', 'Failed to load demand forecast.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl text-foreground flex items-center gap-2">
            <Brain className="text-primary animate-pulse" />
            <span>AI Predictive Analytics</span>
          </h1>
          <p className="text-sm text-muted-foreground">ML models, demand predictions, checkout fraud, and segment trends.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw size={14} />
          <span>Refresh Models</span>
        </button>
      </div>

      {/* FRAUD WARNINGS CARD & DEMAND FORECAST DROPDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fraud flags */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldAlert className="text-red-500" size={18} />
            <h3 className="font-bold text-sm text-foreground">Checkout Integrity & Fraud Logs</h3>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {frauds.map((f, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 border rounded-xl flex gap-3.5 items-start text-xs transition-all ${
                  f.severity === 'HIGH' ? 'bg-red-500/5 border-red-500/10 text-red-500' :
                  f.severity === 'MEDIUM' ? 'bg-amber-500/5 border-amber-500/10 text-amber-500' :
                  'bg-blue-500/5 border-blue-500/10 text-blue-500'
                }`}
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between font-bold">
                    <span className="uppercase text-[9px] tracking-wider">{f.type.replace('_', ' ')}</span>
                    <span className="text-[9px] font-medium opacity-80">{new Date(f.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 leading-relaxed opacity-95">{f.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demand prediction selector */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground">Demand Restocking Suggestion</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Select Product SKU</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  fetchDemandForecast(e.target.value);
                }}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {demandForecast.length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <div className="grid grid-cols-3 font-semibold text-[10px] text-muted-foreground uppercase">
                  <span>Day</span>
                  <span className="text-center">Est Sales</span>
                  <span className="text-right">Replenish</span>
                </div>
                {demandForecast.map((point, idx) => (
                  <div key={idx} className="grid grid-cols-3 text-foreground font-medium py-0.5">
                    <span>{point.day}</span>
                    <span className="text-center font-bold">{point.predictedSales} units</span>
                    <span className={`text-right font-extrabold ${point.restockSuggested > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                      {point.restockSuggested > 0 ? `+${point.restockSuggested}` : 'OK'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SALES FORECAST TIME-SERIES CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts moving average */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-500" />
              <span>Time-Series Weekly Sales Forecast</span>
            </h3>
            <p className="text-xs text-muted-foreground">Projection of revenue trends based on recurrent neural model regression.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesForecast}>
                <defs>
                  <linearGradient id="actualSalesColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="forecastSalesColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="actualSales" stroke="#3b82f6" fillOpacity={1} fill="url(#actualSalesColor)" strokeWidth={2} name="Actual" />
                <Area type="monotone" dataKey="forecastedSales" stroke="#8b5cf6" fillOpacity={1} fill="url(#forecastSalesColor)" strokeWidth={2} strokeDasharray="5 5" name="Projected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer segmentation charts */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-500" />
              <span>RFM Customer Segmentation</span>
            </h3>
            <p className="text-xs text-muted-foreground">Buyer clustering analysis ratios.</p>
          </div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="segment"
                >
                  {segments.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* RECOMMENDATIONS CAROUSEL */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
          <Sparkles size={16} className="text-amber-500" />
          <span>Product Association Suggestions</span>
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          {recommendations.map((prod) => (
            <div key={prod.id} className="p-3 border border-border rounded-2xl text-xs space-y-2 hover:bg-muted/30 transition-all">
              <p className="font-bold text-foreground truncate">{prod.name}</p>
              <p className="text-[10px] text-muted-foreground">SKU: {prod.sku} | Brand: {prod.brand}</p>
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-border/30">
                <span className="font-extrabold text-primary">INR {prod.sellingPrice}</span>
                <span className="text-[9px] text-emerald-500 font-semibold">{prod.gstPercentage}% GST</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AIAnalytics;
