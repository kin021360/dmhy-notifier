import { Item } from 'rss-parser';

export interface RssResultItem extends Item {
    title: string;
    downloadLinks: [{ source: 'Moe' | 'Dmhy'; link: string; magnet?: string }];
    pubDate: string;
    isoDate: string;
}
