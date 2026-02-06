import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toFixed(2);
}

export default function LedgerPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    party: '',
    type: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [entries, setEntries] = useState([]);

  const [expense, setExpense] = useState({
    date: new Date().toISOString().slice(0, 10),
    partyName: '',
    amount: '',
    description: '',
  });
  const [savingExpense, setSavingExpense] = useState(false);

  const fetchLedger = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/ledgers', { params: filters });
      setOpeningBalance(Number(res.data?.openingBalance) || 0);
      setEntries(Array.isArray(res.data?.entries) ? res.data.entries : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => entries, [entries]);

  const submitExpense = async (e) => {
    e.preventDefault();
    setError('');

    const amount = Number(expense.amount);
    if (!expense.date) return setError('Expense date is required');
    if (!expense.partyName.trim()) return setError('Party name is required');
    if (!Number.isFinite(amount) || amount < 0) return setError('Amount must be a non-negative number');

    setSavingExpense(true);
    try {
      await api.post('/ledgers/manual', {
        date: expense.date,
        partyName: expense.partyName,
        amount,
        description: expense.description,
        referenceType: 'EXPENSE',
        type: 'DEBIT',
      });
      setExpense((p) => ({ ...p, partyName: '', amount: '', description: '' }));
      await fetchLedger();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add expense');
    } finally {
      setSavingExpense(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Ledger</h3>
        <p className="text-sm text-gray-500 mt-1">
          The comprehensive financial record of your business transactions.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow-sm flex items-center">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Filters & Table */}
        <div className="xl:col-span-2 space-y-6">

          {/* Filters Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Filter Transactions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Party Name</label>
                <input
                  value={filters.party}
                  onChange={(e) => setFilters((p) => ({ ...p, party: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="All Parties"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">All Transactions</option>
                  <option value="DEBIT">Debit Only</option>
                  <option value="CREDIT">Credit Only</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-gray-50 pt-3">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={fetchLedger}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-medium shadow-md transition-all"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setFilters({ startDate: '', endDate: '', party: '', type: '' });
                    setTimeout(fetchLedger, 0);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
              <div className="text-sm text-gray-600 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">
                Opening Balance: <span className="font-bold text-gray-900">{formatMoney(openingBalance)}</span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr className="text-left text-gray-500">
                    <th className="py-4 px-6 font-semibold tracking-wide">Date</th>
                    <th className="py-4 px-6 font-semibold tracking-wide">Party / Description</th>
                    <th className="py-4 px-6 font-semibold tracking-wide text-right">Debit</th>
                    <th className="py-4 px-6 font-semibold tracking-wide text-right">Credit</th>
                    <th className="py-4 px-6 font-semibold tracking-wide text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-2"></div>
                        <p>Updating ledger...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        No transactions found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    rows.map((e) => {
                      const isInvoiceLink = e.referenceType === 'INVOICE' && e.referenceId;
                      const handleClick = () => {
                        if (!isInvoiceLink) return;
                        window.open(
                          `/dashboard/invoices/${e.referenceId}`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      };
                      return (
                        <tr
                          key={e._id}
                          onClick={handleClick}
                          className={`group transition-colors ${isInvoiceLink ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                            {e.date ? new Date(e.date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-gray-900">{e.partyName || '-'}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              {e.description}
                              {isInvoiceLink && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                                  INV ↗
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-red-600">
                            {e.type === 'DEBIT' && formatMoney(e.amount)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-green-600">
                            {e.type === 'CREDIT' && formatMoney(e.amount)}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-gray-900">
                            {formatMoney(e.balanceAfterTransaction)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Expense Form */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="font-bold text-gray-900">Add Expense</h4>
            </div>

            <p className="text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Manually add database expenses or other debits here. This will affect the ledger balance immediately.
            </p>

            <form onSubmit={submitExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={expense.date}
                  onChange={(e) => setExpense((p) => ({ ...p, date: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Party / Vendor <span className="text-red-500">*</span></label>
                <input
                  required
                  value={expense.partyName}
                  onChange={(e) => setExpense((p) => ({ ...p, partyName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                  placeholder="e.g. Office Supplies"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={expense.amount}
                    onChange={(e) => setExpense((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Description</label>
                <textarea
                  value={expense.description}
                  onChange={(e) => setExpense((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none h-20"
                  placeholder="Additional details..."
                />
              </div>

              <button
                type="submit"
                disabled={savingExpense}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                {savingExpense ? 'Adding...' : 'Add Debit Entry'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

