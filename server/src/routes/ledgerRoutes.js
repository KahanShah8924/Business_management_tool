const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const { listLedgerHandler, createManualLedgerHandler, getPartyBalanceHandler } = require('../controllers/ledgerController');

const router = express.Router();

router.get('/', verifyToken, listLedgerHandler);
router.post('/manual', verifyToken, createManualLedgerHandler);
router.get('/party-balance', verifyToken, getPartyBalanceHandler);

module.exports = router;

