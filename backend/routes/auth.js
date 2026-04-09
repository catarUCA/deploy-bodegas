const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/request-code', authController.requestCode);
router.post('/verify-code', authController.verifyCode);

module.exports = router;
