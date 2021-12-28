/* eslint-disable import/order */
import { Logger } from 'pino';
import Parser, { Item } from 'rss-parser';
import { URL } from 'url';

import { logger as baseLogger } from 'src/logger';

const parser = new Parser<{ [key: string]: any }, Item>();

export class RssService {
    public rssEndpoint: string;
    public logger: Logger;

    constructor(rssEndpoint: string, loggerName = 'RssService') {
        this.rssEndpoint = rssEndpoint;
        this.logger = baseLogger.child({ source: loggerName });
    }

    static setQuerystring(querystring: Record<string, string>, urlObject: URL): void {
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
