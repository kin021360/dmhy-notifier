const path = require('path');

module.exports = {
    tgBotToken: '', // Telegram bot API token
    cachedbPath: path.resolve(__dirname, './leveldb/cachedb'),
    userdbPath: path.resolve(__dirname, './leveldb/userdb')
};