const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const queries = require('../db/queries');
const emailService = require('../services/emailService');
require('dotenv').config();

const authController = {
  requestCode: async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email es requerido.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      const hashedCode = await bcrypt.hash(code, 10);
      await queries.createLoginCode(email, hashedCode, expiresAt);
      await emailService.sendLoginCode(email, code); // Note: We send the PLAIN code to the user
      return res.json({ success: true, message: 'Código enviado a tu email.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error al generar el código.' });
    }
  },

  verifyCode: async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email y código son requeridos.' });

    try {
      const validCodes = await queries.getValidLoginCodesByEmail(email);
      let match = null;

      for (const entry of validCodes) {
        const isValid = await bcrypt.compare(code, entry.code);
        if (isValid) {
          match = entry;
          break;
        }
      }

      if (!match) {
        return res.status(400).json({ success: false, message: 'Código inválido o expirado.' });
      }

      await queries.markCodeAsUsed(match.id);

      let user = await queries.getUserByEmail(email);
      if (!user) {
        const userId = await queries.createUser(email);
        user = { id: userId, email };
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
      );

      return res.json({ success: true, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error al verificar el código.' });
    }
  }
};

module.exports = authController;
