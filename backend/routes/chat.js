const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const rateLimit = require('express-rate-limit');

// Rate limit for public chat (max 30 requests per 15 min per IP)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Demasiadas consultas. Por favor, espera unos minutos.' }
});

router.post('/init', chatLimiter, chatController.init);
router.post('/message', chatLimiter, chatController.message);

module.exports = router;
