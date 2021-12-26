import { RssService } from 'src/adapters/rssServices/RssService';

interface DmhyRssResult {
    items: [
        {
            [key: string]: unknown;
            link: string;
            pubDate: string;
            enclosure: {
                url: string;
            };
        },
    ];
}

export class DmhyRssService extends RssService {
    constructor() {
        super('https://share.dmhy.org/topics/rss/rss.xml', 'DmhyRssService');
    }

    async fetch(querystring: Record<string, string> = {}): Promise<Record<string, any>[]> {
        try {
            const res = (await super.fetchRss(querystring)) as DmhyRssResult;
            return res.items.map((item) => ({
                ...item,
                link: [{ source: 'Dmhy', link: item.link.replace('http', 'https'), magnet: item.enclosure.url }],
                pubDate: item.pubDate.substring(5, 25),
            }));
        } catch (e) {
            // this.logger.error(e);
            return [];
        }
    }
}
