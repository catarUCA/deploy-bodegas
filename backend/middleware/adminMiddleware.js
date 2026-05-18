const jwt = require('jsonwebtoken');
const queries = require('../db/queries');
require('dotenv').config();

const adminMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No autenticado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no configurado');
    }
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;

    const user = await queries.getUserById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
};

module.exports = adminMiddleware;
