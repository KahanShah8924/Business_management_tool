const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Ledger = require('../models/Ledger');
const { getNextInvoiceNumber } = require('./invoiceNumberService');
const { calculateInvoiceAmounts } = require('./billingCalculationService');
const { getPartyBalance } = require('./ledgerService');

function buildInvoiceLedgerDescription(invoiceNumber, customerName, suffix) {
  const cn = (customerName || '').trim();
  const base = `Invoice #${invoiceNumber}${cn ? ` - ${cn}` : ''}`;
  return suffix ? `${base} - ${suffix}` : base;
}

async function createInvoice({ businessId, payload }) {
  const session = await mongoose.startSession();

  try {
    const {
      customerDetails,
      invoiceDate,
      dueDate,
      items,
      status,
      documentNumber,
      paidAmount,
      useAvailableBalance,
    } = payload || {};

    if (!customerDetails?.name) {
      const err = new Error('customerDetails.name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!invoiceDate) {
      const err = new Error('invoiceDate is required');
      err.statusCode = 400;
      throw err;
    }
    const customerName = String(customerDetails.name).trim();
    const openingBalanceFromLedger = await getPartyBalance({ businessId, partyName: customerName });

    const amounts = calculateInvoiceAmounts({
      items,
      invoiceLevelGstPercent: undefined,
      openingBalance: openingBalanceFromLedger,
      paidAmount,
      useAvailableBalance,
    });

    let createdInvoice;

    await session.withTransaction(async () => {
      const invoiceNumber = await getNextInvoiceNumber({ businessId, session });

      createdInvoice = await Invoice.create(
        [
          {
            businessId,
            invoiceNumber,
            documentNumber,
            customerDetails: {
              name: customerName,
              email: customerDetails.email ? String(customerDetails.email).trim() : undefined,
              phone: customerDetails.phone ? String(customerDetails.phone).trim() : undefined,
              address: customerDetails.address ? String(customerDetails.address).trim() : undefined,
            },
            invoiceDate: new Date(invoiceDate),
            dueDate: dueDate ? new Date(dueDate) : undefined,
            items: amounts.items,
            subtotal: amounts.subtotal,
            gstTotal: amounts.gstTotal,
            otherTaxTotal: amounts.otherTaxTotal,
            grandTotal: amounts.grandTotal,
            openingBalance: amounts.openingBalance,
            paidAmount: amounts.paidAmount,
            useAvailableBalance: amounts.useAvailableBalance,
            remainingBalance: amounts.remainingBalance,
            finalPayableAmount: amounts.finalPayableAmount,
            status: status || 'DRAFT',
          },
        ],
        { session }
      );

      const invoiceDoc = createdInvoice[0];

      // CREDIT: sales value
      await Ledger.create(
        [
          {
            businessId,
            date: invoiceDoc.invoiceDate,
            type: 'CREDIT',
            amount: invoiceDoc.grandTotal,
            partyName: invoiceDoc.customerDetails?.name,
            referenceType: 'INVOICE',
            referenceId: invoiceDoc._id,
            description: buildInvoiceLedgerDescription(
              invoiceDoc.invoiceNumber,
              invoiceDoc.customerDetails?.name,
              'Sales value'
            ),
          },
          // DEBIT: immediate payment received against this invoice
          ...(amounts.paidAmount > 0
            ? [
                {
                  businessId,
                  date: invoiceDoc.invoiceDate,
                  type: 'DEBIT',
                  amount: amounts.paidAmount,
                  partyName: invoiceDoc.customerDetails?.name,
                  referenceType: 'INVOICE',
                  referenceId: invoiceDoc._id,
                  description: buildInvoiceLedgerDescription(
                    invoiceDoc.invoiceNumber,
                    invoiceDoc.customerDetails?.name,
                    'Payment received'
                  ),
                },
              ]
            : []),
          // DEBIT: credit balance consumed on this invoice
          ...(amounts.appliedBalance > 0
            ? [
                {
                  businessId,
                  date: invoiceDoc.invoiceDate,
                  type: 'DEBIT',
                  amount: amounts.appliedBalance,
                  partyName: invoiceDoc.customerDetails?.name,
                  referenceType: 'INVOICE',
                  referenceId: invoiceDoc._id,
                  description: buildInvoiceLedgerDescription(
                    invoiceDoc.invoiceNumber,
                    invoiceDoc.customerDetails?.name,
                    'Credit balance applied'
                  ),
                },
              ]
            : []),
        ],
        { session }
      );
    });

    return createdInvoice[0];
  } finally {
    session.endSession();
  }
}

async function listInvoices({ businessId, query }) {
  const customer = (query?.customer || '').trim();
  const status = (query?.status || '').trim();

  const filter = { businessId, isDeleted: false };
  if (customer) {
    filter['customerDetails.name'] = { $regex: customer, $options: 'i' };
  }
  if (status) {
    filter.status = status;
  }

  const invoices = await Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 });
  return invoices;
}

async function getInvoiceById({ businessId, invoiceId }) {
  const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
  return invoice;
}

async function updateInvoice({ businessId, invoiceId, payload }) {
  const session = await mongoose.startSession();

  try {
    const existing = await Invoice.findOne({ _id: invoiceId, businessId, isDeleted: false });
    if (!existing) {
      const err = new Error('Invoice not found');
      err.statusCode = 404;
      throw err;
    }

    const customerDetails = payload?.customerDetails || existing.customerDetails;
    const invoiceDate = payload?.invoiceDate || existing.invoiceDate;
    const dueDate = payload?.dueDate ?? existing.dueDate;
    const items = payload?.items || existing.items;

    if (!customerDetails?.name) {
      const err = new Error('customerDetails.name is required');
      err.statusCode = 400;
      throw err;
    }

    const amounts = calculateInvoiceAmounts({
      items,
      invoiceLevelGstPercent: undefined,
      // For updates, keep original payment and credit usage;
      // follow-up phases can move settlements into a dedicated flow.
      openingBalance: existing.openingBalance,
      paidAmount: existing.paidAmount,
      useAvailableBalance: existing.useAvailableBalance,
    });

    let updatedInvoice;

    await session.withTransaction(async () => {
      updatedInvoice = await Invoice.findOneAndUpdate(
        { _id: invoiceId, businessId },
        {
          $set: {
            customerDetails: {
              name: String(customerDetails.name).trim(),
              email: customerDetails.email ? String(customerDetails.email).trim() : undefined,
              phone: customerDetails.phone ? String(customerDetails.phone).trim() : undefined,
              address: customerDetails.address ? String(customerDetails.address).trim() : undefined,
            },
            invoiceDate: new Date(invoiceDate),
            dueDate: dueDate ? new Date(dueDate) : undefined,
            items: amounts.items,
            subtotal: amounts.subtotal,
            gstTotal: amounts.gstTotal,
            otherTaxTotal: amounts.otherTaxTotal,
            grandTotal: amounts.grandTotal,
            // Payment and balance fields remain as originally recorded
            openingBalance: existing.openingBalance,
            paidAmount: existing.paidAmount,
            useAvailableBalance: existing.useAvailableBalance,
            remainingBalance: existing.remainingBalance,
            finalPayableAmount: existing.finalPayableAmount,
          },
        },
        { new: true, session }
      );

      const desc = buildInvoiceLedgerDescription(
        updatedInvoice.invoiceNumber,
        updatedInvoice.customerDetails?.name,
        'Sales value'
      );

      const ledger = await Ledger.findOneAndUpdate(
        {
          businessId,
          referenceType: 'INVOICE',
          referenceId: updatedInvoice._id,
        },
        {
          $set: {
            date: updatedInvoice.invoiceDate,
            type: 'CREDIT',
            amount: updatedInvoice.grandTotal,
            partyName: updatedInvoice.customerDetails?.name,
            description: desc,
          },
        },
        { new: true, session }
      );

      if (!ledger) {
        await Ledger.create(
          [
            {
              businessId,
              date: updatedInvoice.invoiceDate,
              type: 'CREDIT',
              amount: updatedInvoice.grandTotal,
              partyName: updatedInvoice.customerDetails?.name,
              referenceType: 'INVOICE',
              referenceId: updatedInvoice._id,
              description: desc,
            },
          ],
          { session }
        );
      }
    });

    return updatedInvoice;
  } finally {
    session.endSession();
  }
}

async function updateInvoiceStatus({ businessId, invoiceId, status }) {
  const allowed = new Set(['DRAFT', 'SENT', 'PAID', 'OVERDUE']);
  if (!allowed.has(status)) {
    const err = new Error('Invalid status');
    err.statusCode = 400;
    throw err;
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, businessId, isDeleted: false },
    { $set: { status } },
    { new: true }
  );

  if (!invoice) {
    const err = new Error('Invoice not found');
    err.statusCode = 404;
    throw err;
  }

  return invoice;
}

async function softDeleteInvoice({ businessId, invoiceId }) {
  const existing = await Invoice.findOne({ _id: invoiceId, businessId, isDeleted: false });
  if (!existing) {
    const err = new Error('Invoice not found');
    err.statusCode = 404;
    throw err;
  }

  const ledgerExists = await Ledger.exists({
    businessId,
    referenceType: 'INVOICE',
    referenceId: existing._id,
  });

  if (ledgerExists) {
    const err = new Error('Cannot delete invoice because ledger exists for it');
    err.statusCode = 409;
    throw err;
  }

  return await Invoice.findOneAndUpdate(
    { _id: invoiceId, businessId },
    { $set: { isDeleted: true } },
    { new: true }
  );
}

module.exports = {
  createInvoice,
  listInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  softDeleteInvoice,
};

