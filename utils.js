// Delay execution for a specified number of milliseconds
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Validate required environment variables
function variablesExistenceChecker() {
    const requiredEnvVars = ['BOT_TOKEN', 'WEB_APP_URL', 'HOMEPAGE_URL', 'TG_ID', 'PORT'];
    requiredEnvVars.forEach((varName) => {
        if (!process.env[varName]) {
            throw new Error(`Environment variable ${varName} is required`);
        }
    });
}

const variables = {
    frontend: process.env.WEB_APP_URL,
    websiteURL: process.env.HOMEPAGE_URL,
    token: process.env.BOT_TOKEN,
    telegramID: process.env.TG_ID,
    port: process.env.PORT
}

module.exports = {delay, variablesExistenceChecker, variables};