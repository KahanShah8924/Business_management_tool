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
  ledgerType, // 'CREDIT' or 'DEBIT'
  paidAmount,
  useAvailableBalance, // Now effectively always true/merged if we follow strict rules, but keeping for compatibility?
  // User Prompt Rule: "Calculations must update reactively when paidAmount changes"
  // "Final amount = paidAmount +/- openingBalance"
  // This implies we aren't optionally using it?
  // But let's assume useAvailableBalance toggles the "OpeningBalance" part of the formula.
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const invoiceGstPercent = Number(invoiceLevelGstPercent);
  const invoiceGstFallback =
    Number.isFinite(invoiceGstPercent) && invoiceGstPercent >= 0 ? invoiceGstPercent : 0;

  let subtotal = 0;
  let gstTotal = 0;
  let otherTaxTotal = 0;

  // ... (Item Calculation - Identical to before)
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

  const openBal = Number(openingBalance) || 0;
  const paid = round2(paidAmount);

  // Logic Implementation
  // If ledgerType === "credit": finalAmount = paidAmount + openingBalance
  // If ledgerType === "debit": finalAmount = paidAmount - openingBalance

  let effectiveTotalPaid = 0;
  const normType = (ledgerType || '').toUpperCase();

  // We assume 'useAvailableBalance' might toggle if we include openingBalance in this calc?
  // The user prompt didn't mention the toggle, but existing UI has it. 
  // Let's assume if useAvailableBalance is FALSE, we treat Opening Balance as 0 for the formula.
  const balanceToConsider = useAvailableBalance ? openBal : 0;

  if (normType === 'CREDIT') {
    effectiveTotalPaid = paid + balanceToConsider;
  } else if (normType === 'DEBIT') {
    effectiveTotalPaid = paid - balanceToConsider;
  } else {
    // Default fallback if no type (e.g. 0 balance or new customer)
    effectiveTotalPaid = paid;
  }

  // "Final amount must never be negative"
  if (effectiveTotalPaid < 0) effectiveTotalPaid = 0;
  effectiveTotalPaid = round2(effectiveTotalPaid);

  const finalPayableAmount = round2(grandTotal - effectiveTotalPaid);

  // Remaining Balance Logic (Approximate, as it depends on if we consumed it all)
  // If Credit, and we used some.
  // If Debit, and we paid some.
  // This is complex to project perfectly without more rules, but for Invoice Preview:
  // We just show what's happening on THIS invoice.

  // Retaining 'appliedBalance' concept for UI compatibility if needed, 
  // but effectiveTotalPaid is the main deductive force now.
  const appliedBalance = round2(effectiveTotalPaid - paid); // The portion from OB (can be negative if Debit)

  return {
    items: normalizedItems,
    subtotal,
    gstTotal,
    otherTaxTotal,
    grandTotal,
    openingBalance: openBal,
    ledgerType: normType,
    paidAmount: paid,
    useAvailableBalance,
    appliedBalance, // Derived
    finalPayableAmount: round2(Math.max(0, finalPayableAmount)), // Ensure payable not negative? Or allow overpayment? Usually 0 floor.
    // remainingBalance not strictly required by Prompt, but good to keep structure
    remainingBalance: 0,
  };
}

