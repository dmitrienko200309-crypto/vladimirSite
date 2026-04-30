require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS настройки
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

// Эндпоинт отправки
app.post('/api/send-to-telegram', async (req, res) => {
    // Принимаем phone вместо email
    const { name, phone, telegram } = req.body;

    // Проверка полей
    if (!name?.trim() || !phone?.trim() || !telegram?.trim()) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    // Простая функция для защиты от HTML, НЕ кодирует русские буквы
    const escapeHtml = (text) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const message = `
🔔 <b>НОВАЯ ЗАЯВКА</b>

 <b>Имя:</b> ${escapeHtml(name)}
📞 <b>Телефон:</b> ${escapeHtml(phone)}
✈️ <b>Telegram:</b> ${escapeHtml(telegram)}

📅 <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</i>
    `.trim();

    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            console.error('❌ ОШИБКА: Переменные окружения не заданы!');
            return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
        }

        console.log('📤 Отправка заявки в Telegram...');
        
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
            console.log('✅ Заявка отправлена:', name);
            res.json({ success: true });
        } else {
            console.error('❌ Telegram API Error:', result.description);
            res.status(500).json({ error: 'Ошибка Telegram: ' + result.description });
        }
    } catch (error) {
        console.error('🚨 Server Error:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});