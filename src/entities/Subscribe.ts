import crypto from 'crypto';

import { isBig5, isMatch } from 'src/utils';

export class Subscribe {
    static fansubList = ['喵萌', '極影', '幻櫻', '豌豆', '千夏', '桜都', '悠哈璃羽', '动漫国', '動漫國', 'DHR'];

    public searchName: string[];
    public preferredFansub: string[];
    public id: string;

    constructor(searchName: string | string[], preferredFansub: string[] = []) {
        if (typeof searchName === 'string') searchName = searchName.split(',');
        this.searchName = searchName.map((s) => s.toLowerCase());
        this.preferredFansub = preferredFansub;
        this.id = crypto.createHash('md5').update(this.searchName.toString()).digest('hex');
    }

    serialize(): string {
        return JSON.stringify(this);
    }

    static deserialize(jsonStr: string): Subscribe {
        const { searchName, preferredFansub } = JSON.parse(jsonStr);
        return new Subscribe(searchName, preferredFansub);
    }

    isSatisfy(title: string): boolean {
        return isMatch(title, this.searchName) && isBig5(title);
    }

    isInPreferredFansub(title: string): boolean {
        return this.preferredFansub.length > 0 && isMatch(title, this.preferredFansub);
    }

    checkSatisfiedItems(items: Record<string, any>[]): Record<string, any>[] {
        const satisfiedItems: Record<string, any>[] = [];
        const satisfiedItemsInPreferredFansub: Record<string, any>[] = [];
        items.forEach((item) => {
            const isSatisfy = this.isSatisfy(item.title);
            if (isSatisfy) {
                if (this.isInPreferredFansub(item.title)) {
                    satisfiedItemsInPreferredFansub.push(item);
                } else {
                    satisfiedItems.push(item);
                }
            }
        });
        return satisfiedItemsInPreferredFansub.length > 0 ? satisfiedItemsInPreferredFansub : satisfiedItems;
    }
}
