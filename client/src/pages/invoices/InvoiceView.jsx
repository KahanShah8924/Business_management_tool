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

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
      Loading invoice details...
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-r-lg shadow-sm mx-auto max-w-2xl mt-8">
      <h3 className="font-bold">Error</h3>
      <p>{error}</p>
      <button onClick={() => navigate('/dashboard/invoices')} className="text-sm underline mt-2 hover:text-red-900">Back to Invoices</button>
    </div>
  );

  if (!invoice) return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-xl font-semibold">Invoice not found</p>
      <button onClick={() => navigate('/dashboard/invoices')} className="text-blue-600 hover:underline mt-2">Return to List</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{printableTitle}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Review the details below. Click "Export PDF" to open the print dialog.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-center">
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Export PDF
          </button>
          <button
            onClick={() => window.open(`/dashboard/invoices/${id}`, '_blank', 'noopener,noreferrer')}
            className="flex items-center justify-center w-11 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
            title="Open in new tab"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden border border-gray-100 min-h-[600px]">
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
}

