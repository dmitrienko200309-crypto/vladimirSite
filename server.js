require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS
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

// Эндпоинт для приёма заявок
app.post('/api/send-to-telegram', async (req, res) => {
    const { name, email, telegram } = req.body;

    if (!name?.trim() || !email?.trim() || !telegram?.trim()) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    const escape = (str) => str.replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[s]);

    const message = `
🔔 <b>НОВАЯ ЗАЯВКА</b>

👤 <b>Имя:</b> ${escape(name)}
📧 <b>Email:</b> ${escape(email)}
✈️ <b>Telegram:</b> ${escape(telegram)}

📅 <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</i>
    `.trim();

    try {
        const tgRes = await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            }
        );

        const result = await tgRes.json();

        if (result.ok) {
            console.log('✅ Заявка отправлена в Telegram:', { name, email });
            res.json({ success: true });
        } else {
            console.error('❌ Telegram API error:', result);
            throw new Error(result.description || 'Unknown Telegram error');
        }
    } catch (error) {
        console.error('🚨 Ошибка отправки заявки:', error.message);
        res.status(500).json({ error: 'Не удалось отправить заявку. Попробуйте позже.' });
    }
});

app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`
🚀 TradeElite Server запущен!
📍 Локально: http://localhost:${PORT}
📦 Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✓ настроен' : '✗ НЕ настроен!'}
🔐 Режим: ${process.env.NODE_ENV || 'development'}
    `.trim());
});