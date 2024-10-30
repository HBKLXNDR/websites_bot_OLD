// Delay execution for a specified number of milliseconds
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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


module.exports = {sendFollowUpMessage};