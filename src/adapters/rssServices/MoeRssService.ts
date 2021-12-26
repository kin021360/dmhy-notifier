import moment from 'moment-timezone';

import { RssService } from 'src/adapters/rssServices/RssService';

interface MoeRssResult {
    items: [
        {
            [key: string]: unknown;
            link: string;
            pubDate: string;
        },
    ];
}

export class MoeRssService extends RssService {
    constructor() {
        super('https://bangumi.moe/rss/latest', 'MoeRssService.js');
    }

    async fetch(querystring: Record<string, string> = {}): Promise<Record<string, any>[]> {
        try {
            const res = (await super.fetchRss(querystring)) as MoeRssResult;
            return res.items.map((item) => ({
                ...item,
                link: [{ source: 'Moe', link: item.link }],
                pubDate: moment.tz(item.pubDate, 'Asia/Hong_Kong').format('DD MMM YYYY HH:mm:ss'),
            }));
        } catch (e) {
            // this.logger.error(e);
            return [];
        }
    }
}
