const RssService = require('./RssService');

class MoeRssService extends RssService {
    constructor() {
        super('https://bangumi.moe/rss/latest', 'MoeRssService.js');
    }

    async fetch(querystring) {
        try {
            const res = await super.fetch(querystring);
            res.items.map((item) => {
                item.link = [{source: 'moe', link: item.link}];
                item.pubDate = new Date(item.pubDate).toString();
            });
            return res.items;
        }catch (e) {
            this.logger.error(e);
            return [];
        }
    }
}

module.exports = MoeRssService;