const Ledger = require('../models/Ledger');

function normalizeType(value) {
  const v = String(value || '').toUpperCase();
  return v;
}

function normalizeReferenceType(value) {
  const v = String(value || '').toUpperCase();
  return v;
}

async function createManualLedgerEntry({ businessId, payload }) {
  const date = payload?.date ? new Date(payload.date) : null;
  const amount = Number(payload?.amount);
  const type = normalizeType(payload?.type);
  const referenceType = normalizeReferenceType(payload?.referenceType);

  if (!date || Number.isNaN(date.getTime())) {
    const err = new Error('date is required');
    err.statusCode = 400;
    throw err;
  }
  if (!Number.isFinite(amount) || amount < 0) {
    const err = new Error('amount must be a non-negative number');
    err.statusCode = 400;
    throw err;
  }
  if (!['DEBIT', 'CREDIT'].includes(type)) {
    const err = new Error('type must be DEBIT or CREDIT');
    err.statusCode = 400;
    throw err;
  }
  if (!['MANUAL', 'EXPENSE'].includes(referenceType)) {
    const err = new Error('referenceType must be MANUAL or EXPENSE');
    err.statusCode = 400;
    throw err;
  }
  if (referenceType === 'EXPENSE' && type !== 'DEBIT') {
    const err = new Error('Expense entries must be DEBIT');
    err.statusCode = 400;
    throw err;
  }

  const entry = await Ledger.create({
    businessId,
    date,
    type,
    amount,
    partyName: payload?.partyName ? String(payload.partyName).trim() : undefined,
    referenceType,
    referenceId: null,
    description: payload?.description ? String(payload.description).trim() : undefined,
  });

  return entry;
}

async function computeOpeningBalance({ businessId, startDate }) {
  if (!startDate) return 0;

  const agg = await Ledger.aggregate([
    {
      $match: {
        businessId,
        date: { $lt: startDate },
      },
    },
    {
      $group: {
        _id: null,
        credits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', 0],
          },
        },
        debits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  const credits = agg?.[0]?.credits || 0;
  const debits = agg?.[0]?.debits || 0;
  return credits - debits;
}

async function getPartyBalance({ businessId, partyName }) {
  const p = (partyName || '').trim();
  if (!p) return 0;

  const agg = await Ledger.aggregate([
    {
      $match: {
        businessId,
        partyName: p,
      },
    },
    {
      $group: {
        _id: null,
        credits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', 0],
          },
        },
        debits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  const credits = agg?.[0]?.credits || 0;
  const debits = agg?.[0]?.debits || 0;
  const balance = credits - debits;

  return balance > 0 ? balance : 0;
}

async function getOpeningBalance({ businessId, partyName }) {
  const p = (partyName || '').trim();
  if (!p) return { type: 'CREDIT', amount: 0 };

  const agg = await Ledger.aggregate([
    {
      $match: {
        businessId,
        partyName: p,
      },
    },
    {
      $group: {
        _id: null,
        credits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', 0],
          },
        },
        debits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  const credits = agg?.[0]?.credits || 0;
  const debits = agg?.[0]?.debits || 0;
  const net = credits - debits;

  if (net >= 0) {
    return { type: 'CREDIT', amount: net };
  }
  return { type: 'DEBIT', amount: Math.abs(net) };
}

async function listLedgerEntries({ businessId, query }) {
  const startDate = query?.startDate ? new Date(query.startDate) : null;
  const endDate = query?.endDate ? new Date(query.endDate) : null;
  const party = (query?.party || '').trim();
  const type = query?.type ? normalizeType(query.type) : '';

  const filter = { businessId };

  if (startDate && !Number.isNaN(startDate.getTime())) {
    filter.date = filter.date || {};
    filter.date.$gte = startDate;
  }
  if (endDate && !Number.isNaN(endDate.getTime())) {
    filter.date = filter.date || {};
    filter.date.$lte = endDate;
  }
  if (party) {
    filter.partyName = { $regex: party, $options: 'i' };
  }
  if (type && ['DEBIT', 'CREDIT'].includes(type)) {
    filter.type = type;
  }

  const openingBalance = await computeOpeningBalance({
    businessId,
    startDate: filter?.date?.$gte,
  });

  const entries = await Ledger.find(filter).sort({ date: 1, createdAt: 1 });

  let running = openingBalance;
  const withBalance = entries.map((e) => {
    const amt = Number(e.amount) || 0;
    if (e.type === 'CREDIT') running += amt;
    if (e.type === 'DEBIT') running -= amt;

    return {
      ...e.toObject(),
      balanceAfterTransaction: running,
    };
  });

  return { openingBalance, entries: withBalance };
}

module.exports = {
  createManualLedgerEntry,
  listLedgerEntries,
  getPartyBalance,
  getOpeningBalance,
};

