const crypto = require('crypto');
const fs = require("fs");
const util = require('util');
const Parser = require('rss-parser');
const parser = new Parser();
const log4js = require('log4js');
fs.readFile = util.promisify(fs.readFile);
fs.writeFile = util.promisify(fs.writeFile);
parser.parseURL = util.promisify(parser.parseURL);
log4js.configure({
    appenders: {
        console: {type: 'console'}
    },
    categories: {
        default: {appenders: ['console'], level: 'info'},
    }
});

const {tgBotToken, cachedbPath, userdbPath} = require('../config');
const User = require('./datastructures/User');
const Item = require('./datastructures/Item');
const {Subscribe, fansubList} = require('./datastructures/Subscribe');
const DmhyTgBot = require('./adapters/DmhyTgBot');
const LeveldbAdapter = require('./adapters/LeveldbAdapter');
const Cache = require('./utils/Cache');

const cachedb = new LeveldbAdapter(cachedbPath);
const userdb = new LeveldbAdapter(userdbPath);
const dmhyTgBot = new DmhyTgBot(tgBotToken);
const logger = log4js.getLogger('index.js');
const cache = new Cache(fetchDmhy, 900000);


function genMD5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function isToday(oldDate) {
    const now8 = new Date();
    const old8 = new Date(oldDate);
    now8.setUTCHours(now8.getUTCHours() + 8);
    old8.setUTCHours(old8.getUTCHours() + 8);
    return now8.getUTCDate() === old8.getUTCDate();
}

async function fetchDmhy() {
    try {
        const feed = await parser.parseURL('https://share.dmhy.org/topics/rss/rss.xml');
        const list = feed.items.filter(i => isToday(i.isoDate));
        logger.info('Fetched & today items: ' + list.length);
        return list;
    } catch (e) {
        logger.error(e);
        return null;
    }
}

async function checkUserFetchedList(user, fetchedList) {
    let titles = '';
    if (!fetchedList) return titles;
    for (const subscribe of user.subscribeList) {
        const satisfiedItems = subscribe.checkSatisfiedItems(fetchedList);
        for (const satisfiedItem of satisfiedItems) {
            const cacheKey = user.chatId + genMD5(satisfiedItem.link);
            const exist = await cachedb.getV(cacheKey);
            if (!exist) {
                await cachedb.setKV(cacheKey, true, 86400000);
                titles += satisfiedItem.title + '\n' + satisfiedItem.link + '\n';
            }
        }
    }
    return titles;
}


dmhyTgBot.addCommand(/\/subs ([^;]+)(?:;([^;]+)?)?/, async (tgMessage) => {
    let user = null;
    const record = await userdb.getV(tgMessage.chatId);
    const preferredFansub = tgMessage.matchedTexts.length > 2 && tgMessage.matchedTexts[2] === '@' ? fansubList : tgMessage.matchedTexts[2];
    if (record) {
        user = User.deserialize(record);
        user.addSubscribe(new Subscribe(tgMessage.matchedText, preferredFansub));
    } else {
        user = new User(tgMessage.chatId).addSubscribe(new Subscribe(tgMessage.matchedText, preferredFansub));
    }
    await userdb.setKV(tgMessage.chatId, user.serialize());
    dmhyTgBot.sendMessage(tgMessage.chatId, 'Done!');
});

dmhyTgBot.addCommand(/\/listsubs$/, async (tgMessage) => {
    const record = await userdb.getV(tgMessage.chatId);
    if (record) {
        // const user = User.deserialize(record);
        dmhyTgBot.sendMessage(tgMessage.chatId, record);
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/list$/, async (tgMessage) => {
    const record = await userdb.getV(tgMessage.chatId);
    if (record) {
        let msg = '';
        const user = User.deserialize(record);
        user.subscribeList.forEach((i) => {
            msg += `Id: ${i.id}\n`;
            msg += `SearchName: ${i.searchName.toString()}\n`;
            msg += `PreferredFansub: ${i.preferredFansub}\n`;
            msg += `-----------\n`;
        });
        dmhyTgBot.sendMessage(tgMessage.chatId, msg);
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/delsubs (.+)/, async (tgMessage) => {
    const record = await userdb.getV(tgMessage.chatId);
    if (record) {
        const user = User.deserialize(record);
        user.deleteSubscribe(tgMessage.matchedText);
        await userdb.setKV(tgMessage.chatId, user.serialize());
        dmhyTgBot.sendMessage(tgMessage.chatId, 'done!');
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/check$/, async (tgMessage) => {
    const fetchedList = await cache.get();
    const record = await userdb.getV(tgMessage.chatId);
    const user = User.deserialize(record);

    let titles = await checkUserFetchedList(user, fetchedList);
    if (!titles) titles = 'No update!';
    dmhyTgBot.sendMessage(user.chatId, titles);
});


// Setup schedule to check new updates for every 2 hours
setInterval(async () => {
    logger.info('Schedule triggered');
    const fetchedList = await cache.get();
    const recordSet = await userdb.scanKV();

    for (const record of recordSet) {
        const user = User.deserialize(record.value);
        let titles = await checkUserFetchedList(user, fetchedList);
        if (titles) {
            dmhyTgBot.sendMessage(user.chatId, titles);
        } else {
            // dmhyTgBot.sendMessage(user.chatId, 'No update!');
        }
    }
    const nextTime = new Date();
    nextTime.setTime(nextTime.getTime() + 7200000);
    logger.info('Next schedule at ' + nextTime.toString());
}, 7200000);
