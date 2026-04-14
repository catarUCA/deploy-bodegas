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
      // 1. Get current record to compare
      const oldData = await queries.getBodegaByUserId(req.userId);
      let oldPdfPath = null;
      if (oldData && oldData.pdf_path) {
        try {
          const parsed = JSON.parse(oldData.pdf_path);
          oldPdfPath = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
          oldPdfPath = oldData.pdf_path;
        }
      }

      // 2. Determine new path and handle renames if necessary
      let pdf_path = null;
      let physicalRenamed = false;
      const newWineryName = req.body.winery_name || 'bodega';
      const cleanNewName = newWineryName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();

      if (req.file) {
        // New upload handles itself via Multer
        pdf_path = `/uploads/${req.file.filename}`;
      } else if (req.body.existing_pdf_path) {
        // Keeping existing file - check if winery name change requires a rename on disk
        pdf_path = req.body.existing_pdf_path;
        const currentFilename = pdf_path.split('/').pop();
        const ext = path.extname(currentFilename).toLowerCase();
        const expectedFilename = `${cleanNewName}${ext}`;

        if (currentFilename !== expectedFilename) {
          const oldLocal = path.join(__dirname, '..', 'uploads', currentFilename);
          const newLocal = path.join(__dirname, '..', 'uploads', expectedFilename);
          if (fs.existsSync(oldLocal)) {
            fs.renameSync(oldLocal, newLocal);
            pdf_path = `/uploads/${expectedFilename}`;
            physicalRenamed = true;
          }
        }
      }

      // 3. Decide if we call the webhook
      const contentChanged = !!req.file;
      const pathChanged = (pdf_path !== oldPdfPath);
      const shouldCallWebhook = contentChanged || pathChanged;

      // 4. Save to DB
      await queries.saveBodega(req.userId, { ...req.body, pdf_path });

      // 5. Trigger Webhook
      if (shouldCallWebhook) {
        const ingestaUrl = process.env.INGESTA_WEBHOOK_URL;
        if (ingestaUrl) {
          axios.post(ingestaUrl, {
            old_file: oldPdfPath,
            new_file: pdf_path
          }).catch(err => console.error('Webhook error:', err.message));
        }

        // Cleanup old file IF it changed AND wasn't already handled by rename/overwrite
        // We only delete if pathChanged is true, we had an old path, and it wasn't just renamed on disk
        if (pathChanged && oldPdfPath && !physicalRenamed) {
          const oldFilename = oldPdfPath.split('/').pop();
          const newFilename = pdf_path ? pdf_path.split('/').pop() : null;
          
          // Only delete if the filename is actually different (Multer might have overwriten the same name)
          if (oldFilename !== newFilename) {
            const deleteLocal = path.join(__dirname, '..', 'uploads', oldFilename);
            if (fs.existsSync(deleteLocal)) {
              fs.unlink(deleteLocal, (err) => {
                if (err) console.error('Delete error:', err.message);
              });
            }
          }
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
