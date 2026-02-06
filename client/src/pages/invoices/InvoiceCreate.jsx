import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import InvoicePreview from './InvoicePreview';
import { calculateInvoicePreview } from '../../services/invoiceCalc';

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [documentNumber, setDocumentNumber] = useState('');

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');

  const [openingBalance, setOpeningBalance] = useState(0);
  const [ledgerType, setLedgerType] = useState(''); // 'CREDIT' | 'DEBIT'
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [useAvailableBalance, setUseAvailableBalance] = useState(true);

  const [items, setItems] = useState([{ name: '', quantity: 1, rate: 0, gstPercent: 0, otherTaxes: [] }]);

  const computed = useMemo(
    () =>
      calculateInvoicePreview({
        items,
        invoiceLevelGstPercent: undefined,
        openingBalance,
        ledgerType,
        paidAmount: paidAmount || 0,
        useAvailableBalance,
      }),
    [items, openingBalance, ledgerType, paidAmount, useAvailableBalance]
  );

  const previewInvoice = useMemo(
    () => ({
      customerDetails,
      invoiceDate,
      dueDate: dueDate || null,
      status: 'DRAFT',
      items: computed.items,
      subtotal: computed.subtotal,
      gstTotal: computed.gstTotal,
      otherTaxTotal: computed.otherTaxTotal,
      grandTotal: computed.grandTotal,
      openingBalance: computed.openingBalance,
      paidAmount: computed.paidAmount,
      useAvailableBalance: computed.useAvailableBalance,
      remainingBalance: computed.remainingBalance,
      finalPayableAmount: computed.finalPayableAmount,
    }),
    [customerDetails, invoiceDate, dueDate, computed]
  );

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', quantity: 1, rate: 0, gstPercent: 0, otherTaxes: [] }]);
  };

  const addOtherTax = (idx) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, otherTaxes: [...(it.otherTaxes || []), { name: '', percent: 0 }] } : it
      )
    );
  };

  const updateOtherTax = (itemIdx, taxIdx, patch) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const taxes = Array.isArray(it.otherTaxes) ? it.otherTaxes : [];
        return {
          ...it,
          otherTaxes: taxes.map((t, j) => (j === taxIdx ? { ...t, ...patch } : t)),
        };
      })
    );
  };

  const removeOtherTax = (itemIdx, taxIdx) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const taxes = Array.isArray(it.otherTaxes) ? it.otherTaxes : [];
        return {
          ...it,
          otherTaxes: taxes.filter((_, j) => j !== taxIdx),
        };
      })
    );
  };

  const fetchOpeningBalance = async () => {
    setError('');
    const name = customerDetails.name.trim();
    if (!name) {
      setError('Customer name is required to fetch opening balance');
      return;
    }
    setFetchingBalance(true);
    try {
      const res = await api.get(`/ledgers/opening-balance/${encodeURIComponent(name)}`);
      setOpeningBalance(Number(res.data?.amount) || 0);
      setLedgerType(res.data?.type || 'CREDIT');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to fetch opening balance');
    } finally {
      setFetchingBalance(false);
    }
  };

  const onSubmit = async () => {
    setError('');
    if (!customerDetails.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!invoiceDate) {
      setError('Invoice date is required');
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      setError('At least one item is required');
      return;
    }

    if (computed.paidAmount > computed.grandTotal) {
      setError('Paid amount cannot exceed invoice total');
      return;
    }
    if (computed.finalPayableAmount < 0) {
      setError('Final payable amount cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/invoices', {
        documentNumber: documentNumber || undefined,
        customerDetails,
        invoiceDate,
        dueDate: dueDate || undefined,
        items,
        paidAmount: paidAmount ? Number(paidAmount) : 0,
        useAvailableBalance,
        status: 'DRAFT',
      });
      navigate(`/dashboard/invoices/${res.data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Create New Invoice</h3>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below to generate a new invoice.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-0.5"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </span>
            ) : 'Save Invoice'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow-sm flex items-center">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column: Form Input */}
        <div className="space-y-6">

          {/* Section: Customer & Invoice Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
              Client & Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                <input
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invoice #</label>
                <input
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="e.g. INV-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invoice Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email (Optional)</label>
                <input
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="billing@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Billing Address</label>
                <textarea
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails((p) => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-y min-h-[80px]"
                  placeholder="Street address, City, State, Zip"
                />
              </div>

              {/* Opening Balance Card within the Card */}
              <div className="md:col-span-2 bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Previous Ledger Balance</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center justify-between border border-blue-200 rounded-lg bg-white px-4 py-2.5 shadow-sm">
                    <span className="font-mono text-gray-800 text-lg">{openingBalance > 0 ? openingBalance : '0.00'}</span>
                    {ledgerType && openingBalance > 0 && (
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${ledgerType === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {ledgerType}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fetchOpeningBalance}
                    disabled={fetchingBalance}
                    className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm active:transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {fetchingBalance ? 'Fetching...' : 'Check Balance'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Fetches the current ledger balance for this customer name.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paid Amount (Advance)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>

                <div className="mt-3">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAvailableBalance}
                      onChange={(e) => setUseAvailableBalance(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition duration-150 ease-in-out"
                    />
                    <span className="ml-2 text-sm text-gray-700">Adjust against previous CREDIT balance</span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Section: Line Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                Line Items
              </h4>
              <button
                onClick={addItem}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add New Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="group relative p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                  <div className="grid grid-cols-12 gap-4">

                    {/* Item Name */}
                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Item Description</label>
                      <input
                        value={it.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Product or Service Name"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                        min="0"
                      />
                    </div>

                    {/* Rate */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                      <input
                        type="number"
                        value={it.rate}
                        onChange={(e) => updateItem(idx, { rate: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>

                    {/* GST */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">GST %</label>
                      <input
                        type="number"
                        value={it.gstPercent ?? 0}
                        onChange={(e) => updateItem(idx, { gstPercent: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                        min="0"
                      />
                    </div>

                    {/* Other Taxes */}
                    <div className="col-span-12 pt-2 border-t border-gray-100 mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-500">Additional Taxes</span>
                        <button onClick={() => addOtherTax(idx)} className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-0.5 rounded transition-colors">
                          + Add
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(it.otherTaxes || []).map((tax, tIdx) => (
                          <div key={tIdx} className="flex gap-2 items-center">
                            <input
                              value={tax.name}
                              onChange={(e) => updateOtherTax(idx, tIdx, { name: e.target.value })}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                              placeholder="Tax Name"
                            />
                            <input
                              type="number"
                              value={tax.percent}
                              onChange={(e) => updateOtherTax(idx, tIdx, { percent: e.target.value })}
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs text-center"
                              placeholder="%"
                            />
                            <button
                              onClick={() => removeOtherTax(idx, tIdx)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Remove Button for Item */}
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 border border-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden shadow-sm"
                    title="Remove Item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
            {items.length === 0 && <div className="text-center p-6 text-gray-500 text-sm">No items added. Click above to add one.</div>}
          </div>

        </div>

        {/* Right Column: Preview */}
        <div className="xl:sticky xl:top-24 space-y-6 h-fit">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden text-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-lg text-gray-100">Live Preview</h4>
              <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 font-mono">DRAFT</span>
            </div>

            {/* Simple Live Summary of Totals */}
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{computed.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>GST Total</span>
                <span>{computed.gstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-700 mt-2">
                <span>Grand Total</span>
                <span className="text-green-400">₹{computed.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-semibold text-gray-800 mb-4 border-b pb-2">Full Document Preview</h4>
            <div className="opacity-90 scale-95 origin-top-left w-full h-full overflow-hidden">
              <InvoicePreview invoice={previewInvoice} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

