const queries = require('../db/queries');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdfStorage = require('../services/pdfStorage');
require('dotenv').config();

const normalizeName = (name) => {
  return (name || '')
    .toLowerCase()
    .replace(/\.pdf$/, '')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .trim();
};

const parsePdfPath = (dbPdfPath) => {
  if (!dbPdfPath) return null;
  try {
    const parsed = JSON.parse(dbPdfPath);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch (e) {
    return dbPdfPath;
  }
};

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
      const oldData = await queries.getBodegaByUserId(req.userId);
      const oldPdfPath = oldData ? parsePdfPath(oldData.pdf_path) : null;
      const nameChanged = oldData && oldData.winery_name !== req.body.winery_name;

      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const tempDir = path.join(uploadsDir, 'temp');

      let pdf_path = null;
      let contentChanged = false;
      let wasRenamed = false;
      let oldFileStillExists = false;

      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const tempAbsPath = path.join(tempDir, req.file.filename);
        const finalAbsPath = path.join(uploadsDir, `${normalizeName(req.body.winery_name || 'bodega')}${ext}`);
        const oldAbsPath = oldPdfPath ? path.join(uploadsDir, path.basename(oldPdfPath)) : null;

        const result = await pdfStorage.store(tempAbsPath, oldAbsPath, finalAbsPath);

        if (result.pdfPath) {
          pdf_path = `/uploads/${path.basename(result.pdfPath)}`;
          contentChanged = result.contentChanged;
          oldFileStillExists = result.oldFileStillExists;
          wasRenamed = !contentChanged && pdf_path !== oldPdfPath;
        } else {
          pdf_path = oldPdfPath;
        }
      } else if (req.body.existing_pdf_path) {
        const safeBaseName = path.basename(req.body.existing_pdf_path);
        const ext = path.extname(safeBaseName).toLowerCase();
        const currentAbsPath = path.join(uploadsDir, safeBaseName);

        if (nameChanged) {
          const finalAbsPath = path.join(uploadsDir, `${normalizeName(req.body.winery_name || 'bodega')}${ext}`);
          const result = await pdfStorage.rename(currentAbsPath, finalAbsPath);
          wasRenamed = result.renamed;
          pdf_path = result.renamed ? `/uploads/${path.basename(finalAbsPath)}` : `/uploads/${safeBaseName}`;
        } else {
          pdf_path = `/uploads/${safeBaseName}`;
        }
      }

      const shouldCallWebhook = contentChanged || wasRenamed;

      await queries.saveBodega(req.userId, { ...req.body, pdf_path });

      if (shouldCallWebhook) {
        const ingestaUrl = process.env.INGESTA_WEBHOOK_URL;
        if (ingestaUrl) {
          axios.post(ingestaUrl, {
            old_file: oldPdfPath ? path.basename(oldPdfPath) : null,
            new_file: pdf_path ? path.basename(pdf_path) : null,
            user_id: req.userId,
            bodega_name: req.body.winery_name,
            rename: wasRenamed
          }).then(() => {
            if (contentChanged && oldFileStillExists && oldPdfPath && pdf_path !== oldPdfPath) {
              const deletePath = path.join(uploadsDir, path.basename(oldPdfPath));
              if (fs.existsSync(deletePath)) {
                fs.unlink(deletePath, (err) => {
                  if (err) console.error('Delayed Cleanup Error:', err.message);
                  else console.log(`[Cleanup] Deleted old file: ${path.basename(oldPdfPath)}`);
                });
              }
            }
          }).catch(err => {
            console.error('Webhook notification failed:', err.message);
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
