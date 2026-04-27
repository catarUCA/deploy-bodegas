require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const bodegaRoutes = require('./routes/bodegas');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' })); // Default to * but allow configuring via env
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { success: false, message: 'Demasiados intentos. Por favor, inténtalo de nuevo más tarde.' }
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', loginLimiter, authRoutes);
app.use('/api/bodegas', bodegaRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(500).json({ success: false, message: 'Ocurrió un error inesperado en el servidor.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍷  Heritage Archive Backend → http://localhost:${PORT}`);
  console.log(`🗄️   API                      → http://localhost:${PORT}/api/bodegas\n`);
});
