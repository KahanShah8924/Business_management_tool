const express = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const { listLedgerHandler, createManualLedgerHandler, getPartyBalanceHandler, getOpeningBalanceHandler } = require('../controllers/ledgerController');

const router = express.Router();

router.get('/', verifyToken, listLedgerHandler);
router.post('/manual', verifyToken, createManualLedgerHandler);
router.get('/party-balance', verifyToken, getPartyBalanceHandler);
router.get('/opening-balance/:enterpriseId', verifyToken, getOpeningBalanceHandler);

module.exports = router;

