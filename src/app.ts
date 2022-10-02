import { LeveldbAdapter } from 'src/adapters/LeveldbAdapter';
import { TgBot } from 'src/adapters/TgBot';
import { DmhyRssService, MoeRssService } from 'src/adapters/rssServices';
import { cachedbPath, magnetHelperLink, tgBotToken, userdbPath, version } from 'src/config';
import { Subscribe, User } from 'src/entities';
import { RssResultItem } from 'src/entities/RssResultItem';
import { logger as baseLogger } from 'src/logger';
import {
    Cache,
    ZlibHelper,
    escapeForTgMarkdown,
    genMD5,
    isToday,
    messagesSplit,
    reduceMagnetQuerystring,
} from 'src/utils';

const logger = baseLogger.child({ source: 'app' });
const tgBot = new TgBot(tgBotToken);

const cachedb = new LeveldbAdapter(cachedbPath);
const userdb = new LeveldbAdapter<User>(userdbPath, User.deserialize);

const dmhyRssService = new DmhyRssService();
const moeRssService = new MoeRssService();

const fetchAllServices = async (): Promise<RssResultItem[]> => {
    try {
        const [feed1, feed2] = await Promise.all([moeRssService.fetch({ limit: '100' }), dmhyRssService.fetch()]);
        const allItems = feed1.reduce((current, item) => {
            const find = current.find((i) => i.title === item.title);
            if (find) {
                find.downloadLinks.push(item.downloadLinks[0]);
            } else {
                current.push(item);
            }
            return current;
        }, feed2);
        const list = allItems.filter((i) => isToday(i.isoDate));
        logger.info('Fetched & today items: ' + list.length);
        return list;
    } catch (e) {
        logger.error(e);
        return [];
    }
};

const cache = new Cache(fetchAllServices, 900000);

const checkUserFetchedList = async (user: User, fetchedList: RssResultItem[]) => {
    const titles: string[] = [];
    for (const subscribe of user.subscribeList) {
        const satisfiedItems = subscribe.checkSatisfiedItems(fetchedList);
        for (const satisfiedItem of satisfiedItems) {
            const cacheKey = user.chatId.toString() + genMD5(satisfiedItem.title);
            const { isExisted } = await cachedb.getV(cacheKey);
            if (!isExisted) {
                let title = '';
                title += `${escapeForTgMarkdown(satisfiedItem.title)} - *${satisfiedItem.pubDate}*\n`;
                title += satisfiedItem.downloadLinks
                    .map((i) => {
                        let str = `*${i.source}:*\n- ${escapeForTgMarkdown(i.link)}`;
                        if (magnetHelperLink && i.magnet) {
                            const shorterMagnet = reduceMagnetQuerystring(i.magnet);
                            str += `\n- [Magnet link](${magnetHelperLink}#${encodeURIComponent(
                                ZlibHelper.zip(shorterMagnet.replace('magnet:?', '')),
                            )})`;
                        }
                        return str;
                    })
                    .join('\n');
                title += '\n';
                titles.push(title);
                await cachedb.setKV(cacheKey, 'true', 86400000);
            }
        }
    }
    return titles;
};

tgBot.addCommand(/\/subs ([^;]+)(?:;([^;]+)?)?/, async (tgMessage) => {
    let { record: user } = await userdb.getEntity(tgMessage.chatId);
    const preferredFansub =
        tgMessage.matchedTexts.length > 2 && tgMessage.matchedTexts[2] === '@'
            ? Subscribe.fansubList
            : tgMessage.matchedTexts[2]?.split(',');
    if (user) {
        user.addSubscribe(new Subscribe(tgMessage.matchedText, preferredFansub));
    } else {
        user = new User(tgMessage.chatId).addSubscribe(new Subscribe(tgMessage.matchedText, preferredFansub));
    }
    await userdb.setKV(tgMessage.chatId, user.serialize());
    tgBot.sendMessage(tgMessage.chatId, 'Done!');
});

tgBot.addCommand(/\/listsubs$/, async (tgMessage) => {
    const { record } = await userdb.getV(tgMessage.chatId);
    if (record) {
        tgBot.sendMessage(tgMessage.chatId, record);
    } else {
        tgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

tgBot.addCommand(/\/list\s*(\d+)?$/, async (tgMessage) => {
    const requestedPage = parseInt(tgMessage.matchedText, 10);
    const { record: user } = await userdb.getEntity(tgMessage.chatId);

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

        const pages = messagesSplit(list);

        if (requestedPage > 0 && pages.length > 0) {
            const targetPage = requestedPage <= pages.length ? requestedPage : pages.length;
            await tgBot.sendMessage(tgMessage.chatId, pages[targetPage - 1]);
            return;
        }

        for (const i of pages) {
            await tgBot.sendMessage(tgMessage.chatId, i);
        }

        await tgBot.sendMessage(tgMessage.chatId, `Total items: ${list.length}`);
    } else {
        tgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

tgBot.addCommand(/\/delsubs (.+)/, async (tgMessage) => {
    const { record: user } = await userdb.getEntity(tgMessage.chatId);
    const ids = tgMessage.matchedText.split(',');
    if (user && ids.length) {
        ids.forEach((id) => id && user.deleteSubscribe(id));
        await userdb.setKV(tgMessage.chatId, user.serialize());
        tgBot.sendMessage(tgMessage.chatId, 'done!');
    } else {
        tgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

tgBot.addCommand(/\/delsub(.+)/, async (tgMessage) => {
    const { record: user } = await userdb.getEntity(tgMessage.chatId);
    const id = tgMessage.matchedText;
    if (user && id) {
        user.deleteSubscribe(id);
        await userdb.setKV(tgMessage.chatId, user.serialize());
        tgBot.sendMessage(tgMessage.chatId, 'Done!');
    } else {
        tgBot.sendMessage(tgMessage.chatId, 'No record!');
    }
});

tgBot.addCommand(/\/check$/, async (tgMessage) => {
    const fetchedList = await cache.get([]);
    const { record: user } = await userdb.getEntity(tgMessage.chatId);
    if (user) {
        const titles = await checkUserFetchedList(user, fetchedList);
        if (titles.length) {
            messagesSplit(titles).forEach((i) => tgBot.sendMessage(tgMessage.chatId, i, { parse_mode: 'Markdown' }));
            return;
        }
    }
    tgBot.sendMessage(tgMessage.chatId, 'No update!');
});

tgBot.addCommand(/\/version$/, async (tgMessage) => {
    tgBot.sendMessage(tgMessage.chatId, version);
});

tgBot.addCommand(/.+/, async (tgMessage) => {
    const msg = `
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
    tgBot.sendMessage(tgMessage.chatId, msg);
});

// Setup schedule to check new updates for every 2 hours
setInterval(async () => {
    try {
        logger.info('Schedule triggered');
        const fetchedList = await cache.get([]);
        const recordSet = await userdb.scanKV();

        for (const record of recordSet) {
            const user = User.deserialize(record.value);
            const titles = await checkUserFetchedList(user, fetchedList);
            if (titles.length) {
                messagesSplit(titles).forEach((i) => tgBot.sendMessage(user.chatId, i, { parse_mode: 'Markdown' }));
            }
        }
        const nextTime = new Date();
        nextTime.setTime(nextTime.getTime() + 7200000);
        logger.info('Next schedule at ' + nextTime.toString());
    } catch (e) {
        logger.error(e);
    }
}, 7200000);
