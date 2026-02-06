// Frontend mirror of backend billingCalculationService.
// Used only for UI preview; backend remains the source of truth.

function round2(value) {
  const num = Number(value) || 0;
  return Math.round(num * 100) / 100;
}

function normalizeOtherTaxes(rawOtherTaxes, lineSubtotal) {
  const taxes = Array.isArray(rawOtherTaxes) ? rawOtherTaxes : [];

  const normalized = taxes.map((tax) => {
    const name = (tax?.name || '').trim() || 'Other Tax';
    const percent = Number(tax?.percent);
    if (!Number.isFinite(percent) || percent < 0) return { name, percent: 0, amount: 0 };
    const amount = round2((lineSubtotal * percent) / 100);
    return { name, percent, amount };
  });

  const otherTaxTotal = normalized.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  return { otherTaxes: normalized, otherTaxTotal: round2(otherTaxTotal) };
}

export function calculateInvoicePreview({
  items,
  invoiceLevelGstPercent,
  openingBalance,
  paidAmount,
  useAvailableBalance,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const invoiceGstPercent = Number(invoiceLevelGstPercent);
  const invoiceGstFallback =
    Number.isFinite(invoiceGstPercent) && invoiceGstPercent >= 0 ? invoiceGstPercent : 0;

  let subtotal = 0;
  let gstTotal = 0;
  let otherTaxTotal = 0;

  const normalizedItems = safeItems.map((raw) => {
    const quantity = Number(raw.quantity) || 0;
    const rate = Number(raw.rate) || 0;
    const gstPercentRaw = raw.gstPercent ?? raw.taxPercent;
    const gstPercent = Number(gstPercentRaw);

    const lineSubtotal = round2(quantity * rate);
    const effectiveGstPercent =
      Number.isFinite(gstPercent) && gstPercent >= 0 ? gstPercent : invoiceGstFallback;
    const gstAmount = round2((lineSubtotal * effectiveGstPercent) / 100);

    const { otherTaxes, otherTaxTotal: lineOtherTaxTotal } = normalizeOtherTaxes(
      raw.otherTaxes,
      lineSubtotal
    );

    const lineTotal = round2(lineSubtotal + gstAmount + lineOtherTaxTotal);

    subtotal += lineSubtotal;
    gstTotal += gstAmount;
    otherTaxTotal += lineOtherTaxTotal;

    return {
      ...raw,
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
  const wantsToUseBalance = !!useAvailableBalance;

  let appliedBalance = 0;
  if (wantsToUseBalance && openingBalanceSafe > 0) {
    const maxBalanceUsable = round2(grandTotal - paid);
    if (maxBalanceUsable > 0) {
      appliedBalance = round2(Math.min(openingBalanceSafe, maxBalanceUsable));
    }
  }

  const finalPayableAmount = round2(grandTotal - paid - appliedBalance);
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

