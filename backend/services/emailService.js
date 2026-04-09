const axios = require('axios');
require('dotenv').config();

const emailService = {
  sendLoginCode: async (email, code) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('⚠️ N8N_WEBHOOK_URL not set. Skipping email send (check logs for code).');
      console.log(`CODE FOR ${email}: ${code}`);
      return;
    }

    try {
      await axios.post(webhookUrl, { email, code });
      console.log(`✅ Code sent to n8n for ${email}`);
    } catch (err) {
      console.error('❌ Error sending to n8n:', err.message);
      // We don't throw here to avoid blocking the user if n8n is down, 
      // but in production you might want to.
    }
  }
};

module.exports = emailService;
