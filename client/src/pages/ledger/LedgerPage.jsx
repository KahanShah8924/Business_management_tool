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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Ledger</h3>
          <p className="text-sm text-gray-600">Ledger is the source of truth. Filters always apply to this business.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Party</label>
                <input
                  value={filters.party}
                  onChange={(e) => setFilters((p) => ({ ...p, party: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Search…"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">All</option>
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={fetchLedger}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 shadow-sm"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilters({ startDate: '', endDate: '', party: '', type: '' });
                  setTimeout(fetchLedger, 0);
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm"
              >
                Reset
              </button>
              <div className="ml-auto text-sm text-gray-600 self-center">
                Opening balance: <span className="font-semibold text-gray-900">{formatMoney(openingBalance)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-gray-600">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Party</th>
                    <th className="py-3 px-4 font-semibold text-right">Debit</th>
                    <th className="py-3 px-4 font-semibold text-right">Credit</th>
                    <th className="py-3 px-4 font-semibold text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500">
                        Loading ledger…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500">
                        No ledger entries found.
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
                          role={isInvoiceLink ? 'button' : undefined}
                          tabIndex={isInvoiceLink ? 0 : -1}
                          onClick={handleClick}
                          onKeyDown={(evt) => {
                            if (!isInvoiceLink) return;
                            if (evt.key === 'Enter' || evt.key === ' ') {
                              evt.preventDefault();
                              handleClick();
                            }
                          }}
                          data-reference-id={e.referenceId || ''}
                          className={`border-b last:border-b-0 transition ${
                            isInvoiceLink ? 'cursor-pointer hover:bg-blue-50/80' : 'hover:bg-gray-50'
                          }`}
                          title={isInvoiceLink ? 'View Invoice' : undefined}
                        >
                          <td className="py-3 px-4 text-gray-800">
                            {e.date ? new Date(e.date).toLocaleDateString() : '-'}
                          </td>
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          {e.partyName || '-'}
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <span>{e.description || ''}</span>
                            {isInvoiceLink && <span className="text-blue-500 text-[10px]">↗</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">{e.type === 'DEBIT' ? formatMoney(e.amount) : ''}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{e.type === 'CREDIT' ? formatMoney(e.amount) : ''}</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">{formatMoney(e.balanceAfterTransaction)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-900">Manual Expense Entry</h4>
          <p className="text-sm text-gray-600 mt-1">Creates a DEBIT ledger entry (referenceType = EXPENSE).</p>

          <form onSubmit={submitExpense} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={expense.date}
                onChange={(e) => setExpense((p) => ({ ...p, date: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Party Name</label>
              <input
                value={expense.partyName}
                onChange={(e) => setExpense((p) => ({ ...p, partyName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Vendor / Expense head"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Amount</label>
              <input
                type="number"
                value={expense.amount}
                onChange={(e) => setExpense((p) => ({ ...p, amount: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Description</label>
              <input
                value={expense.description}
                onChange={(e) => setExpense((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Electricity bill, travel, etc."
              />
            </div>

            <button
              type="submit"
              disabled={savingExpense}
              className="w-full mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {savingExpense ? 'Saving…' : 'Add Expense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

