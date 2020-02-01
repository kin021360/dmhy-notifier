const TelegramBot = require('node-telegram-bot-api');
const log4js = require('log4js');

const logger = log4js.getLogger('DmhyTgBot.js');

class TgMessage {
    constructor({chat: {id}, date, text}, matchedText, matchedTexts) {
        this.chatId = id;
        this.date = date;
        this.rawText = text;
        this.matchedText = matchedText;
        this.matchedTexts = matchedTexts;
    }
}

class DmhyTgBot {
    constructor(token) {
        this.token = token;
        this.bot = new TelegramBot(token, {polling: true});
        // this.initBot();
    }

    // initBot() {
    //     // Matches "/echo [whatever]"
    //     this.bot.onText(/\/echo (.+)/, (msg, match) => {
    //         // 'msg' is the received Message from Telegram
    //         // 'match' is the result of executing the regexp above on the text content
    //         // of the message
    //
    //         const chatId = msg.chat.id;
    //         const resp = match[1]; // the captured "whatever"
    //
    //         // send back the matched "whatever" to the chat
    //         this.bot.sendMessage(chatId, resp);
    //     });
    //
    //     this.bot.on('message', (msg) => {
    //         const chatId = msg.chat.id;
    //         console.log(msg);
    //         // send a message to the chat acknowledging receipt of their message
    //         this.bot.sendMessage(chatId, 'Received your message');
    //     });
    // }

    addCommand(regex, func) {
        this.bot.onText(regex, (msg, match) => {
            logger.info(`Received command: "${msg.text}"; Chat id: ${msg.chat.id}`);
            func(new TgMessage(msg, match[1], match));
        });
    }

    sendMessage(chatId, msg = '') {
        this.bot.sendMessage(chatId, msg);
    }
}

module.exports = DmhyTgBot;
// module.exports = TgMessage;