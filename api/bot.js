const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://66ae3293fe7aad955f2182ca--magenta-naiad-786a93.netlify.app/'
}));

// Initialize bot
const token = process.env.BOT_TOKEN || '';
const webAppUrl = process.env.WEB_APP_URL || 'https://66ae3293fe7aad955f2182ca--magenta-naiad-786a93.netlify.app/';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Заходьте на наш сайт!', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Замовити сайт', web_app: { url: webAppUrl } }, { text: 'Залишити заявку', web_app: { url: webAppUrl + 'form' } }]
                ]
            }
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data);
            console.log(data);
            await bot.sendMessage(chatId, "Дякую за зворотній зв'язок!");

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю інформацію Ви отримаєте у цьому чаті');
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
