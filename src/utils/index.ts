import crypto from 'crypto';

export { Cache } from 'src/utils/Cache';
export { ZlibHelper } from 'src/utils/ZlibHelper';

export const isMatch = (testStr: string, conditions: string[]): boolean => {
    const str = testStr.toLowerCase();
    for (const condition of conditions) {
        if (str.indexOf(condition) !== -1) return true;
    }
    return false;
};

export const isBig5 = (title: string): boolean => {
    const conditions = ['big5', 'cht', '繁體', '繁体', '简繁', '繁简', '繁日', '日繁', '繁中'];
    return isMatch(title, conditions);
};

export const isToday = (oldDate: string, offsetCheckBack = 3): boolean => {
    const now8 = new Date();
    const old8 = new Date(oldDate);
    now8.setUTCHours(now8.getUTCHours() + 8);
    old8.setUTCHours(old8.getUTCHours() + 8);
    if (now8.getUTCDate() === old8.getUTCDate()) {
        return true;
    }
    now8.setUTCHours(now8.getUTCHours() - offsetCheckBack);
    return old8 > now8;
};

export const genMD5 = (str: string): string => {
    return crypto.createHash('md5').update(str).digest('hex');
};

export const escapeForTgMarkdown = (str: string): string =>
    str.replace(/_/g, '\\_').replace(/\*/g, '\\*').replace(/\[/g, '\\[').replace(/`/g, '\\`');

export const reduceMagnetQuerystring = (magnet: string, maxQuerystring = 22): string => {
    const splited = magnet.split('&');
    if (splited.length > maxQuerystring) {
        return splited.slice(0, maxQuerystring).join('&');
    }
    return magnet;
};

export const messagesSplit = (messageList: string[], eachMsgItems = 15): string[] =>
    messageList.reduce((current, item, index) => {
        const msgIndex = Math.floor(index / eachMsgItems);
        let msg = current[msgIndex] || '';
        msg += item;
        current[msgIndex] = msg;
        return current;
    }, [] as string[]);

export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
