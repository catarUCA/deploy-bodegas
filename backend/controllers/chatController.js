const axios = require('axios');
require('dotenv').config();

const chatController = {
  /**
   * Proxies initialization to n8n
   */
  init: async (req, res) => {
    const { id_sesion } = req.body;
    if (!id_sesion) return res.status(400).json({ success: false, message: 'Falta id_sesion' });

    if (!process.env.CHAT_WEBHOOK_URL) {
      console.error('❌ CHAT_WEBHOOK_URL not defined in environment variables');
      return res.status(500).json({ success: false, message: 'Configuración del servidor incompleta (Webhook URL falta).' });
    }

    try {
      const response = await axios.post(process.env.CHAT_WEBHOOK_URL, {
        accion: 'init',
        id_sesion,
        jerez_context: 'Consulta pública desde el portal del archivo'
      }, { timeout: 10000 }); // 10s timeout
      console.log(`[ChatController] n8n INIT response for ${id_sesion}:`, response.data);
      return res.json({ success: true, data: response.data });
    } catch (err) {
      console.error('Chat Init Error:', err.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al iniciar el chat.',
        error: err.code === 'ECONNABORTED' ? 'Timeout: n8n no responde' : err.message 
      });
    }
  },

  /**
   * Proxies messages to n8n
   */
  message: async (req, res) => {
    const { id_sesion, input } = req.body;
    if (!id_sesion || !input) return res.status(400).json({ success: false, message: 'Faltan parámetros' });

    if (!process.env.CHAT_WEBHOOK_URL) {
      console.error('❌ CHAT_WEBHOOK_URL not defined in environment variables');
      return res.status(500).json({ success: false, message: 'Configuración del servidor incompleta (Webhook URL falta).' });
    }

    try {
      const response = await axios.post(process.env.CHAT_WEBHOOK_URL, {
        accion: 'chat',
        id_sesion,
        input
      }, { timeout: 30000 }); // 30s timeout for LLM
      console.log(`[ChatController] n8n MESSAGE response for ${id_sesion}:`, response.data);
      return res.json({ success: true, data: response.data });
    } catch (err) {
      console.error('Chat Message Error:', err.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Error en la comunicación con el archivo.',
        error: err.code === 'ECONNABORTED' ? 'Timeout: El archivo está tardando demasiado' : err.message
      });
    }
  }
};

module.exports = chatController;
