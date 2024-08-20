const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errors } = require('celebrate');
const winston = require('winston');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['BOT_TOKEN', 'WEB_APP_URL', 'HOMEPAGE_URL', 'TG_ID'];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is required`);
    }
});

const app = express();
const webAppUrl = process.env.WEB_APP_URL;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: webAppUrl }));
app.use(helmet());

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per window
});
app.use(limiter);

// Logger setup with Winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// Initialize Telegram Bot
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

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



// Send a welcome message with custom keyboard options
async function sendStartMessage(chatId) {
        await bot.sendMessage(chatId, 'Заходьте на наш сайт!', {
            reply_markup: {
                keyboard: [
                    [
                        { text: 'Замовити сайт', web_app: { url: webAppUrl } },
                        { text: 'Залишити заявку', web_app: { url: `${webAppUrl}/form` } }
                    ]
                ]
            }
        }).catch((error)=> {
            logger.error('Error sending start message', error);
            console.log(error, error.code , error.response.body); // code => 'ETELEGRAM' , response.body => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
        });
}

// Handle data received from a web app via the Telegram bot
async function handleWebAppData(msg) {
    const chatId = msg.chat.id;
    try {
        const data = JSON.parse(msg?.web_app_data?.data);
        logger.info(`Received data from chatId ${chatId}:`, data);

        await bot.sendMessage(chatId, `Дякую за зворотній зв'язок!, Ваш chatId: ${chatId}`).catch((error)=> {
            logger.error('Error sending feedback ID message', error);
            console.log(error, error.code , error.response.body);
        });
        await bot.sendMessage(process.env.TG_ID, `Нова заявка: ${data.email}, ${data.number}, ${data.name}`).catch((error)=> {
            logger.error('Error sending new lead message', error);
            console.log(error, error.code , error.response.body);
        });;

        await sendFollowUpMessage(chatId);
    } catch (error) {
        console.error('Error handling web app data', error);
        logger.error('Error handling web app data', error);
    }
}

// Send a follow-up message after a delay
async function sendFollowUpMessage(chatId) {
    try {
        await delay(3000);
        await bot.sendMessage(chatId, `
            Всю інформацію Ви отримаєте у цьому чаті: @financial_grammarly,
            а поки наш менеджер займається обробкою Вашої заявки,
            завітайте на наш сайт! ${process.env.HOMEPAGE_URL}
        `);
    } catch (error) {
        console.error('Error sending follow-up message', error);
        logger.error('Error sending follow-up message', error);
    }
}

// Delay execution for a specified number of milliseconds
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Input validation for /web-data endpoint
app.post('/web-data', async (req, res) => {
    const { queryId, products, totalPrice } = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успішна купівля',
            input_message_content: {
                message_text: `Вітаю зі зверненням, ви купили товар на суму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        });
        res.status(200).json({});
    } catch (error) {
        console.error('Error in /web-data endpoint', error);
        logger.error('Error in /web-data endpoint', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET / endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the Telegram Bot API!',
        homepage: process.env.HOMEPAGE_URL,
        webAppUrl: webAppUrl
    });
});

app.use(errors());

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));

module.exports = app;