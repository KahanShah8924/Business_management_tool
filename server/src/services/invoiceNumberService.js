const InvoiceCounter = require('../models/InvoiceCounter');

async function getNextInvoiceNumber({ businessId, session }) {
  const counter = await InvoiceCounter.findOneAndUpdate(
    { businessId },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, session }
  );

  return counter.sequence;
}

module.exports = { getNextInvoiceNumber };

