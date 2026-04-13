const queries = require('../db/queries');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bodegaController = {
  getBodega: async (req, res) => {
    try {
      const data = await queries.getBodegaByUserId(req.userId);
      return res.json({ success: true, data: data || null });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error al obtener datos.' });
    }
  },

  saveBodega: async (req, res) => {
    try {
      // 1. Get current data to find the old file path
      const oldData = await queries.getBodegaByUserId(req.userId);
      let oldPdfPath = null;
      if (oldData && oldData.pdf_path) {
        try {
          // Handle both old JSON format and new string format
          const parsed = JSON.parse(oldData.pdf_path);
          oldPdfPath = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
          oldPdfPath = oldData.pdf_path;
        }
      }

      // 2. Determine the new file path (Simplified string format)
      let pdf_path = null;
      if (req.file) {
        pdf_path = `/uploads/${req.file.filename}`;
      } else if (req.body.existing_pdf_path) {
        pdf_path = req.body.existing_pdf_path;
      }

      // 3. Save to database
      await queries.saveBodega(req.userId, { ...req.body, pdf_path });

      // 4. Handle Webhook and File Cleanup if the path changed
      if (pdf_path !== oldPdfPath && oldPdfPath) {
        // Trigger Ingesta Webhook
        const ingestaUrl = process.env.INGESTA_WEBHOOK_URL;
        if (ingestaUrl) {
          axios.post(ingestaUrl, {
            old_file: oldPdfPath,
            new_file: pdf_path
          }).catch(err => console.error('Error calling ingesta webhook:', err.message));
        }

        // Cleanup old file from disk
        const filename = oldPdfPath.split('/').pop();
        const oldFileLocalPath = path.join(__dirname, '..', 'uploads', filename);
        if (fs.existsSync(oldFileLocalPath)) {
          fs.unlink(oldFileLocalPath, (err) => {
            if (err) console.error(`Error deleting old file ${oldFileLocalPath}:`, err.message);
            else console.log(`Deleted old file: ${oldFileLocalPath}`);
          });
        }
      }

      return res.json({ success: true, message: '¡Bodega guardada con éxito!' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error al guardar datos.' });
    }
  }
};

module.exports = bodegaController;
