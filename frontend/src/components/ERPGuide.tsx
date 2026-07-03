import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BookOpen, HelpCircle, Calculator, Info, X, Compass, ChevronRight,
  TrendingUp, Award, Layers, Sparkles
} from 'lucide-react';

interface ERPGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const ERPGuide: React.FC<ERPGuideProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const path = location.pathname;
  const [activeTab, setActiveTab] = useState<'copilot' | 'simulator' | 'glossary'>('copilot');

  // Math Simulator States
  const [simSubtotal, setSimSubtotal] = useState<number>(1000);
  const [simItemDisc, setSimItemDisc] = useState<number>(50);
  const [simHasCombo, setSimHasCombo] = useState<boolean>(false);
  const [simMemberTier, setSimMemberTier] = useState<'walkin' | 'silver' | 'gold' | 'premium'>('gold');
  const [simCouponCode, setSimCouponCode] = useState<string>('SAVE10');
  const [simIsInterstate, setSimIsInterstate] = useState<boolean>(false);
  const [simGstRate, setSimGstRate] = useState<number>(18);

  if (!isOpen) return null;

  // Billing Math Logic for Simulator
  const itemDiscount = simItemDisc;
  const subtotalAfterItem = Math.max(0, simSubtotal - itemDiscount);

  // 10% combo discount if active
  const comboDiscount = simHasCombo ? Math.round(subtotalAfterItem * 0.1) : 0;
  const subtotalAfterCombo = Math.max(0, subtotalAfterItem - comboDiscount);

  // Membership discount mapping
  const membershipRates = { walkin: 0, silver: 0.05, gold: 0.1, premium: 0.15 };
  const memberRate = membershipRates[simMemberTier];
  const memberDiscount = Math.round(subtotalAfterCombo * memberRate);
  const subtotalAfterMember = Math.max(0, subtotalAfterCombo - memberDiscount);

  // Coupon discount
  let couponDiscount = 0;
  if (simCouponCode === 'SAVE10') {
    couponDiscount = Math.round(subtotalAfterMember * 0.1);
  } else if (simCouponCode === 'FLAT100') {
    couponDiscount = 100;
  }
  // Max cap coupon disc at 200
  couponDiscount = Math.min(couponDiscount, 200);
  const taxableValue = Math.max(0, subtotalAfterMember - couponDiscount);

  // GST Math
  const gstAmount = Math.round(taxableValue * (simGstRate / 100) * 100) / 100;
  const rawTotal = taxableValue + gstAmount;
  const finalTotal = Math.round(rawTotal);
  const roundOff = Math.round((finalTotal - rawTotal) * 100) / 100;

  // GST Split description
  const customerState = simIsInterstate ? 'Tamil Nadu' : 'Karnataka';
  const isInterstate = simIsInterstate;

  // Glossary items
  const glossaryItems = [
    { term: 'SKU (Stock Keeping Unit)', desc: 'A unique code printed on product packages to identify distinct products and manage stock counts.' },
    { term: 'GSTIN (GST Identification Number)', desc: 'A unique 15-character identification number assigned to business entities registered under GST laws in India.' },
    { term: 'HSN (Harmonized System of Nomenclature)', desc: 'A 6-8 digit code system used worldwide to classify goods in a systematic manner for customs and taxation.' },
    { term: 'CGST / SGST', desc: 'Central GST (CGST) and State GST (SGST) are charged on intra-state supply of goods (within the same state). The tax rate is split 50/50 between Central and State.' },
    { term: 'IGST', desc: 'Integrated GST (IGST) is charged on inter-state supply of goods (across state borders) and goes directly to the Central Government.' },
    { term: 'RFM Analytics', desc: 'A marketing analysis tool used to segment customers based on Recency (how recently they purchased), Frequency (how often they purchase), and Monetary value (how much they spend).' },
    { term: 'Reorder Level', desc: 'The threshold stock quantity for a product. When total stock falls below this level, the ERP triggers low-stock alerts and restock suggestions.' }
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col text-white transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-400" size={20} />
          <h3 className="font-bold text-base text-slate-100">SmartRetail Copilot</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 border-b border-slate-800 p-1 text-xs">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'copilot' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass size={14} />
          Copilot
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'simulator' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator size={14} />
          Math Engine
        </button>
        <button
          onClick={() => setActiveTab('glossary')}
          className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'glossary' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen size={14} />
          ERP Glossary
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 1: Copilot Page Explanations */}
        {activeTab === 'copilot' && (
          <div className="space-y-4">
            {/* Dashboard Guide */}
            {path === '/' && (
              <>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2 mb-2">
                    <TrendingUp size={16} /> Dashboard Guide
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This screen displays live summaries of retail business performance. The ERP polls sales transactions, low-stock lines, and payment balances dynamically.
                  </p>
                </div>
                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Key Functions</h5>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex gap-3 text-xs leading-relaxed">
                    <ChevronRight size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200 block mb-1">Today's Sales & Margin</strong>
                      Computes total invoices processed today and displays the net profit margin after subtracting cost prices from selling prices.
                    </div>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex gap-3 text-xs leading-relaxed">
                    <ChevronRight size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200 block mb-1">Low Stock alerts</strong>
                      Alerts generated when total stock drops below the minimum reorder point. Alerts are synchronized dynamically in the system navbar.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* POS Billing Guide */}
            {path === '/pos' && (
              <>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2 mb-2">
                    <Calculator size={16} /> POS Billing Engine
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    SmartRetail 360 uses a sequential billing engine to ensure error-free calculations. Discounts and taxes are applied strictly in order to prevent compliance issues.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Sequential Billing Chain</h5>
                  <div className="border-l-2 border-purple-500/30 pl-4 space-y-3">
                    <div className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                      <strong className="text-slate-200 block">1. Item Discount</strong>
                      Reduces the base cost of specific items individually.
                    </div>
                    <div className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                      <strong className="text-slate-200 block">2. Combo Offers</strong>
                      Applies a 10% discount on order lines with 3 or more quantities.
                    </div>
                    <div className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                      <strong className="text-slate-200 block">3. Membership Tier</strong>
                      Reduces subtotal by Silver (5%), Gold (10%), or Premium (15%) levels.
                    </div>
                    <div className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                      <strong className="text-slate-200 block">4. Coupons & Promotions</strong>
                      Applies code modifiers (e.g. SAVE10) with safety thresholds.
                    </div>
                    <div className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                      <strong className="text-slate-200 block">5. GST Routing (Taxable Value)</strong>
                      Calculates tax. Splits into **CGST + SGST** if the customer is local, or **IGST** if interstate.
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex gap-2">
                  <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-slate-300 leading-relaxed">
                    Use the <strong>Math Engine</strong> tab to simulate calculations step-by-step using actual inputs!
                  </p>
                </div>
              </>
            )}

            {/* Inventory Guide */}
            {path === '/inventory' && (
              <>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2 mb-2">
                    <Layers size={16} /> Inventory Module
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Manages live stock counts across multiple warehouse locations, automatically monitoring reorder levels to prevent out-of-stock items.
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Features Explained</h5>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-slate-200 block mb-1">SKU & Barcodes</strong>
                    Generates barcodes automatically when products are added. Supports standard scanners during checkout on the POS view.
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-slate-200 block mb-1">Multi-Warehouse Allocation</strong>
                    Divides inventory among different branches. Moving stock requires registering warehouse transfers in settings.
                  </div>
                </div>
              </>
            )}

            {/* Customers & Loyalty Guide */}
            {path === '/customers' && (
              <>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2 mb-2">
                    <Award size={16} /> Loyalty & Reward points
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Engage customers through gamified rewards and tiered benefits. Purchase totals automatically convert to points and upgrade customer tiers.
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Membership Benefits</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950/40 border border-slate-850 p-2 rounded-xl text-center">
                      <span className="text-slate-300 text-xs font-semibold block">Silver</span>
                      <span className="text-purple-400 font-bold text-sm">5% Off</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Earning: 1x</span>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-850 p-2 rounded-xl text-center border-purple-500/20">
                      <span className="text-slate-300 text-xs font-semibold block">Gold</span>
                      <span className="text-purple-400 font-bold text-sm">10% Off</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Earning: 1.5x</span>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-850 p-2 rounded-xl text-center border-purple-500/30">
                      <span className="text-slate-300 text-xs font-semibold block">Premium</span>
                      <span className="text-purple-400 font-bold text-sm">15% Off</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Earning: 2x</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* AI Panel Guide */}
            {path === '/ai-panel' && (
              <>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2 mb-2">
                    <Sparkles size={16} /> AI Analytics & Anomalies
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Our AI models analyze transaction logs to segment customers, forecast supply demand, and flag fraudulent activities automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider">AI Engines Explained</h5>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-slate-200 block mb-1">RFM Segmentation</strong>
                    Clusters customers into: VIP, loyal, high-risk, or lost based on shopping behaviors. Allows targeting marketing offers.
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-slate-200 block mb-1">Demand Forecasting</strong>
                    Computes three-month sales projections using historical trends to help inventory managers procure items before stockouts occur.
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-slate-200 block mb-1">Fraud Detection Alerts</strong>
                    Identifies double-invoiced checkouts, refund irregularities (abnormal values), and coupon code abuse attempts.
                  </div>
                </div>
              </>
            )}

            {/* Default Page Guide fallback */}
            {path !== '/' && path !== '/pos' && path !== '/inventory' && path !== '/customers' && path !== '/ai-panel' && (
              <div className="text-center py-12 text-slate-500 text-xs">
                <HelpCircle size={36} className="mx-auto text-slate-600 mb-3" />
                Select a tab above or browse other workspace screens for helper topics.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Billing Math Engine Simulator */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Calculator size={16} className="text-purple-400" /> Math Engine Inputs
              </h4>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-400 mb-1">Subtotal (INR)</label>
                  <input
                    type="number"
                    value={simSubtotal}
                    onChange={(e) => setSimSubtotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-semibold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Item Discount (INR)</label>
                    <input
                      type="number"
                      value={simItemDisc}
                      onChange={(e) => setSimItemDisc(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-semibold focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">GST Rate (%)</label>
                    <select
                      value={simGstRate}
                      onChange={(e) => setSimGstRate(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-semibold focus:border-purple-500 focus:outline-none"
                    >
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Customer Level</label>
                    <select
                      value={simMemberTier}
                      onChange={(e) => setSimMemberTier(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-semibold focus:border-purple-500 focus:outline-none"
                    >
                      <option value="walkin">Walk-in (0%)</option>
                      <option value="silver">Silver Member (5%)</option>
                      <option value="gold">Gold Member (10%)</option>
                      <option value="premium">Premium Member (15%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Coupon Applied</label>
                    <select
                      value={simCouponCode}
                      onChange={(e) => setSimCouponCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-semibold focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">None</option>
                      <option value="SAVE10">SAVE10 (10% off)</option>
                      <option value="FLAT100">FLAT100 (Flat 100)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 bg-slate-900/30 rounded-lg px-2 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simHasCombo"
                      checked={simHasCombo}
                      onChange={(e) => setSimHasCombo(e.target.checked)}
                      className="rounded accent-purple-600 cursor-pointer"
                    />
                    <label htmlFor="simHasCombo" className="text-slate-300 font-semibold cursor-pointer">Combo Deal? (Buy 3+ items)</label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 bg-slate-900/30 rounded-lg px-2 border border-slate-800">
                  <span className="text-slate-300 font-semibold">Interstate Trade?</span>
                  <button
                    type="button"
                    onClick={() => setSimIsInterstate(!simIsInterstate)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-all focus:outline-none ${
                      simIsInterstate ? 'bg-purple-600 flex justify-end' : 'bg-slate-700 flex justify-start'
                    }`}
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md block"></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Calculations Engine Output */}
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 text-xs space-y-2.5">
              <h4 className="font-bold text-sm text-purple-400 border-b border-purple-500/10 pb-1.5 flex justify-between items-center">
                <span>Calculation Trace</span>
                <span className="text-[10px] bg-purple-500/15 px-2 py-0.5 rounded-full font-semibold">Sequence order</span>
              </h4>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">1. Subtotal (MRP)</span>
                <span className="font-semibold text-slate-100">₹{simSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span>2. Item Discount (-)</span>
                <span>₹{itemDiscount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span>3. Combo Offer Discount (-)</span>
                <span>₹{comboDiscount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span>4. Member Level Off (-)</span>
                <span>₹{memberDiscount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span>5. Coupon Discount (-)</span>
                <span>₹{couponDiscount.toFixed(2)}</span>
              </div>

              <div className="h-px bg-slate-800 my-1"></div>

              <div className="flex justify-between items-center font-bold text-slate-200">
                <span>6. Taxable Value (Base)</span>
                <span>₹{taxableValue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-amber-400">
                <span>7. GST Total ({simGstRate}%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>

              {isInterstate ? (
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800 flex justify-between text-[10px] text-slate-400 leading-normal">
                  <span>Routing to Central IGST (Interstate):</span>
                  <span className="font-semibold text-slate-300">IGST: ₹{gstAmount.toFixed(2)} (Destination: {customerState})</span>
                </div>
              ) : (
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800 flex justify-between text-[10px] text-slate-400 leading-normal">
                  <span>Routing local Karnataka Trade (50/50):</span>
                  <span className="font-semibold text-slate-300">CGST ({(simGstRate/2).toFixed(1)}%): ₹{(gstAmount/2).toFixed(2)}<br/>SGST ({(simGstRate/2).toFixed(1)}%): ₹{(gstAmount/2).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400 text-[10px]">
                <span>8. Round-off adjustment</span>
                <span>₹{roundOff >= 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
              </div>

              <div className="h-px bg-slate-800 my-1"></div>

              <div className="flex justify-between items-center font-extrabold text-sm text-slate-100 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                <span className="text-purple-400">Final Total Amount</span>
                <span className="text-slate-100">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Glossary Tab */}
        {activeTab === 'glossary' && (
          <div className="space-y-3">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs leading-relaxed flex gap-2">
              <Info className="text-purple-400 shrink-0 mt-0.5" size={16} />
              <span className="text-slate-300">Use this lookup index to search definitions for common retail and enterprise terminology configured in this platform.</span>
            </div>

            <div className="space-y-3 mt-4">
              {glossaryItems.map((item, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                  <strong className="text-xs text-purple-400 block mb-1">{item.term}</strong>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ERPGuide;
