const {
  createInvoice,
  listInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  softDeleteInvoice,
} = require('../services/invoiceService');

async function createInvoiceHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const invoice = await createInvoice({ businessId, payload: req.body });
    res.status(201).json(invoice);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to create invoice' });
  }
}

async function listInvoicesHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const invoices = await listInvoices({ businessId, query: req.query });
    res.status(200).json(invoices);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to list invoices' });
  }
}

async function getInvoiceHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const invoice = await getInvoiceById({ businessId, invoiceId: req.params.id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json(invoice);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to fetch invoice' });
  }
}

async function updateInvoiceHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const invoice = await updateInvoice({ businessId, invoiceId: req.params.id, payload: req.body });
    res.status(200).json(invoice);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to update invoice' });
  }
}

async function updateInvoiceStatusHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const status = req.body?.status;
    const invoice = await updateInvoiceStatus({ businessId, invoiceId: req.params.id, status });
    res.status(200).json(invoice);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to update invoice status' });
  }
}

async function softDeleteInvoiceHandler(req, res) {
  try {
    const businessId = req.user.businessId;
    const invoice = await softDeleteInvoice({ businessId, invoiceId: req.params.id });
    res.status(200).json(invoice);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to delete invoice' });
  }
}

module.exports = {
  createInvoiceHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  updateInvoiceHandler,
  updateInvoiceStatusHandler,
  softDeleteInvoiceHandler,
};

