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

  const StatusBadge = ({ status }) => {
    const s = (status || 'DRAFT').toUpperCase();
    let classes = 'bg-gray-100 text-gray-700';
    if (s === 'PAID') classes = 'bg-green-100 text-green-700';
    if (s === 'PARTIAL') classes = 'bg-yellow-100 text-yellow-800';
    if (s === 'OVERDUE') classes = 'bg-red-100 text-red-700';

    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${classes}`}>{s}</span>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Invoices</h3>
          <p className="text-sm text-gray-500 mt-1">Manage all your customer invoices within one place.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/invoices/new')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
        >
          <span className="text-xl">+</span> Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Filter by Customer</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                placeholder="Search name..."
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={fetchInvoices}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-medium shadow-md transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => {
                setCustomer('');
                setTimeout(fetchInvoices, 0);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow-sm">{error}</div>
      ) : null}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-gray-500">
                <th className="py-4 px-6 font-semibold tracking-wide">Invoice #</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Customer</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Date</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Status</th>
                <th className="py-4 px-6 font-semibold tracking-wide text-right">Total</th>
                <th className="py-4 px-6 font-semibold tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-2"></div>
                    <p>Loading invoices...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <p className="text-lg">No invoices found</p>
                    <p className="text-sm mt-1">Try changing your search filters or create a new invoice.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-4 px-6 font-mono text-gray-600 font-medium">{inv.invoiceNumber || <span className="text-gray-300 italic">Auto-gen</span>}</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-800 block">{inv.customerDetails?.name || 'Unknown'}</span>
                      {inv.customerDetails?.email && <span className="text-xs text-gray-400 block">{inv.customerDetails.email}</span>}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900 font-bold font-mono text-base">₹{formatMoney(inv.grandTotal)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/dashboard/invoices/${inv._id}`)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => window.open(`/dashboard/invoices/${inv._id}`, '_blank', 'noopener,noreferrer')}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Open in new tab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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

