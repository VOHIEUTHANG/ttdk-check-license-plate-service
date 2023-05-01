const TelegramBot = require('node-telegram-bot-api');

function reportToTelegram(message) {
  // replace the value below with the Telegram token you receive from @BotFather
  const token = process.env.TELEGRAM_BOT_TOKEN || '5665305274:AAFlhbcpNijafxo9sCNqO2CBuojoRNP5ZFc';

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: false });

  const chatId = process.env.TELEGRAM_CHAT_ID || '@ManLiveNotify';
  bot.sendMessage(chatId, `${process.env.PROJECT_NAME} >> ${message}`);
}
module.exports = {
  reportToTelegram,
};
