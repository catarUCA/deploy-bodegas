const queries = require('../db/queries');

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
      // Multer handled files, they are in req.files
      let pdf_path = null;
      if (req.files && req.files.length > 0) {
        pdf_path = JSON.stringify(req.files.map(f => `/uploads/${f.filename}`));
      } else if (req.body.existing_pdf_path) {
        pdf_path = req.body.existing_pdf_path;
      }

      await queries.saveBodega(req.userId, { ...req.body, pdf_path });
      return res.json({ success: true, message: '¡Bodega guardada con éxito!' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error al guardar datos.' });
    }
  }
};

module.exports = bodegaController;
