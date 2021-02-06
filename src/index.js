'use strict';
const log4js = require('log4js');
log4js.configure({
    appenders: {
        console: {type: 'console'}
    },
    categories: {
        default: {appenders: ['console'], level: 'info'},
    }
});
const logger = log4js.getLogger('index.js');

const {DmhyTgBot, LeveldbAdapter} = require('./adapters');
const {User, Subscribe} = require('./datastructures');
const {DmhyRssService, MoeRssService} = require('./services');
const {Cache, ZlibHelper} = require('./utils');
const {isToday, genMD5, escapeForTgMarkdown, reduceMagnetQuerystring, reduceMessagesSplit} = require('./utils/util');
const {tgBotToken, cachedbPath, userdbPath, magnetHelperLink} = require('../config');

const cachedb = new LeveldbAdapter(cachedbPath);
const userdb = new LeveldbAdapter(userdbPath);
const dmhyTgBot = new DmhyTgBot(tgBotToken);
const dmhyRssService = new DmhyRssService();
const moeRssService = new MoeRssService();
const cache = new Cache(fetchAllServices, 900000);

async function fetchAllServices() {
    try {
        const [feed1, feed2] = await Promise.all([moeRssService.fetch({limit: 100}), dmhyRssService.fetch()]);
        const allItems = feed1.reduce((current, item) => {
            const find = current.find(i => i.title === item.title);
            if (find) {
                find.link.push(item.link[0]);
            } else {
                current.push(item);
            }
            return current;
        }, feed2);
        const list = allItems.filter(i => isToday(i.isoDate));
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
            const cacheKey = user.chatId + genMD5(satisfiedItem.title);
            const exist = await cachedb.getV(cacheKey);
            if (!exist) {
                await cachedb.setKV(cacheKey, true, 86400000);
                titles += `${escapeForTgMarkdown(satisfiedItem.title)} - *${satisfiedItem.pubDate}*\n`;
                titles += satisfiedItem.link.map((i) => {
                    let str = `*${i.source}:*\n- ${escapeForTgMarkdown(i.link)}`;
                    if (magnetHelperLink && i.magnet) {
                        const shorterMagnet = reduceMagnetQuerystring(i.magnet);
                        str += `\n- [Magnet link](${magnetHelperLink}#${encodeURIComponent(ZlibHelper.zip(shorterMagnet.replace('magnet:?', '')))})`;
                    }
                    return str;
                }).join('\n');
                titles += '\n';
            }
        }
    }
    return titles;
}


dmhyTgBot.addCommand(/\/subs ([^;]+)(?:;([^;]+)?)?/, async (tgMessage) => {
    let user = null;
    const record = await userdb.getV(tgMessage.chatId);
    const preferredFansub = tgMessage.matchedTexts.length > 2 && tgMessage.matchedTexts[2] === '@' ? Subscribe.fansubList : tgMessage.matchedTexts[2];
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
        dmhyTgBot.sendMessage(tgMessage.chatId, record);
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/list$/, async (tgMessage) => {
    const record = await userdb.getV(tgMessage.chatId);
    if (record) {
        const user = User.deserialize(record);
        const list = user.subscribeList.map((i) => {
            let msg = '';
            msg += `Id: ${i.id}\n`;
            msg += `SearchName: ${i.searchName.toString()}\n`;
            msg += `PreferredFansub: ${i.preferredFansub}\n`;
            msg += `Delete: /delsub${i.id}\n`;
            msg += `----------------\n`;
            return msg;
        });
        reduceMessagesSplit(list).forEach(i => dmhyTgBot.sendMessage(tgMessage.chatId, i));
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/delsubs (.+)/, async (tgMessage) => {
    const record = await userdb.getV(tgMessage.chatId);
    const ids = tgMessage.matchedText.split(',');
    if (record && ids.length > 0) {
        const user = User.deserialize(record);
        ids.forEach(id => id && user.deleteSubscribe(id));
        await userdb.setKV(tgMessage.chatId, user.serialize());
        dmhyTgBot.sendMessage(tgMessage.chatId, 'done!');
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/delsub(.+)/, async (tgMessage) => {
    const record = await userdb.getV(tgMessage.chatId);
    const id = tgMessage.matchedText;
    if (record && id) {
        const user = User.deserialize(record);
        user.deleteSubscribe(id);
        await userdb.setKV(tgMessage.chatId, user.serialize());
        dmhyTgBot.sendMessage(tgMessage.chatId, 'done!');
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/check$/, async (tgMessage) => {
    const fetchedList = await cache.get();
    const record = await userdb.getV(tgMessage.chatId);
    const user = record && User.deserialize(record);

    let titles = await checkUserFetchedList(user, fetchedList);
    if (!user || !titles) titles = 'No update!';
    dmhyTgBot.sendMessage(tgMessage.chatId, titles, {parse_mode: 'Markdown'});
});

dmhyTgBot.addCommand(/.+/, async (tgMessage) => {
    let msg = `
    Available commands:
    /subs xxx
    /subs xxx,yyy
    /subs xxx;@
    /subs xxx;fansubKeywords
    /check
    /list
    /delsubs id1,id2
    /listsubs
    `;
    dmhyTgBot.sendMessage(tgMessage.chatId, msg);
});


// Setup schedule to check new updates for every 2 hours
setInterval(async () => {
    try {
        logger.info('Schedule triggered');
        const fetchedList = await cache.get();
        const recordSet = await userdb.scanKV();

        for (const record of recordSet) {
            const user = User.deserialize(record.value);
            let titles = await checkUserFetchedList(user, fetchedList);
            if (titles) {
                dmhyTgBot.sendMessage(user.chatId, titles, {parse_mode: 'Markdown'});
            } else {
                // dmhyTgBot.sendMessage(user.chatId, 'No update!');
            }
        }
        const nextTime = new Date();
        nextTime.setTime(nextTime.getTime() + 7200000);
        logger.info('Next schedule at ' + nextTime.toString());
        global.gc && global.gc();
    } catch (e) {
        logger.error(e);
    }
}, 7200000);
