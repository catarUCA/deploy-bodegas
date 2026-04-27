const axios = require('axios');
require('dotenv').config();

const checkWebhookUrl = (res) => {
  if (!process.env.CHAT_WEBHOOK_URL) {
    console.error('❌ CHAT_WEBHOOK_URL not defined in environment variables');
    res.status(500).json({ success: false, message: 'Configuración del servidor incompleta.' });
    return false;
  }
  return true;
};

const chatController = {
  /**
   * Proxies initialization to n8n
   */
  init: async (req, res) => {
    const { id_sesion } = req.body;
    if (!id_sesion) return res.status(400).json({ success: false, message: 'Falta id_sesion' });

    if (!checkWebhookUrl(res)) return;

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
        message: err.code === 'ECONNABORTED' ? 'Timeout: n8n no responde' : 'Error interno al iniciar el chat.' 
      });
    }
  },

  /**
   * Proxies messages to n8n
   */
  message: async (req, res) => {
    const { id_sesion, input } = req.body;
    if (!id_sesion || !input) return res.status(400).json({ success: false, message: 'Faltan parámetros' });

    if (!checkWebhookUrl(res)) return;

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
        message: err.code === 'ECONNABORTED' ? 'Timeout: El archivo está tardando demasiado' : 'Error interno en la comunicación con el archivo.'
      });
    }
  }
};

module.exports = chatController;
