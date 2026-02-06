import React from 'react';

function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toFixed(2);
}

export default function InvoicePreview({ invoice }) {
  const customer = invoice?.customerDetails || {};
  const items = Array.isArray(invoice?.items) ? invoice.items : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Invoice</h3>
          <p className="text-sm text-gray-600 mt-1">Customer: {customer?.name || '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Invoice Date: {invoice?.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}</p>
          <p className="text-xs text-gray-500">Due Date: {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-sm font-semibold text-gray-900">{invoice?.status || 'DRAFT'}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 pr-4 font-semibold">Item</th>
              <th className="py-2 pr-4 font-semibold">Qty</th>
              <th className="py-2 pr-4 font-semibold">Rate</th>
              <th className="py-2 pr-4 font-semibold">GST %</th>
              <th className="py-2 pr-4 font-semibold">GST Amt</th>
              <th className="py-2 pr-4 font-semibold">Other Taxes</th>
              <th className="py-2 pr-0 font-semibold text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  Add items to preview the invoice.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const qty = Number(it.quantity) || 0;
                const rate = Number(it.rate) || 0;
                const subtotal = qty * rate;
                const gstPercent = Number(it.gstPercent ?? it.taxPercent) || 0;
                const gstAmount = Number(it.gstAmount) || 0;
                const otherTaxes = Array.isArray(it.otherTaxes) ? it.otherTaxes : [];
                const otherTaxTotal = otherTaxes.reduce(
                  (sum, t) => sum + (Number(t.amount) || 0),
                  0
                );
                const lineTotal =
                  Number(it.lineTotal) || subtotal + gstAmount + otherTaxTotal;
                return (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 text-gray-900">{it.name || '-'}</td>
                    <td className="py-2 pr-4 text-gray-700">{qty}</td>
                    <td className="py-2 pr-4 text-gray-700">{formatMoney(rate)}</td>
                    <td className="py-2 pr-4 text-gray-700">{gstPercent}</td>
                    <td className="py-2 pr-4 text-gray-700">{formatMoney(gstAmount)}</td>
                    <td className="py-2 pr-4 text-gray-700">
                      {otherTaxes.length === 0 ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <div className="space-y-0.5">
                          {otherTaxes.map((t, taxIdx) => (
                            <div key={taxIdx} className="text-xs text-gray-700">
                              {t.name || 'Other'} ({t.percent || 0}%):{' '}
                              {formatMoney(t.amount)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-0 text-right text-gray-900">{formatMoney(lineTotal)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900 font-medium">{formatMoney(invoice?.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">GST Total</span>
            <span className="text-gray-900 font-medium">{formatMoney(invoice?.gstTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Other Taxes</span>
            <span className="text-gray-900 font-medium">
              {formatMoney(invoice?.otherTaxTotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-900 font-semibold">Grand Total</span>
            <span className="text-gray-900 font-semibold">{formatMoney(invoice?.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 pt-1">
            <span>Opening Balance Used</span>
            <span>{formatMoney(invoice?.openingBalance)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Paid Now</span>
            <span>{formatMoney(invoice?.paidAmount)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Remaining Balance</span>
            <span>{formatMoney(invoice?.remainingBalance)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-900 font-semibold">Final Payable</span>
            <span className="text-gray-900 font-semibold">
              {formatMoney(invoice?.finalPayableAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

