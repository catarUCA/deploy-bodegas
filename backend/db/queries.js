const pool = require('./database');

const queries = {
  // Users
  getUserByEmail: async (email) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },
  createUser: async (email) => {
    const [result] = await pool.execute('INSERT INTO users (email, verified) VALUES (?, true)', [email]);
    return result.insertId;
  },

  // Login Codes
  createLoginCode: async (email, code, expiresAt) => {
    await pool.execute(
      'INSERT INTO login_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );
  },
  getValidLoginCodesByEmail: async (email) => {
    const [rows] = await pool.execute(
      'SELECT id, code FROM login_codes WHERE email = ? AND used = FALSE AND expires_at > NOW()',
      [email]
    );
    return rows;
  },
  markCodeAsUsed: async (id) => {
    await pool.execute('UPDATE login_codes SET used = TRUE WHERE id = ?', [id]);
  },

  // Bodegas
  getBodegaByUserId: async (userId) => {
    const [rows] = await pool.execute('SELECT * FROM bodegas WHERE user_id = ?', [userId]);
    return rows[0];
  },
  saveBodega: async (userId, data) => {
    const {
      winery_name, winery_address, winery_city, winery_province,
      winery_tel, winery_email, winery_web, winery_maps,
      winery_schedule, winery_description, permite_visitas, pdf_path
    } = data;

    const sql = `
      INSERT INTO bodegas 
        (user_id, nombre, direccion, poblacion, provincia, telefono, email, web, url_maps, horario, descripcion, visitas, pdf_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        direccion = VALUES(direccion),
        poblacion = VALUES(poblacion),
        provincia = VALUES(provincia),
        telefono = VALUES(telefono),
        email = VALUES(email),
        web = VALUES(web),
        url_maps = VALUES(url_maps),
        horario = VALUES(horario),
        descripcion = VALUES(descripcion),
        visitas = VALUES(visitas),
        pdf_path = VALUES(pdf_path)
    `;

    const values = [
      userId,
      winery_name || '',
      winery_address || null,
      winery_city || null,
      winery_province || null,
      winery_tel || null,
      winery_email || null,
      winery_web || null,
      winery_maps || null,
      winery_schedule || null,
      winery_description || null,
      permite_visitas ? 1 : 0,
      pdf_path || null
    ];

    await pool.execute(sql, values);
  }
};

module.exports = queries;
