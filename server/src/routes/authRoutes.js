const express = require('express');
const { checkUserExists, registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

router.post('/check-user', checkUserExists);
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
