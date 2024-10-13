const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
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
app.use(cors({ origin: '*' }));


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

// Matches /form
bot.onText(/\/form/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, 'Щоб відкрити форму, будь ласка, натисніть на кнопку нижче:', {
        reply_markup: {
            keyboard: [
                [
                    { text: 'Відкрити форму', web_app: { url: `${webAppUrl}/form` } }
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
                    { text: 'Замовити сайт', web_app: { url: webAppUrl } }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    }).catch((error) => {
        console.error('Error sending shop message:', error);
    });
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
            console.log(error, error.code , error.response.body); // code => 'ETELEGRAM' , response.body => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
        });
}

// Handle data received from a web app via the Telegram bot
async function handleWebAppData(msg) {
    const chatId = msg.chat.id;
    try {
        const data = JSON.parse(msg?.web_app_data?.data);
        console.error(`Received data from chatId ${chatId}:`, data);

        await bot.sendMessage(chatId, `Дякую за зворотній зв'язок!, Ваш chatId: ${chatId}`)
            .catch((error)=> {
                console.error('Error sending feedback ID message', error);
                console.log(error, error.code , error.response.body);
        });
        await bot.sendMessage(process.env.TG_ID, `Нова заявка: ${data.email}, ${data.number}, ${data.name}`)
            .catch((error)=> {
                console.error('Error sending new lead message', error);
                console.log(error, error.code , error.response.body);
        });;

        await sendFollowUpMessage(chatId);
    } catch (error) {
        console.error('Error handling web app data', error);
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
    }
}

// Delay execution for a specified number of milliseconds
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello from Render!</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      Hello from telegram bot!
    </section>
  </body>
</html>
`

app.get("/", (req, res) => res.type('html').send(html));

// // GET / endpoint
// app.get('/', (req, res) => {
//     return res.status(200).json({
//         message: 'Welcome to the Telegram Bot API!',
//         homepage: process.env.HOMEPAGE_URL,
//         webAppUrl: webAppUrl
//     });
// });

// Input validation for /web-data endpoint
app.post('/web-data', async (req, res) => {
    const { products, totalPrice, queryId } = req.body;
    console.log(products, totalPrice, queryId);
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
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));

module.exports = app;