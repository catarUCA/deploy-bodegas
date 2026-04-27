const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodegaController = require('../controllers/bodegaController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Multer Storage (copied from original server.js)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const wineryName = req.body.winery_name || 'bodega';
    const cleanName = wineryName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const ext = path.extname(file.originalname).toLowerCase();
    // Guardamos con un sufijo temporal para evitar colisiones antes de la comparación
    cb(null, `${cleanName}_incoming${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // User updated to 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF.'));
    }
  },
});

router.get('/', authMiddleware, bodegaController.getBodega);

const uploadMiddleware = (req, res, next) => {
  const uploader = upload.single('history_pdf');
  uploader(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Error de archivo: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.post('/', authMiddleware, uploadMiddleware, bodegaController.saveBodega);

module.exports = router;
