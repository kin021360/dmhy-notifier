import Parser from 'rss-parser';
import { URL } from 'url';
import util from 'util';

// const log4js = require('log4js');

const parser = new Parser();
parser.parseURL = util.promisify(parser.parseURL);

export class RssService {
    public rssEndpoint: string;

    constructor(rssEndpoint: string, loggerName = 'RssService') {
        this.rssEndpoint = rssEndpoint;
        // this.logger = log4js.getLogger(loggerName);
    }

    static setQuerystring(querystring: Record<string, string>, urlObject: URL) {
        for (const key in querystring) {
            urlObject.searchParams.set(key, querystring[key]);
        }
    }

    async fetchRss(querystring: Record<string, string>) {
        const url = new URL(this.rssEndpoint);
        RssService.setQuerystring(querystring, url);
        return await parser.parseURL(url.toString());
    }
}
