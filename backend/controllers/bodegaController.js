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

const calculateHash = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const fileBuffer = await fs.promises.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
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
      const nameChanged = oldData && req.body.winery_name !== oldData.winery_name;
      
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const tempDir = path.join(uploadsDir, 'temp');

      let hashesMatch = false;

      if (req.file) {
        // El archivo nuevo está en /uploads/temp/nombre_incoming.pdf
        const tempLocalPath = path.join(tempDir, req.file.filename);
        const finalFilename = `${cleanNewName}${path.extname(req.file.originalname).toLowerCase()}`;
        const finalLocalPath = path.join(uploadsDir, finalFilename);

        if (oldPdfPath) {
          const oldLocalPath = path.join(uploadsDir, extractFilename(oldPdfPath));
          const oldHash = await calculateHash(oldLocalPath);
          const newHash = await calculateHash(tempLocalPath);
          
          if (oldHash && newHash && oldHash === newHash) {
            hashesMatch = true;
          }
        }

        if (hashesMatch) {
          // CONTENIDO IDÉNTICO
          try {
            await fs.promises.unlink(tempLocalPath); // No necesitamos el nuevo
          } catch(e) { console.error('Cleanup temp error', e); }

          if (!nameChanged) {
            console.log(`[Bypass] Identical file and name. No update needed.`);
            pdf_path = oldPdfPath; // Se queda como estaba
          } else {
            console.log(`[Hash Match] Content identical but name changed. Renaming old file.`);
            // Cambiar nombre al archivo físico viejo para que coincida con la nueva bodega
            const oldLocalPath = path.join(uploadsDir, extractFilename(oldPdfPath));
            if (fs.existsSync(oldLocalPath)) {
              try { await fs.promises.rename(oldLocalPath, finalLocalPath); } catch(e) {}
              physicalRenamed = true;
            }
            pdf_path = `/uploads/${finalFilename}`;
            isRename = true;
          }
        } else {
          // CONTENIDO DIFERENTE O ARCHIVO NUEVO
          console.log(`[New Content] Moving file from temp to uploads: ${finalFilename}`);
          // Si existía un archivo viejo con otro nombre, lo borramos (o lo dejamos para que lo borre el webhook .then)
          try {
            if (fs.existsSync(finalLocalPath)) await fs.promises.unlink(finalLocalPath); // Limpieza preventiva si el nombre coincide
            await fs.promises.rename(tempLocalPath, finalLocalPath);
          } catch(e) { console.error('Error in new content file ops', e); }
          pdf_path = `/uploads/${finalFilename}`;
          isRename = false;
        }
      } else if (req.body.existing_pdf_path) {
        // No se subió archivo, solo se cambió (o no) el nombre
        // Sanitize incoming path to prevent path traversal
        const safeBaseName = path.basename(req.body.existing_pdf_path);
        pdf_path = `/uploads/${safeBaseName}`;
        
        if (nameChanged) {
          isRename = true;
          const currentFilename = safeBaseName;
          const ext = path.extname(currentFilename).toLowerCase();
          const expectedFilename = `${cleanNewName}${ext}`;
          
          if (currentFilename !== expectedFilename) {
            const oldLocal = path.join(uploadsDir, currentFilename);
            const newLocal = path.join(uploadsDir, expectedFilename);
            if (fs.existsSync(oldLocal)) {
              try { await fs.promises.rename(oldLocal, newLocal); } catch(e){}
              pdf_path = `/uploads/${expectedFilename}`;
              physicalRenamed = true;
            }
          }
        }
      }

      // 3. Decide if we call the webhook
      const shouldCallWebhook = (!!req.file && !hashesMatch) || (isRename);

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
            // Limpieza del archivo viejo SOLO si el nombre cambió físicamente (no si fue sobrescrito)
            if (oldPdfPath && (pdf_path !== oldPdfPath) && !physicalRenamed && !hashesMatch) {
              const oldFilename = extractFilename(oldPdfPath);
              const deletePath = path.join(uploadsDir, oldFilename);
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
