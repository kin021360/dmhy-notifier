const crypto = require('crypto');
const fs = require("fs");
const util = require('util');
fs.readFile = util.promisify(fs.readFile);
fs.writeFile = util.promisify(fs.writeFile);

function isMatch(str, conditions) {
    str = str.toLowerCase();
    for (const condition of conditions) {
        if (str.indexOf(condition) !== -1) return true;
    }
    return false;
}

module.exports = {
    fs,
    isMatch: isMatch,
    isBig5: (title) => {
        const conditions = ['big5', 'cht', '繁體', '繁体', '简繁', '繁简', '繁日', '日繁', '繁中'];
        return isMatch(title, conditions);
    },
    isToday: (oldDate, offsetCheckBack = 3) => {
        const now8 = new Date();
        const old8 = new Date(oldDate);
        now8.setUTCHours(now8.getUTCHours() + 8);
        old8.setUTCHours(old8.getUTCHours() + 8);
        if (now8.getUTCDate() === old8.getUTCDate()) {
            return true;
        }
        now8.setUTCHours(now8.getUTCHours() - offsetCheckBack);
        return old8 > now8;
    },
    genMD5: (str) => {
        return crypto.createHash('md5').update(str).digest('hex');
    },
    escapeForTgMarkdown: (str) => {
        return str.replace(/_/g, '\\_')
            .replace(/\*/g, '\\*')
            .replace(/\[/g, '\\[')
            .replace(/`/g, '\\`');
    },
    reduceMagnetQuerystring: (magnet, maxQuerystring = 22) => {
        const splited = magnet.split('&');
        if (splited.length > maxQuerystring) {
            return splited.slice(0, maxQuerystring).join('&');
        }
        return magnet;
    },
    messagesSplit(messageList, eachMsgItems = 15) {
        return messageList.reduce((current, item, index) => {
            const msgIndex = Math.floor(index / eachMsgItems);
            let msg = current[msgIndex] || '';
            msg += item;
            current[msgIndex] = msg;
            return current;
        }, []);
    }
};
