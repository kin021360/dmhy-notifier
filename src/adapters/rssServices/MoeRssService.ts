import moment from 'moment-timezone';

import { RssService } from 'src/adapters/rssServices/RssService';
import { RssResultItem } from 'src/entities/RssResultItem';

export class MoeRssService extends RssService {
    constructor() {
        super('https://bangumi.moe/rss/latest', 'MoeRssService.js');
    }

    async fetch(querystring: Record<string, string> = {}): Promise<RssResultItem[]> {
        try {
            const res = await super.fetchRss(querystring);
            return res.items.map((item) => ({
                ...item,
                downloadLinks: [{ source: 'Moe', link: item.link || '' }],
                pubDate: moment.tz(item.isoDate, 'Asia/Hong_Kong').format('DD MMM YYYY HH:mm:ss'),
                title: item.title!,
                isoDate: item.isoDate!,
            }));
        } catch (e) {
            this.logger.error(e);
            return [];
        }
    }
}
