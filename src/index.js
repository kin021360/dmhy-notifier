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
const {isToday, genMD5, escapeForTgMarkdown, reduceMagnetQuerystring, messagesSplit} = require('./utils/util');
const {tgBotToken, cachedbPath, userdbPath, magnetHelperLink} = require('../config');

const cachedb = new LeveldbAdapter(cachedbPath);
const userdb = new LeveldbAdapter(userdbPath, User);
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
    let titles = [];
    if (!fetchedList) return titles;
    for (const subscribe of user.subscribeList) {
        const satisfiedItems = subscribe.checkSatisfiedItems(fetchedList);
        for (const satisfiedItem of satisfiedItems) {
            const cacheKey = user.chatId + genMD5(satisfiedItem.title);
            const exist = await cachedb.getV(cacheKey);
            if (!exist) {
                let title = '';
                title += `${escapeForTgMarkdown(satisfiedItem.title)} - *${satisfiedItem.pubDate}*\n`;
                title += satisfiedItem.link.map((i) => {
                    let str = `*${i.source}:*\n- ${escapeForTgMarkdown(i.link)}`;
                    if (magnetHelperLink && i.magnet) {
                        const shorterMagnet = reduceMagnetQuerystring(i.magnet);
                        str += `\n- [Magnet link](${magnetHelperLink}#${encodeURIComponent(ZlibHelper.zip(shorterMagnet.replace('magnet:?', '')))})`;
                    }
                    return str;
                }).join('\n');
                title += '\n';
                titles.push(title);
                await cachedb.setKV(cacheKey, true, 86400000);
            }
        }
    }
    return titles;
}


dmhyTgBot.addCommand(/\/subs ([^;]+)(?:;([^;]+)?)?/, async (tgMessage) => {
    let user = await userdb.getEntity(tgMessage.chatId);
    const preferredFansub = tgMessage.matchedTexts.length > 2 && tgMessage.matchedTexts[2] === '@' ? Subscribe.fansubList : tgMessage.matchedTexts[2];
    if (user) {
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
    const user = await userdb.getEntity(tgMessage.chatId);
    if (user) {
        const list = user.subscribeList.map((i, index) => {
            let msg = `${index + 1}.\n`;
            msg += `Id: ${i.id}\n`;
            msg += `SearchName: ${i.searchName.toString()}\n`;
            msg += `PreferredFansub: ${i.preferredFansub}\n`;
            msg += `Delete: /delsub${i.id}\n`;
            msg += `----------------\n`;
            return msg;
        });
        dmhyTgBot.sendMessage(tgMessage.chatId, `Total items: ${list.length}`);
        messagesSplit(list).forEach(i => dmhyTgBot.sendMessage(tgMessage.chatId, i));
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/delsubs (.+)/, async (tgMessage) => {
    const user = await userdb.getEntity(tgMessage.chatId);
    const ids = tgMessage.matchedText.split(',');
    if (user && ids.length) {
        ids.forEach(id => id && user.deleteSubscribe(id));
        await userdb.setKV(tgMessage.chatId, user.serialize());
        dmhyTgBot.sendMessage(tgMessage.chatId, 'done!');
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/delsub(.+)/, async (tgMessage) => {
    const user = await userdb.getEntity(tgMessage.chatId);
    const id = tgMessage.matchedText;
    if (user && id) {
        user.deleteSubscribe(id);
        await userdb.setKV(tgMessage.chatId, user.serialize());
        dmhyTgBot.sendMessage(tgMessage.chatId, 'Done!');
    } else {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

dmhyTgBot.addCommand(/\/check$/, async (tgMessage) => {
    const fetchedList = await cache.get();
    const user = await userdb.getEntity(tgMessage.chatId);
    const titles = await checkUserFetchedList(user, fetchedList);
    if (!user || !titles.length) {
        dmhyTgBot.sendMessage(tgMessage.chatId, 'No update!');
        return;
    }
    messagesSplit(titles)
        .forEach(i => dmhyTgBot.sendMessage(tgMessage.chatId, i, {parse_mode: 'Markdown'}));
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
            const titles = await checkUserFetchedList(user, fetchedList);
            if (titles.length) {
                messagesSplit(titles)
                    .forEach(i => dmhyTgBot.sendMessage(user.chatId, i, {parse_mode: 'Markdown'}));
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
