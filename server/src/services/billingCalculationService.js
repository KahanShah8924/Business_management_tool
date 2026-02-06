// Central invoice amount and tax calculation.
// Keeps invoice and ledger consistent on the backend.

function round2(value) {
  const num = Number(value) || 0;
  return Math.round(num * 100) / 100;
}

function normalizeOtherTaxes(rawOtherTaxes, lineSubtotal) {
  const taxes = Array.isArray(rawOtherTaxes) ? rawOtherTaxes : [];

  const normalized = taxes.map((tax) => {
    const name = (tax?.name || '').trim() || 'Other Tax';
    const percent = Number(tax?.percent);

    if (!Number.isFinite(percent) || percent < 0) {
      const err = new Error(`Invalid other tax percent for "${name}"`);
      err.statusCode = 400;
      throw err;
    }

    const amount = round2((lineSubtotal * percent) / 100);

    return {
      name,
      percent,
      amount,
    };
  });

  const otherTaxTotal = normalized.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return { otherTaxes: normalized, otherTaxTotal: round2(otherTaxTotal) };
}

// items: array of { name, quantity, rate, gstPercent?, otherTaxes? }
// openingBalance: customer's available credit from ledger
// paidAmount: immediate payment
// useAvailableBalance: whether to consume available credit
function calculateInvoiceAmounts({ items, invoiceLevelGstPercent, openingBalance, paidAmount, useAvailableBalance }) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('At least one line item is required');
    err.statusCode = 400;
    throw err;
  }

  const invoiceGstPercent = Number(invoiceLevelGstPercent);
  const invoiceGstFallback = Number.isFinite(invoiceGstPercent) && invoiceGstPercent >= 0 ? invoiceGstPercent : 0;

  let subtotal = 0;
  let gstTotal = 0;
  let otherTaxTotal = 0;

  const normalizedItems = items.map((raw) => {
    const name = (raw?.name || '').trim();
    const quantity = Number(raw?.quantity);
    const rate = Number(raw?.rate);
    const gstPercentRaw = raw?.gstPercent ?? raw?.taxPercent; // support old field name
    const gstPercent = Number(gstPercentRaw);

    if (!name) {
      const err = new Error('Item name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      const err = new Error(`Invalid quantity for item "${name}"`);
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      const err = new Error(`Invalid rate for item "${name}"`);
      err.statusCode = 400;
      throw err;
    }

    const lineSubtotal = round2(quantity * rate);

    const effectiveGstPercent =
      Number.isFinite(gstPercent) && gstPercent >= 0 ? gstPercent : invoiceGstFallback;

    const gstAmount = round2((lineSubtotal * effectiveGstPercent) / 100);

    const { otherTaxes, otherTaxTotal: lineOtherTaxTotal } = normalizeOtherTaxes(
      raw?.otherTaxes,
      lineSubtotal
    );

    const lineTotal = round2(lineSubtotal + gstAmount + lineOtherTaxTotal);

    subtotal += lineSubtotal;
    gstTotal += gstAmount;
    otherTaxTotal += lineOtherTaxTotal;

    return {
      name,
      quantity,
      rate,
      gstPercent: effectiveGstPercent,
      gstAmount,
      otherTaxes,
      subtotal: lineSubtotal,
      lineOtherTaxTotal,
      lineTotal,
    };
  });

  subtotal = round2(subtotal);
  gstTotal = round2(gstTotal);
  otherTaxTotal = round2(otherTaxTotal);

  const grandTotal = round2(subtotal + gstTotal + otherTaxTotal);

  const openingBalanceNumber = round2(openingBalance);
  const openingBalanceSafe = openingBalanceNumber > 0 ? openingBalanceNumber : 0;

  const paid = round2(paidAmount);
  if (paid < 0) {
    const err = new Error('paidAmount cannot be negative');
    err.statusCode = 400;
    throw err;
  }
  if (paid > grandTotal) {
    const err = new Error('paidAmount cannot exceed invoice grand total');
    err.statusCode = 400;
    throw err;
  }

  const wantsToUseBalance = !!useAvailableBalance;

  let appliedBalance = 0;
  if (wantsToUseBalance && openingBalanceSafe > 0) {
    const maxBalanceUsable = round2(grandTotal - paid);
    if (maxBalanceUsable < 0) {
      const err = new Error('Totals mismatch, payment exceeds invoice value');
      err.statusCode = 400;
      throw err;
    }
    appliedBalance = round2(
      Math.min(openingBalanceSafe, maxBalanceUsable)
    );
  }

  const finalPayableAmount = round2(grandTotal - paid - appliedBalance);
  if (finalPayableAmount < 0) {
    const err = new Error('Final payable amount cannot be negative');
    err.statusCode = 400;
    throw err;
  }

  const remainingBalance = round2(openingBalanceSafe - appliedBalance);

  return {
    items: normalizedItems,
    subtotal,
    gstTotal,
    otherTaxTotal,
    grandTotal,
    openingBalance: openingBalanceSafe,
    paidAmount: paid,
    useAvailableBalance: wantsToUseBalance,
    appliedBalance,
    finalPayableAmount,
    remainingBalance,
  };
}

module.exports = {
  calculateInvoiceAmounts,
};

