const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { celebrate, Joi, errors } = require('celebrate');
const winston = require('winston');
require('dotenv').config();

/**
 * Validate that all required environment variables are set.
 * @throws {Error} If a required environment variable is missing.
 */
const requiredEnvVars = ['BOT_TOKEN', 'WEB_APP_URL', 'HOMEPAGE_URL', 'TG_ID'];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is required`);
    }
});

const webAppUrl = process.env.WEB_APP_URL;
const app = express();
app.use(express.json());

app.use(cors({
    origin: webAppUrl
}));
app.use(helmet());

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logger setup
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

// Initialize bot
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * Handles incoming messages to the bot.
 * @param {Object} msg - The message object from Telegram.
 */
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await sendStartMessage(chatId);
    }

    if (msg?.web_app_data?.data) {
        await handleWebAppData(msg);
    }
});

/**
 * Sends a welcome message with custom keyboard options.
 * @param {number} chatId - The Telegram chat ID.
 * @returns {Promise<void>}
 */
async function sendStartMessage(chatId) {
    try {
        await bot.sendMessage(chatId, 'Заходьте на наш сайт!', {
            reply_markup: {
                keyboard: [
                    [
                        { text: 'Замовити сайт', web_app: { url: webAppUrl } },
                        { text: 'Залишити заявку', web_app: { url: `${webAppUrl}/form` } }
                    ]
                ]
            }
        });
    } catch (error) {
        logger.error('Error sending start message', error);
    }
}

/**
 * Handles data received from a web app through the Telegram bot.
 * @param {Object} msg - The message object from Telegram.
 * @returns {Promise<void>}
 */
async function handleWebAppData(msg) {
    const chatId = msg.chat.id;
    try {
        const data = JSON.parse(msg?.web_app_data?.data);
        logger.info(`Received data from chatId ${chatId}:`, data);

        await bot.sendMessage(chatId, `Дякую за зворотній зв'язок!, Ваш chatId: ${chatId}`);
        await bot.sendMessage(process.env.TG_ID, `Нова заявка: ${data.email}, ${data.number}, ${data.name}`);

        await sendFollowUpMessage(chatId);
    } catch (error) {
        logger.error('Error handling web app data', error);
    }
}

/**
 * Sends a follow-up message after a delay.
 * @param {number} chatId - The Telegram chat ID.
 * @returns {Promise<void>}
 */
async function sendFollowUpMessage(chatId) {
    try {
        await delay(3000);
        await bot.sendMessage(chatId, `
            Всю інформацію Ви отримаєте у цьому чаті: @financial_grammarly,
            а поки наш менеджер займається обробкою Вашої заявки,
            завітайте на наш сайт! ${process.env.HOMEPAGE_URL}
        `);
    } catch (error) {
        logger.error('Error sending follow-up message', error);
    }
}

/**
 * Delays execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>} Resolves after the specified delay.
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Input validation middleware
app.post('/web-data', celebrate({
    body: Joi.object().keys({
        queryId: Joi.string().required(),
        products: Joi.array().items(Joi.object({
            title: Joi.string().required()
        })).required(),
        totalPrice: Joi.number().required()
    })
}), async (req, res) => {
    const { queryId, products, totalPrice } = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успішна купівля',
            input_message_content: {
                message_text: ` Вітаю зі зверненням, ви купили товар на суму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        });
        return res.status(200).json({});
    } catch (error) {
        logger.error('Error in /web-data endpoint', error);
        return res.status(500).json({});
    }
});

/**
 * GET / endpoint.
 * Returns a simple welcome message and some basic information.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 */
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the Telegram Bot API!',
        homepage: process.env.HOMEPAGE_URL,
        webAppUrl: webAppUrl
    });
});

app.use(errors());

// Global error handler
/**
 * Global error handler middleware.
 * @param {Object} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
app.use((err, req, res, next) => {
    logger.error('Unhandled error', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = 8000;

app.listen(PORT, () => console.log('server started on PORT ' + PORT))

module.exports = app;
