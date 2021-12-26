const {URL, URLSearchParams} = require('url');
const log4js = require('log4js');
const util = require('util');
const Parser = require('rss-parser');
const parser = new Parser();
parser.parseURL = util.promisify(parser.parseURL);

class RssService {
    constructor(rssEndpoint, loggerName = 'RssService.js') {
        this.rssEndpoint = rssEndpoint;
        this.logger = log4js.getLogger(loggerName);
    }

    static setQuerystring(querystring, urlObject) {
        for (const key in querystring) {
            urlObject.searchParams.set(key, querystring[key]);
        }
    }

    async fetch(querystring) {
        const url = new URL(this.rssEndpoint);
        RssService.setQuerystring(querystring, url);
        return await parser.parseURL(url.toString());
    }
}

module.exports = RssService;