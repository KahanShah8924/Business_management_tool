const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const {
  createInvoiceHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  updateInvoiceHandler,
  updateInvoiceStatusHandler,
  softDeleteInvoiceHandler,
} = require('../controllers/invoiceController');

const router = express.Router();

router.get('/', verifyToken, listInvoicesHandler);
router.post('/', verifyToken, createInvoiceHandler);
router.get('/:id', verifyToken, getInvoiceHandler);
router.put('/:id', verifyToken, updateInvoiceHandler);
router.patch('/:id/status', verifyToken, updateInvoiceStatusHandler);
router.patch('/:id/soft-delete', verifyToken, softDeleteInvoiceHandler);

module.exports = router;

