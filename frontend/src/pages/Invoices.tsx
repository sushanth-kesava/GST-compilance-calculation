import React, { useEffect, useState, useCallback } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { 
  Receipt, Search, Download, Filter, 
  ArrowUpDown, Mail, CheckCircle,
  X, FileText, Printer
} from 'lucide-react';
import { useToast } from '../components/Toast';

interface InvoiceItem {
  productName: string;
  quantity: number;
  gstPercentage: number;
  totalAmount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerState: string;
  paymentMethod: string;
  subtotal: number;
  itemDiscount: number;
  comboDiscount: number;
  membershipDiscount: number;
  couponDiscount: number;
  storePromotionDiscount: number;
  taxableValue: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  finalAmount: number;
  items: InvoiceItem[];
  createdAt: string;
  rewardPointsEarned: number;
  rewardPointsRedeemed: number;
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [emailModal, setEmailModal] = useState<{ open: boolean; invoiceId: string }>({ open: false, invoiceId: '' });
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const { toast } = useToast();

  const fetchInvoices = useCallback(async () => {
    try {
      const res: any = await api.get('/invoices');
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch (err) {
      toast('error', 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter & sort
  useEffect(() => {
    let result = [...invoices];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.customerName.toLowerCase().includes(term) ||
          inv.customerPhone.includes(term)
      );
    }

    if (paymentFilter) {
      result = result.filter((inv) => inv.paymentMethod === paymentFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredInvoices(result);
  }, [invoices, searchTerm, paymentFilter, sortOrder]);

  const downloadPdf = (invoiceId: string) => {
    window.open(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, '_blank');
  };

  const handleEmailInvoice = async () => {
    if (!emailAddress.trim()) {
      toast('error', 'Please enter an email address.');
      return;
    }
    setSendingEmail(true);
    try {
      const res: any = await api.post(`/invoices/${emailModal.invoiceId}/email?email=${encodeURIComponent(emailAddress)}`);
      if (res.success) {
        toast('success', res.message);
        setEmailModal({ open: false, invoiceId: '' });
        setEmailAddress('');
      }
    } catch (err) {
      toast('error', 'Failed to send invoice via email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrintReceipt = (invoice: Invoice) => {
    // Open a printable receipt view
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const itemsHtml = invoice.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px dashed #ccc;">${item.productName}</td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px dashed #ccc;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px dashed #ccc;">INR ${item.totalAmount.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Receipt - ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 300px; margin: 20px auto; font-size: 12px; }
          h2 { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .total { font-weight: bold; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h2>SMARTRETAIL 360</h2>
        <p style="text-align:center;">GSTIN: 29AAAAA1111A1Z1</p>
        <div class="line"></div>
        <p>Invoice: ${invoice.invoiceNumber}</p>
        <p>Date: ${new Date(invoice.createdAt).toLocaleString()}</p>
        <p>Customer: ${invoice.customerName}</p>
        <p>Payment: ${invoice.paymentMethod}</p>
        <div class="line"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="line"></div>
        <p>Subtotal: INR ${invoice.subtotal.toFixed(2)}</p>
        <p>Discount: -INR ${(invoice.itemDiscount + invoice.comboDiscount + invoice.membershipDiscount + invoice.couponDiscount + invoice.storePromotionDiscount).toFixed(2)}</p>
        <p>Taxable: INR ${invoice.taxableValue.toFixed(2)}</p>
        <p>GST: INR ${invoice.gstAmount.toFixed(2)}</p>
        <p>Round Off: INR ${invoice.roundOff.toFixed(2)}</p>
        <div class="line"></div>
        <p class="total">Net Payable: INR ${invoice.finalAmount}</p>
        <div class="line"></div>
        <p style="text-align:center; font-size:10px;">Thank you for your business!</p>
        <script>window.print();window.close();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const paymentMethods = ['CASH', 'CARD', 'UPI', 'WALLET', 'SPLIT'];

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
          <h1 className="font-bold text-2xl text-foreground">Invoice History</h1>
          <p className="text-sm text-muted-foreground">View, search, download and email all generated invoices.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-xl px-3 py-2">
          <FileText size={14} />
          <span>{filteredInvoices.length} of {invoices.length} invoices</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, customer name, phone..."
            className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">All Payments</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-all"
        >
          <ArrowUpDown size={14} />
          <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
        </button>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
            <Receipt size={42} className="stroke-[1.5]" />
            <p className="text-xs">No invoices found. Process a checkout in POS to generate invoices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 font-semibold">Invoice #</th>
                  <th className="py-3 font-semibold">Customer</th>
                  <th className="py-3 font-semibold">Date</th>
                  <th className="py-3 font-semibold">Payment</th>
                  <th className="py-3 font-semibold text-right">Subtotal</th>
                  <th className="py-3 font-semibold text-right">GST</th>
                  <th className="py-3 font-semibold text-right">Net Amount</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border hover:bg-muted/20 cursor-pointer"
                    onClick={() => setSelectedInvoice(selectedInvoice?.id === inv.id ? null : inv)}
                  >
                    <td className="py-3 font-bold text-primary">{inv.invoiceNumber}</td>
                    <td className="py-3 font-medium text-foreground">{inv.customerName}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString()}
                      <br />
                      <span className="text-[10px]">{new Date(inv.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-3">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right text-foreground">INR {inv.subtotal.toFixed(2)}</td>
                    <td className="py-3 text-right text-foreground">INR {inv.gstAmount.toFixed(2)}</td>
                    <td className="py-3 text-right font-bold text-foreground">INR {inv.finalAmount}</td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadPdf(inv.id); }}
                          className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-all"
                          title="Download PDF"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrintReceipt(inv); }}
                          className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-all"
                          title="Print Receipt"
                        >
                          <Printer size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEmailModal({ open: true, invoiceId: inv.id }); }}
                          className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-all"
                          title="Email Invoice"
                        >
                          <Mail size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EXPANDED INVOICE DETAILS */}
      {selectedInvoice && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Receipt size={20} className="text-primary" />
                {selectedInvoice.invoiceNumber}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(selectedInvoice.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadPdf(selectedInvoice.id)}
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-all"
              >
                <Download size={14} />
                PDF
              </button>
              <button
                onClick={() => setEmailModal({ open: true, invoiceId: selectedInvoice.id })}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-semibold hover:bg-blue-500/20 transition-all"
              >
                <Mail size={14} />
                Email
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground">Customer</p>
              <p className="font-semibold text-foreground">{selectedInvoice.customerName}</p>
              <p className="text-[10px] text-muted-foreground">{selectedInvoice.customerPhone}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground">State / GST Route</p>
              <p className="font-semibold text-foreground">{selectedInvoice.customerState}</p>
              <p className="text-[10px] text-muted-foreground">
                {selectedInvoice.igst > 0 ? 'IGST (Interstate)' : 'CGST+SGST (Local)'}
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground">Payment Method</p>
              <p className="font-semibold text-foreground uppercase">{selectedInvoice.paymentMethod}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground">Reward Points</p>
              <p className="font-semibold text-amber-600">
                {selectedInvoice.rewardPointsRedeemed > 0
                  ? `Redeemed: ${selectedInvoice.rewardPointsRedeemed}`
                  : '—'}
              </p>
              <p className="text-[10px] text-emerald-600">Earned: {selectedInvoice.rewardPointsEarned}</p>
            </div>
          </div>

          {/* Items table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="py-2.5 px-3 text-left font-semibold">Item</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
                  <th className="py-2.5 px-3 text-right font-semibold">MRP</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Selling Price</th>
                  <th className="py-2.5 px-3 text-right font-semibold">GST %</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="py-2.5 px-3 font-medium text-foreground">{item.productName}</td>
                    <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right">—</td>
                    <td className="py-2.5 px-3 text-right">—</td>
                    <td className="py-2.5 px-3 text-right">{item.gstPercentage}%</td>
                    <td className="py-2.5 px-3 text-right font-bold">INR {item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>INR {selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Item Discount</span>
                <span>-INR {selectedInvoice.itemDiscount.toFixed(2)}</span>
              </div>
              {selectedInvoice.comboDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Combo Discount</span>
                  <span>-INR {selectedInvoice.comboDiscount.toFixed(2)}</span>
                </div>
              )}
              {selectedInvoice.membershipDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Membership Discount</span>
                  <span>-INR {selectedInvoice.membershipDiscount.toFixed(2)}</span>
                </div>
              )}
              {selectedInvoice.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span>-INR {selectedInvoice.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1">
                <span>Taxable Value</span>
                <span>INR {selectedInvoice.taxableValue.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {selectedInvoice.igst > 0 ? (
                <div className="flex justify-between">
                  <span>IGST (Interstate)</span>
                  <span>INR {selectedInvoice.igst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST</span>
                    <span>INR {selectedInvoice.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST</span>
                    <span>INR {selectedInvoice.sgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Round Off</span>
                <span>INR {selectedInvoice.roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-1">
                <span>Net Payable</span>
                <span className="text-primary">INR {selectedInvoice.finalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL MODAL */}
      {emailModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border text-foreground rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-primary" />
              <h3 className="font-bold text-lg">Email Invoice</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Send this invoice as a PDF attachment to the customer's email address.
            </p>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="customer@example.com"
              className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setEmailModal({ open: false, invoiceId: '' }); setEmailAddress(''); }}
                className="px-4 py-2 border border-border rounded-xl text-xs hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailInvoice}
                disabled={sendingEmail}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>Send Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
