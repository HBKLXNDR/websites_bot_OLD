const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {html} = require('../constants');
const {delay, variablesExistenceChecker, variables} = require('../utils');

//check for variables existence
variablesExistenceChecker();

const app = express();
// Middleware setup
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({origin: '*'}));

// environment variables

// Initialize Telegram Bot
const bot = new TelegramBot(variables.token, {polling: true});

console.log(bot);
// Handle incoming messages to the bot
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    console.log(msg);
    if (text === '/start') {
        await sendStartMessage(chatId);
    }

    if (msg?.web_app_data?.data) {
        await handleWebAppData(msg);
    }
});

// Matches /form
bot.onText(/\/form/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, 'Щоб відкрити форму, будь ласка, натисніть на кнопку нижче:', {
        reply_markup: {
            keyboard: [
                [
                    {text: 'Відкрити форму', web_app: {url: `${variables.frontend}/form`}}
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    }).catch((error) => {
        console.error('Error sending form message:', error);
    });
});

bot.onText(/\/site/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, 'Переходьте на наш сайт!', {
        reply_markup: {
            keyboard: [
                [
                    {text: 'Відкрити сайт', web_app: {url: variables.websiteURL}},
                    {text: 'Залишити заявку на сайті', web_app: {url: `${variables.websiteURL}/contact`}}
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    }).catch((error) => {
        console.error('Error sending form message:', error);
    });
});

// Matches /shop
bot.onText(/\/shop/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, 'Щоб перейти до нашого магазину, натисніть кнопку нижче:', {
        reply_markup: {
            keyboard: [
                [
                    {text: 'Замовити сайт', web_app: {url: variables.frontend}}
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    }).catch((error) => {
        console.error('Error sending shop message:', error);
    });
});

// Handle '/help' command
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Commands: /start, /help, /site, /shop, /form').catch((error) => {
        console.log(error, error.code, error.response.body); // code => 'ETELEGRAM' , response.body => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
    });
})

bot.on('polling_error', (error) => {
    console.log(error.code, 'polling error');  // => 'EFATAL'
});

// Send a follow-up message after a delay
async function sendFollowUpMessage(chatId) {
    try {
        await delay(3000);
        await bot.sendMessage(chatId, `
            Всю інформацію Ви отримаєте у цьому чаті: @financial_grammarly,
            а поки наш менеджер займається обробкою Вашої заявки,
            завітайте на наш сайт! ${variables.websiteURL}
        `);
    } catch (error) {
        console.error('Error sending follow-up message', error);
    }
}

// Send a welcome message with custom keyboard options
async function sendStartMessage(chatId) {
    await bot.sendMessage(chatId, 'Заходьте на наш сайт!', {
        reply_markup: {
            keyboard: [
                [
                    {text: 'Замовити сайт', web_app: {url: variables.frontend}},
                    {text: 'Залишити заявку', web_app: {url: `${variables.frontend}/form`}}
                ]
            ]
        }
    }).catch((error) => {
        console.log(error, error.code, error.response.body); // code => 'ETELEGRAM' , response.body => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
    });
}

// Handle data received from a web app via the Telegram bot
async function handleWebAppData(msg) {
    const chatId = msg.chat.id;
    try {
        const data = JSON.parse(msg?.web_app_data?.data);
        console.error(`Received data from chatId ${chatId}:`, data);

        await bot.sendMessage(chatId, `Дякую за зворотній зв'язок!, Ваш chatId: ${chatId}`)
            .catch((error) => {
                console.error('Error sending feedback ID message', error);
                console.log(error, error.code, error.response.body);
            });
        await bot.sendMessage(variables.telegramID, `Нова заявка: ${data.email}, ${data.number}, ${data.name}`)
            .catch((error) => {
                console.error('Error sending new lead message', error);
                console.log(error, error.code, error.response.body);
            });

        await sendFollowUpMessage(chatId);
    } catch (error) {
        console.error('Error handling web app data', error);
    }
}

// // GET / endpoint
app.get("/", (req, res) => res.type('html').send(html));


// Input validation for /web-data endpoint
app.post('/web-data', async (req, res) => {
    const {products, totalPrice, queryId} = req.body;
    try {
        console.log('it happenned!!')
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успішна купівля',
            input_message_content: {
                message_text: `Вітаю зі зверненням, ви купили товар на суму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        });
        return res.status(200).json({});
    } catch (error) {
        console.log('it did not happen(')
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'НЕ успішна купівля',
            input_message_content: {
                message_text: `Вийшла помилка з придбанням товару на сумму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        });
        console.error('Error in /web-data endpoint', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
});


const PORT = variables.port || 8000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));

module.exports = app;