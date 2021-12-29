import moment from 'moment-timezone';

import { RssService } from 'src/adapters/rssServices/RssService';
import { RssResultItem } from 'src/entities/RssResultItem';

export class DmhyRssService extends RssService {
    constructor() {
        super('https://share.dmhy.org/topics/rss/rss.xml', 'DmhyRssService');
    }

    async fetch(querystring: Record<string, string> = {}): Promise<RssResultItem[]> {
        try {
            const res = await super.fetchRss(querystring);
            return res.items.map((item) => ({
                ...item,
                downloadLinks: [
                    {
                        source: 'Dmhy',
                        link: item.link?.replace('http', 'https') || '',
                        magnet: item.enclosure?.url,
                    },
                ],
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
