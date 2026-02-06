import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toFixed(2);
}

export default function InvoiceList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState('');
  const [invoices, setInvoices] = useState([]);

  const fetchInvoices = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/invoices', { params: { customer } });
      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => invoices, [invoices]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Invoices</h3>
          <p className="text-sm text-gray-600">Latest to oldest. Filter by customer name.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/invoices/new')}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
        >
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <label className="text-xs font-medium text-gray-600">Customer</label>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Search customer…"
            />
          </div>
          <div className="pt-5 flex gap-2">
            <button
              onClick={fetchInvoices}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 shadow-sm"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setCustomer('');
                setTimeout(fetchInvoices, 0);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-600">
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Total</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Loading invoices…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv._id} className="border-b last:border-b-0 hover:bg-blue-50/40 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-800">{inv.customerDetails?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{inv.status}</td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">{formatMoney(inv.grandTotal)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/invoices/${inv._id}`)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                        >
                          View
                        </button>
                        <button
                          onClick={() => window.open(`/dashboard/invoices/${inv._id}`, '_blank', 'noopener,noreferrer')}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          New Tab
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

