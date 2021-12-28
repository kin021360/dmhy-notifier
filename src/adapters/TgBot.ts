import TelegramBot from 'node-telegram-bot-api';

import TgError from 'src/entities/TgError';
import { TgMessage } from 'src/entities/TgMessage';
import { logger as baseLogger } from 'src/logger';

const logger = baseLogger.child({ source: 'TgBot' });

export class TgBot {
    readonly bot: TelegramBot;

    constructor(token: string) {
        this.bot = new TelegramBot(token, {
            polling: true,
            onlyFirstMatch: true,
        });
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

    addCommand(regex: RegExp, func: (x: TgMessage) => void): void {
        this.bot.onText(regex, async (msg, match) => {
            try {
                logger.info({ chatId: msg.chat.id, command: msg.text }, 'Received command');
                func({
                    chatId: msg.chat.id,
                    date: msg.date,
                    rawText: msg.text,
                    matchedText: match?.[1] || '',
                    matchedTexts: match || [],
                });
            } catch (e) {
                logger.error(
                    {
                        chatId: msg.chat.id,
                        command: msg.text,
                        err: e,
                    },
                    'Failed to process command',
                );
            }
        });
    }

    sendMessage(chatId: number, msg = '', option = {}): Promise<TelegramBot.Message> {
        return this.bot.sendMessage(chatId, msg, option).catch((e: Error) => {
            logger.warn({ chatId, err: e }, 'SendMessage');
            throw new TgError(e, chatId);
        });
    }

    sendPhoto(
        chatId: number,
        buffBase64: string | null,
        option: Record<string, any> = {},
    ): Promise<TelegramBot.Message> {
        if (buffBase64) {
            const imageBuff = Buffer.from(buffBase64, 'base64');
            return this.bot.sendPhoto(chatId, imageBuff, option).catch((e: Error) => {
                logger.warn({ chatId, err: e }, 'SendPhoto');
                throw new TgError(e, chatId);
            });
        }
        return this.sendMessage(chatId, option.caption);
    }
}
