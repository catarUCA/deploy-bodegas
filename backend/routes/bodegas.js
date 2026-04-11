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
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    req._fileCounter = (req._fileCounter || 0) + 1;
    const wineryName = req.body.winery_name || 'bodega';
    const cleanName = wineryName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const ext = path.extname(file.originalname);
    cb(null, `${cleanName}_${req._fileCounter}${ext}`);
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
router.post('/', authMiddleware, upload.single('history_pdf'), bodegaController.saveBodega);

module.exports = router;
