const path = require('path');

module.exports = {
    tgBotToken: '' || process.env.tgBotToken, // Telegram bot API token
    cachedbPath: path.resolve(__dirname, './leveldb/cachedb'),
    userdbPath: path.resolve(__dirname, './leveldb/userdb'),
    magnetHelperLink: '' || process.env.magnetHelperLink,
};
