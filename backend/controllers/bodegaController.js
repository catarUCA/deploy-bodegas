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
      // Multer handled file, it is in req.file
      let pdf_path = null;
      if (req.file) {
        pdf_path = JSON.stringify([`/uploads/${req.file.filename}`]);
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
