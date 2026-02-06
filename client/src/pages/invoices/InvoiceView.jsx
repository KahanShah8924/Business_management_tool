import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import InvoicePreview from './InvoicePreview';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const res = await api.get(`/invoices/${id}`);
        if (mounted) setInvoice(res.data);
      } catch (e) {
        if (mounted) setError(e.response?.data?.message || e.message || 'Failed to load invoice');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const printableTitle = useMemo(() => {
    const invNo = invoice?.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : 'Invoice';
    const cust = invoice?.customerDetails?.name ? ` - ${invoice.customerDetails.name}` : '';
    return `${invNo}${cust}`;
  }, [invoice]);

  if (loading) return <div className="text-gray-600">Loading invoice…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>;
  if (!invoice) return <div className="text-gray-600">Invoice not found.</div>;

  return (
    <div className="space-y-4">
      <div className="no-print flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{printableTitle}</h3>
          <p className="text-sm text-gray-600">
            Export PDF uses print-to-PDF (ledger entry already created on invoice creation).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 shadow-sm"
          >
            Back
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
          >
            Export PDF
          </button>
          <button
            onClick={() => window.open(`/dashboard/invoices/${id}`, '_blank', 'noopener,noreferrer')}
            className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
          >
            Open in New Tab
          </button>
        </div>
      </div>

      <InvoicePreview invoice={invoice} />
    </div>
  );
}

