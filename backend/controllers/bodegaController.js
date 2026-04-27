const queries = require('../db/queries');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Helpers suggested by audit
const extractFilename = (filePath) => {
  if (!filePath) return null;
  return filePath.split('/').pop();
};

const normalizeName = (name) => {
  return (name || '')
    .toLowerCase()
    .replace(/\.pdf$/, '')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .trim();
};

const calculateHash = (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (err) {
    console.error('Error calculating hash:', err.message);
    return null;
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

      // 2. Determine paths and content changes
      let pdf_path = null;
      let physicalRenamed = false;
      let isRename = false;
      const cleanNewName = normalizeName(req.body.winery_name || 'bodega');

      if (req.file) {
        // New upload
        pdf_path = `/uploads/${req.file.filename}`;
        
        // Hash comparison
        if (oldPdfPath) {
          const oldLocalPath = path.join(__dirname, '..', 'uploads', extractFilename(oldPdfPath));
          const newLocalPath = path.join(__dirname, '..', 'uploads', req.file.filename);
          
          const oldHash = calculateHash(oldLocalPath);
          const newHash = calculateHash(newLocalPath);
          
          if (oldHash && newHash && oldHash === newHash) {
            isRename = true;
            console.log(`[Hash Match] File content is identical for ${req.body.winery_name}`);
          }
        }
      } else if (req.body.existing_pdf_path) {
        // Keeping existing file - check if winery name change requires a rename on disk
        pdf_path = req.body.existing_pdf_path;
        isRename = true; // No new content, so it's a rename (or no-op)
        
        const currentFilename = extractFilename(pdf_path);
        const ext = path.extname(currentFilename).toLowerCase();
        
        // Standard expected name (might include timestamp if already processed)
        // If it doesn't match winery name, we rename it
        if (!currentFilename.startsWith(cleanNewName)) {
          const expectedFilename = `${cleanNewName}_${Date.now()}${ext}`;
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
      const contentChanged = !!req.file && !isRename;
      const pathChanged = (pdf_path !== oldPdfPath);
      const shouldCallWebhook = contentChanged || pathChanged;

      // 4. Save to DB
      await queries.saveBodega(req.userId, { ...req.body, pdf_path });

      // 5. Trigger Webhook
      if (shouldCallWebhook) {
        const ingestaUrl = process.env.INGESTA_WEBHOOK_URL;
        if (ingestaUrl) {
          axios.post(ingestaUrl, {
            old_file: extractFilename(oldPdfPath),
            new_file: extractFilename(pdf_path),
            user_id: req.userId,
            bodega_name: req.body.winery_name,
            rename: isRename
          }).then(() => {
            // Cleanup old file ONLY after successful webhook notification
            if (oldPdfPath && (pdf_path !== oldPdfPath) && !physicalRenamed) {
              const oldFilename = extractFilename(oldPdfPath);
              const deletePath = path.join(__dirname, '..', 'uploads', oldFilename);
              if (fs.existsSync(deletePath)) {
                fs.unlink(deletePath, (err) => {
                  if (err) console.error('Delayed Cleanup Error:', err.message);
                  else console.log(`[Cleanup] Deleted old file: ${oldFilename}`);
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
