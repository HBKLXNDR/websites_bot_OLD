const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.WEB_APP_URL
}));

const url = process.env.HOMEPAGE_URL;

// Initialize bot
const token = process.env.BOT_TOKEN || '';
const webAppUrl = process.env.WEB_APP_URL || '';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Заходьте на наш сайт!', {
            reply_markup: {
                keyboard: [
                    [
                        { text: 'Замовити сайт', web_app: { url: webAppUrl } },{ text: 'Залишити заявку', web_app: { url: webAppUrl + 'form' } }
                    ]
                ]
            }
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data);
            console.log(data, chatId);
            await bot.sendMessage(chatId, `Дякую за зворотній зв'язок!, Ваш chatId: ${chatId}`);
            await bot.sendMessage(process.env.TG_ID, `Нова заявка: ${data.email}, ${data.number}, ${data.name}`)

            setTimeout(async () => {
                await bot.sendMessage(chatId, `
                Всю інформацію Ви отримаєте у цьому чаті: @financial_grammarly,
                а поки наш менеджер займається обробкою Вашої заявки,
                завітайте на наш сайт! ${url}
                `);
            }, 3000);
        } catch (e) {
            console.log(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успішна купівля',
            input_message_content: {
                message_text: ` Вітаю зі зверненням, вы купили товар на суму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        });
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({});
    }
});

module.exports = app;
