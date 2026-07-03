import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, Trash2, Receipt, 
  Sparkles, FolderDown, Inbox 
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  membershipTier: string;
  state: string;
  rewardPoints: number;
  walletBalance: number;
}

const POS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Hold invoice storage
  const [holdInvoices, setHoldInvoices] = useState<any[]>([]);

  // Customer states
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Discount states
  const [couponCode, setCouponCode] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [storePromoDiscount, setStorePromoDiscount] = useState('0');

  // Checkout states
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [splitUpi, setSplitUpi] = useState('0');
  const [splitCard, setSplitCard] = useState('0');
  const [splitCash, setSplitCash] = useState('0');

  // Receipt Modal
  const [receiptInvoice, setReceiptInvoice] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Store profile default
  const storeState = 'Karnataka';

  // Find Products
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res: any = await api.get(`/products/search?term=${term}`);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      searchProducts(searchTerm);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        mrp: product.mrp || product.sellingPrice,
        sellingPrice: product.sellingPrice,
        gstPercentage: product.gstPercentage || 18,
        quantity: 1
      }];
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => 
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Find Customer by phone
  const searchCustomer = async () => {
    if (!customerPhone.trim()) return;
    try {
      const res: any = await api.get(`/customers/${customerPhone}`);
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
      } else {
        alert('Customer profile not found');
      }
    } catch (err) {
      alert('Error fetching customer records');
    }
  };

  // Dynamic calculations simulation matching backend sequence
  const getCalculations = () => {
    let subtotal = 0;
    let itemDiscount = 0;
    let comboDiscount = 0;

    cart.forEach((item) => {
      subtotal += item.mrp * item.quantity;
      itemDiscount += (item.mrp - item.sellingPrice) * item.quantity;
      // combo discount: 10% off selling price if qty >= 3
      if (item.quantity >= 3) {
        comboDiscount += (item.sellingPrice * item.quantity) * 0.10;
      }
    });

    let currentSum = subtotal - itemDiscount - comboDiscount;
    if (currentSum < 0) currentSum = 0;

    // Membership discount
    let membershipDiscount = 0;
    if (selectedCustomer) {
      const tier = selectedCustomer.membershipTier.toUpperCase();
      if (tier === 'SILVER') membershipDiscount = currentSum * 0.05;
      else if (tier === 'GOLD') membershipDiscount = currentSum * 0.10;
      else if (tier === 'PREMIUM') membershipDiscount = currentSum * 0.15;
    }
    currentSum -= membershipDiscount;

    // Coupon discount
    let couponDiscount = 0;
    if (couponCode.toUpperCase() === 'WELCOME10') {
      couponDiscount = currentSum * 0.10;
    } else if (couponCode.toUpperCase() === 'BIGSALE') {
      couponDiscount = Math.min(200, currentSum);
    }
    currentSum -= couponDiscount;

    // Promo discount
    const promoVal = parseFloat(storePromoDiscount) || 0;
    const storePromotionDiscount = Math.min(promoVal, currentSum);
    currentSum -= storePromotionDiscount;

    // Points discount
    let pointsDiscount = 0;
    if (selectedCustomer && redeemPoints) {
      const maxPointsVal = currentSum * 0.20;
      pointsDiscount = Math.min(selectedCustomer.rewardPoints, maxPointsVal);
      currentSum -= pointsDiscount;
    }

    const taxableValue = currentSum;

    // GST apportionment
    let totalGst = 0;
    cart.forEach((item) => {
      const itemBase = item.mrp * item.quantity;
      const ratio = subtotal > 0 ? itemBase / subtotal : 0;
      const shareDiscount = (itemDiscount + comboDiscount + membershipDiscount + couponDiscount + storePromotionDiscount + pointsDiscount) * ratio;
      const itemTaxable = Math.max(0, itemBase - shareDiscount);
      totalGst += itemTaxable * (item.gstPercentage / 100);
    });

    const netPayable = taxableValue + totalGst;
    const roundedPayable = Math.round(netPayable);
    const roundOff = roundedPayable - netPayable;

    // Tax state route
    const customerState = selectedCustomer?.state || storeState;
    const isLocal = customerState.toLowerCase() === storeState.toLowerCase();

    return {
      subtotal,
      itemDiscount,
      comboDiscount,
      membershipDiscount,
      couponDiscount,
      storePromotionDiscount: storePromotionDiscount + pointsDiscount,
      taxableValue,
      gstAmount: totalGst,
      cgst: isLocal ? totalGst / 2 : 0,
      sgst: isLocal ? totalGst / 2 : 0,
      igst: !isLocal ? totalGst : 0,
      roundOff,
      finalAmount: roundedPayable
    };
  };

  const calcs = getCalculations();

  // Checkout API payload submit
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Validate split calculations
    const details: any = {};
    if (paymentMethod === 'SPLIT') {
      const cash = parseFloat(splitCash) || 0;
      const card = parseFloat(splitCard) || 0;
      const upi = parseFloat(splitUpi) || 0;
      if (cash + card + upi !== calcs.finalAmount) {
        alert(`Split total (${cash + card + upi}) does not match net payable (${calcs.finalAmount})`);
        return;
      }
      details.CASH = cash;
      details.CARD = card;
      details.UPI = upi;
    }

    const payload = {
      customerId: selectedCustomer?.id || null,
      items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      couponCode,
      storePromotionDiscount: parseFloat(storePromoDiscount) || 0,
      paymentMethod,
      splitDetails: details,
      redeemPoints
    };

    try {
      const res: any = await api.post('/invoices/checkout', payload);
      if (res.success && res.data) {
        setReceiptInvoice(res.data);
        setShowReceiptModal(true);
        // Clear pos session
        setCart([]);
        setSelectedCustomer(null);
        setCustomerPhone('');
        setCouponCode('');
        setRedeemPoints(false);
        setStorePromoDiscount('0');
      }
    } catch (err: any) {
      alert(err.message || 'Checkout compilation error.');
    }
  };

  // Hold Pos invoice cart state
  const holdInvoice = () => {
    if (cart.length === 0) return;
    const hold = {
      id: Date.now(),
      cart,
      customer: selectedCustomer,
      customerPhone
    };
    setHoldInvoices((prev) => [...prev, hold]);
    setCart([]);
    setSelectedCustomer(null);
    setCustomerPhone('');
  };

  const resumeHold = (hold: any) => {
    setCart(hold.cart);
    setSelectedCustomer(hold.customer);
    setCustomerPhone(hold.customerPhone);
    setHoldInvoices((prev) => prev.filter((h) => h.id !== hold.id));
  };

  const downloadPdf = (invoiceId: string) => {
    window.open(`http://localhost:8080/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT: CART ENTRY */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground">Scan Barcode / Search Catalog</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Scan item barcode or search by name / SKU..."
              className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-xs focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Search results popover */}
          {searchResults.length > 0 && (
            <div className="border border-border rounded-xl bg-card divide-y divide-border overflow-hidden">
              {searchResults.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-3 hover:bg-muted/50 flex justify-between items-center cursor-pointer text-xs transition-all"
                >
                  <div>
                    <p className="font-bold text-foreground">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground">SKU: {product.sku} | Stock: {product.totalStock}</p>
                  </div>
                  <span className="font-bold text-primary">INR {product.sellingPrice}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CART TABLE */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-foreground">Shopping pos Cart ({cart.length} unique items)</h3>
            {holdInvoices.length > 0 && (
              <span className="text-xs text-amber-500 font-semibold">{holdInvoices.length} checkouts on hold</span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
              <Inbox size={42} className="stroke-[1.5]" />
              <p className="text-xs">Your shopping POS cart is empty. Scan barcode or find items.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 font-semibold">Item</th>
                    <th className="py-2.5 font-semibold">Price</th>
                    <th className="py-2.5 font-semibold">Quantity</th>
                    <th className="py-2.5 font-semibold">GST %</th>
                    <th className="py-2.5 font-semibold text-right">Total</th>
                    <th className="py-2.5 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/20">
                      <td className="py-3">
                        <p className="font-bold text-foreground">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">SKU: {item.sku}</p>
                      </td>
                      <td className="py-3 font-medium text-foreground">
                        {item.mrp > item.sellingPrice && (
                          <span className="line-through text-[10px] text-muted-foreground mr-1.5">INR {item.mrp}</span>
                        )}
                        <span>INR {item.sellingPrice}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 border border-border rounded-lg bg-background hover:bg-muted font-bold text-sm text-foreground flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-foreground">{item.quantity}</span>
                          <button 
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 border border-border rounded-lg bg-background hover:bg-muted font-bold text-sm text-foreground flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-muted-foreground">{item.gstPercentage}%</td>
                      <td className="py-3 text-right font-bold text-foreground">
                        INR {(item.sellingPrice * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RESUME HELD CARTS */}
        {holdInvoices.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Suspended POS Checks</h4>
            <div className="grid grid-cols-2 gap-3">
              {holdInvoices.map((hold) => (
                <div 
                  key={hold.id}
                  onClick={() => resumeHold(hold)}
                  className="p-3 border border-border hover:border-primary rounded-xl cursor-pointer hover:bg-primary/5 transition-all text-xs flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-foreground">Customer: {hold.customer?.name || 'Walk-in'}</p>
                    <p className="text-[10px] text-muted-foreground">{hold.cart.length} items on hold</p>
                  </div>
                  <FolderDown size={16} className="text-primary" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: POS BILL SUMMARY */}
      <div className="space-y-6">
        {/* Customer select */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-foreground">Billed Customer</h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">GST Route</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Search Customer Phone..."
              className="flex-1 bg-background border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
            />
            <button 
              onClick={searchCustomer}
              className="px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition-all"
            >
              Verify
            </button>
          </div>

          {selectedCustomer ? (
            <div className="p-3 bg-primary/5 rounded-xl text-xs space-y-1.5 border border-primary/10">
              <div className="flex justify-between font-bold text-foreground">
                <span>{selectedCustomer.name}</span>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.2 rounded-md uppercase font-bold">
                  {selectedCustomer.membershipTier} Member
                </span>
              </div>
              <p className="text-muted-foreground text-[10px]">Phone: {selectedCustomer.phone} | State: {selectedCustomer.state}</p>
              <div className="flex justify-between text-[10px] pt-1.5 border-t border-border mt-1.5">
                <span className="text-amber-600 font-semibold">Points: {selectedCustomer.rewardPoints}</span>
                <span className="text-emerald-600 font-semibold">Wallet: INR {selectedCustomer.walletBalance}</span>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">Default to Walk-in client. GST defaults to local CGST/SGST trade.</p>
          )}
        </div>

        {/* Discounts controls */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-foreground">Coupons & Loyalty Toggles</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Coupon code</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="WELCOME10, BIGSALE..."
                className="w-full bg-background border border-border rounded-xl py-2 px-3 focus:outline-none focus:border-primary uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Ad-hoc Store Promo (INR)</label>
              <input
                type="number"
                value={storePromoDiscount}
                onChange={(e) => setStorePromoDiscount(e.target.value)}
                placeholder="0"
                className="w-full bg-background border border-border rounded-xl py-2 px-3 focus:outline-none focus:border-primary"
              />
            </div>

            {selectedCustomer && selectedCustomer.rewardPoints > 0 && (
              <label className="flex items-center gap-2.5 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.checked)}
                  className="rounded text-primary border-border focus:ring-primary w-4 h-4"
                />
                <span className="text-amber-600 font-bold">Redeem loyalty points (available: {selectedCustomer.rewardPoints})</span>
              </label>
            )}
          </div>
        </div>

        {/* Split check controls */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-foreground">Payment Method</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['CASH', 'CARD', 'UPI', 'WALLET', 'SPLIT'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                  paymentMethod === method
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'SPLIT' && (
            <div className="space-y-2 mt-3 pt-3 border-t border-border text-xs">
              <div className="flex items-center gap-2">
                <span className="w-12 text-muted-foreground">CASH:</span>
                <input
                  type="number"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-muted-foreground">CARD:</span>
                <input
                  type="number"
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-muted-foreground">UPI:</span>
                <input
                  type="number"
                  value={splitUpi}
                  onChange={(e) => setSplitUpi(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2.5"
                />
              </div>
            </div>
          )}
        </div>

        {/* FINAL BILL CALCULATION SUMMARY */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3.5">
          <h3 className="font-bold text-sm text-foreground">Tax Invoice Calculation Preview</h3>

          <div className="space-y-2 text-xs border-b border-border pb-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>INR {calcs.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Item Discounts:</span>
              <span>- INR {calcs.itemDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Combo Offers (Qty &gt;= 3):</span>
              <span>- INR {calcs.comboDiscount.toFixed(2)}</span>
            </div>
            {calcs.membershipDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Membership tier discount:</span>
                <span>- INR {calcs.membershipDiscount.toFixed(2)}</span>
              </div>
            )}
            {calcs.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Applied:</span>
                <span>- INR {calcs.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {calcs.storePromotionDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Loyalty / Store Promo:</span>
                <span>- INR {calcs.storePromotionDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border mt-1">
              <span>Taxable Value:</span>
              <span>INR {calcs.taxableValue.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs border-b border-border pb-3 text-muted-foreground">
            {calcs.igst > 0 ? (
              <div className="flex justify-between font-medium">
                <span>IGST (Interstate):</span>
                <span>INR {calcs.igst.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>CGST (Local Central):</span>
                  <span>INR {calcs.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (Local State):</span>
                  <span>INR {calcs.sgst.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span>Round Off Adjust:</span>
              <span>INR {calcs.roundOff.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Net Payable</p>
              <h2 className="text-2xl font-black text-foreground">INR {calcs.finalAmount}</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={holdInvoice}
                className="p-3 bg-secondary text-secondary-foreground hover:bg-muted font-bold rounded-xl transition-all"
                title="Hold Checkout"
              >
                Hold
              </button>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="px-6 py-3 bg-primary text-primary-foreground disabled:opacity-50 font-black rounded-xl hover:bg-primary/95 transition-all flex gap-2 items-center"
              >
                <Sparkles size={16} />
                <span>Pay & Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceiptModal && receiptInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border text-foreground rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <Receipt className="text-primary" size={24} />
                <h3 className="font-bold text-lg">Transaction Tax Invoice</h3>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="border border-border rounded-2xl p-4 bg-muted/10 text-xs space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="text-center border-b border-border pb-3 space-y-1">
                <h4 className="font-extrabold text-sm uppercase">SmartRetail 360 Flagship</h4>
                <p className="text-muted-foreground">GSTIN: 29AAAAA1111A1Z1 | State: Karnataka</p>
                <p className="text-[10px] text-muted-foreground mt-2">Invoice: {receiptInvoice.invoiceNumber}</p>
                <p className="text-[10px] text-muted-foreground">Date: {new Date(receiptInvoice.createdAt).toLocaleString()}</p>
              </div>

              <div className="space-y-1 text-muted-foreground">
                <p><span className="font-semibold text-foreground">Customer:</span> {receiptInvoice.customerName}</p>
                <p><span className="font-semibold text-foreground">State Code:</span> {receiptInvoice.customerState}</p>
                <p><span className="font-semibold text-foreground">Payment Method:</span> {receiptInvoice.paymentMethod}</p>
              </div>

              {/* Items */}
              <div className="space-y-2 border-t border-b border-border py-3">
                <div className="grid grid-cols-5 text-muted-foreground font-bold mb-1">
                  <span className="col-span-2">Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">GST %</span>
                  <span className="text-right">Amount</span>
                </div>
                {receiptInvoice.items.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-5 text-foreground">
                    <span className="col-span-2 font-semibold">{item.productName}</span>
                    <span className="text-center">{item.quantity}</span>
                    <span className="text-right">{item.gstPercentage}%</span>
                    <span className="text-right font-bold">INR {item.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-b border-border pb-3 text-right">
                <p className="text-muted-foreground">Subtotal: <span className="text-foreground font-semibold">INR {receiptInvoice.subtotal.toFixed(2)}</span></p>
                <p className="text-muted-foreground">Item Discount: <span className="text-foreground font-semibold">INR {receiptInvoice.itemDiscount.toFixed(2)}</span></p>
                {receiptInvoice.membershipDiscount > 0 && <p className="text-muted-foreground">Membership Discount: <span className="text-foreground font-semibold">INR {receiptInvoice.membershipDiscount.toFixed(2)}</span></p>}
                {receiptInvoice.couponDiscount > 0 && <p className="text-muted-foreground">Coupon: <span className="text-foreground font-semibold">INR {receiptInvoice.couponDiscount.toFixed(2)}</span></p>}
                <p className="text-muted-foreground font-bold">Taxable Value: <span className="text-foreground font-extrabold">INR {receiptInvoice.taxableValue.toFixed(2)}</span></p>
                
                {receiptInvoice.igst > 0 ? (
                  <p className="text-muted-foreground">IGST Collected: <span className="text-foreground font-semibold">INR {receiptInvoice.igst.toFixed(2)}</span></p>
                ) : (
                  <>
                    <p className="text-muted-foreground">CGST (9%): <span className="text-foreground font-semibold">INR {receiptInvoice.cgst.toFixed(2)}</span></p>
                    <p className="text-muted-foreground">SGST (9%): <span className="text-foreground font-semibold">INR {receiptInvoice.sgst.toFixed(2)}</span></p>
                  </>
                )}
                
                <p className="text-muted-foreground">Round Off: <span className="text-foreground font-semibold">INR {receiptInvoice.roundOff.toFixed(2)}</span></p>
                <p className="text-sm font-black text-foreground">Net Paid: <span className="text-primary font-black text-lg">INR {receiptInvoice.finalAmount}</span></p>
              </div>

              <div className="text-center text-[10px] text-muted-foreground leading-normal pt-2">
                <p className="font-bold uppercase">System Generated Invoice</p>
                <p>Digital signature verification matches serial keys.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => downloadPdf(receiptInvoice.id)}
                className="flex-1 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POS;
