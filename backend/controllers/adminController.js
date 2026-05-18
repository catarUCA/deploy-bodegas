const queries = require('../db/queries');

const adminController = {
  dashboard: async (req, res) => {
    try {
      const rows = await queries.getDashboard();
      const data = rows.map(row => ({
        user_id: row.user_id,
        email: row.email,
        has_bodega: !!row.bodega_id,
        nombre: row.nombre || null,
        has_pdf: !!(row.pdf_path),
        bodega_updated_at: row.bodega_updated_at || null,
        user_created_at: row.user_created_at
      }));
      return res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error al obtener datos del dashboard.' });
    }
  }
};

module.exports = adminController;
