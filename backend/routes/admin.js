const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/dashboard', adminMiddleware, adminController.dashboard);

module.exports = router;
