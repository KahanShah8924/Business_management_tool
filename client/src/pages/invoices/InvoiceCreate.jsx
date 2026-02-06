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
  const [paidAmount, setPaidAmount] = useState('');
  const [useAvailableBalance, setUseAvailableBalance] = useState(false);

  const [items, setItems] = useState([{ name: '', quantity: 1, rate: 0, gstPercent: 0, otherTaxes: [] }]);

  const computed = useMemo(
    () =>
      calculateInvoicePreview({
        items,
        invoiceLevelGstPercent: undefined,
        openingBalance,
        paidAmount: paidAmount || 0,
        useAvailableBalance,
      }),
    [items, openingBalance, paidAmount, useAvailableBalance]
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
    try {
      const res = await api.get('/ledgers/party-balance', {
        params: { partyName: name },
      });
      setOpeningBalance(Number(res.data?.balance) || 0);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to fetch opening balance');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Create Invoice</h3>
          <p className="text-sm text-gray-600">Invoice creates a CREDIT ledger entry automatically.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 shadow-sm"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Invoice'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-900">Invoice Details</h4>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Invoice Number</label>
              <input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Optional business reference"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Customer Name</label>
              <input
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails((p) => ({ ...p, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="ABC Traders"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Customer Email</label>
              <input
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails((p) => ({ ...p, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="billing@abc.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Customer Address</label>
              <input
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails((p) => ({ ...p, address: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Street, City"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Opening Balance (from ledger)</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={openingBalance}
                  readOnly
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 text-gray-800"
                />
                <button
                  type="button"
                  onClick={fetchOpeningBalance}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 shadow-sm text-sm"
                >
                  Fetch
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Paid Amount</label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center mt-6 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={useAvailableBalance}
                  onChange={(e) => setUseAvailableBalance(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                Use available balance
              </label>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Line Items</h4>
              <button
                onClick={addItem}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
              >
                + Add Item
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap md:items-end gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
                >
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs font-medium text-gray-600">Item</label>
                    <input
                      value={it.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Product / Service"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-medium text-gray-600">Qty</label>
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      min="0"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-xs font-medium text-gray-600">Rate</label>
                    <input
                      type="number"
                      value={it.rate}
                      onChange={(e) => updateItem(idx, { rate: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      min="0"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-xs font-medium text-gray-600">GST %</label>
                    <input
                      type="number"
                      value={it.gstPercent ?? 0}
                      onChange={(e) => updateItem(idx, { gstPercent: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      min="0"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-600">Other Taxes</label>
                      <button
                        type="button"
                        onClick={() => addOtherTax(idx)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {(it.otherTaxes || []).map((tax, tIdx) => (
                        <div key={tIdx} className="flex gap-2">
                          <input
                            value={tax.name}
                            onChange={(e) => updateOtherTax(idx, tIdx, { name: e.target.value })}
                            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
                            placeholder="Name"
                          />
                          <input
                            type="number"
                            min="0"
                            value={tax.percent}
                            onChange={(e) => updateOtherTax(idx, tIdx, { percent: e.target.value })}
                            className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
                            placeholder="%"
                          />
                          <button
                            type="button"
                            onClick={() => removeOtherTax(idx, tIdx)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                            aria-label="Remove tax"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {(!it.otherTaxes || it.otherTaxes.length === 0) && (
                        <p className="text-[11px] text-gray-400">No additional taxes</p>
                      )}
                    </div>
                  </div>
                  <div className="w-[88px] flex items-end justify-end">
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                      title={items.length === 1 ? 'At least one item required' : 'Remove'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Preview (before save)</h4>
            <p className="text-xs text-gray-500">PDF export is available after save.</p>
          </div>
          <InvoicePreview invoice={previewInvoice} />
        </div>
      </div>
    </div>
  );
}

