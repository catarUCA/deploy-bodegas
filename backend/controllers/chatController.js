const axios = require('axios');
require('dotenv').config();

const chatController = {
  /**
   * Proxies initialization to n8n
   */
  init: async (req, res) => {
    const { id_sesion } = req.body;
    if (!id_sesion) return res.status(400).json({ success: false, message: 'Falta id_sesion' });

    try {
      const response = await axios.post(process.env.CHAT_WEBHOOK_URL, {
        accion: 'init',
        id_sesion,
        jerez_context: 'Consulta pública desde el portal del archivo'
      });
      return res.json({ success: true, data: response.data });
    } catch (err) {
      console.error('Chat Init Error:', err.message);
      return res.status(500).json({ success: false, message: 'Error al iniciar el chat.' });
    }
  },

  /**
   * Proxies messages to n8n
   */
  message: async (req, res) => {
    const { id_sesion, input } = req.body;
    if (!id_sesion || !input) return res.status(400).json({ success: false, message: 'Faltan parámetros' });

    try {
      const response = await axios.post(process.env.CHAT_WEBHOOK_URL, {
        accion: 'chat',
        id_sesion,
        input
      });
      return res.json({ success: true, data: response.data });
    } catch (err) {
      console.error('Chat Message Error:', err.message);
      return res.status(500).json({ success: false, message: 'Error en la comunicación con el archivo.' });
    }
  }
};

module.exports = chatController;
