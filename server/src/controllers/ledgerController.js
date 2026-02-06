const { createManualLedgerEntry, listLedgerEntries, getPartyBalance } = require('../services/ledgerService');

async function listLedgerHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const data = await listLedgerEntries({ businessId, query: req.query });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to list ledger' });
  }
}

async function createManualLedgerHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const entry = await createManualLedgerEntry({ businessId, payload: req.body });
    res.status(201).json(entry);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to create ledger entry' });
  }
}

async function getPartyBalanceHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const partyName = req.query.partyName;
    const balance = await getPartyBalance({ businessId, partyName });
    res.status(200).json({ partyName, balance });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to fetch party balance' });
  }
}

module.exports = {
  listLedgerHandler,
  createManualLedgerHandler,
  getPartyBalanceHandler,
};

