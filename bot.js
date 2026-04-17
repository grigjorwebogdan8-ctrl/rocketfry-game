const TelegramBot = require("node-telegram-bot-api");
const token = "8737108445:AAELtIIx5aUz8edomqWWBWioWXFpSyhHu2s";
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Добро пожаловать в игру 🚀", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Играть 🚀",
            web_app: { url: "https://crash-game-lac.vercel.app" }

          }
        ]
      ]
    }
  });
});
