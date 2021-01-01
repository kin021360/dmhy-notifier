const RssService = require('./RssService');

class DmhyRssService extends RssService {
    constructor() {
        super('https://share.dmhy.org/topics/rss/rss.xml', 'DmhyRssService.js');
    }

    async fetch(querystring) {
        try {
            const res = await super.fetch(querystring);
            res.items.map((item) => {
                item.link = [{source: 'Dmhy', link: item.link.replace('http', 'https'), magnet: item.enclosure.url}];
                item.pubDate = item.pubDate.substring(5, 25);
            });
            return res.items;
        } catch (e) {
            this.logger.error(e);
            return [];
        }
    }
}

module.exports = DmhyRssService;