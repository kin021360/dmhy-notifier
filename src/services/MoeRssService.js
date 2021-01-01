const moment = require('moment-timezone');
const RssService = require('./RssService');

class MoeRssService extends RssService {
    constructor() {
        super('https://bangumi.moe/rss/latest', 'MoeRssService.js');
    }

    async fetch(querystring) {
        try {
            const res = await super.fetch(querystring);
            res.items.map((item) => {
                item.link = [{source: 'Moe', link: item.link}];
                item.pubDate = moment(item.pubDate, 'Asia/Hong_Kong').format('DD MMM YYYY HH:mm:ss');
            });
            return res.items;
        } catch (e) {
            this.logger.error(e);
            return [];
        }
    }
}

module.exports = MoeRssService;