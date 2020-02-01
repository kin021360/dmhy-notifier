const path = require('path');

module.exports = {
    tgBotToken: '',
    cachedbPath: path.resolve(__dirname, './leveldb/cachedb'),
    userdbPath: path.resolve(__dirname, './leveldb/userdb')
};