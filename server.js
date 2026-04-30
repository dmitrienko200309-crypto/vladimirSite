require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS settings
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Send endpoint
app.post('/api/send-to-telegram', async (req, res) => {
    // Accept phone instead of email
    const { name, phone, telegram } = req.body;

    // Field validation
    if (!name?.trim() || !phone?.trim() || !telegram?.trim()) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    // Simple HTML escape function (preserves non-Latin characters)
    const escapeHtml = (text) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Telegram message template (English)
    const message = `
🔔 <b>NEW LEAD</b>

👤 <b>Name:</b> ${escapeHtml(name)}
📞 <b>Phone:</b> ${escapeHtml(phone)}
✈️ <b>Telegram:</b> ${escapeHtml(telegram)}

📅 <i>${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false })}</i>
    `.trim();

    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            console.error('❌ ERROR: Environment variables not configured!');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        console.log('📤 Sending lead to Telegram...');
        
        const tgRes = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            }
        );

        const result = await tgRes.json();

        if (result.ok) {
            console.log('✅ Lead sent successfully:', name);
            res.json({ success: true });
        } else {
            console.error('❌ Telegram API Error:', result.description);
            res.status(500).json({ error: 'Telegram error: ' + result.description });
        }
    } catch (error) {
        console.error('🚨 Server Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});