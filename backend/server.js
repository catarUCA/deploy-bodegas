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
app.use(cors());
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

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍷  Heritage Archive Backend → http://localhost:${PORT}`);
  console.log(`🗄️   API                      → http://localhost:${PORT}/api/bodegas\n`);
});
