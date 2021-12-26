const crypto = require('crypto');
const {isMatch, isBig5} = require('../utils/util');

class Subscribe {
    static fansubList = ['喵萌', '極影', '幻櫻', '豌豆', '千夏', '桜都', '悠哈璃羽', '动漫国', '動漫國', 'DHR'];

    constructor(searchName, preferredFansub = []) {
        if (typeof searchName === 'string') searchName = searchName.split(',');
        this.searchName = searchName.map(s => s.toLowerCase());
        this.preferredFansub = preferredFansub;
        this.id = crypto.createHash('md5').update(this.searchName.toString()).digest('hex');
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(jsonStr) {
        const {searchName, preferredFansub} = JSON.parse(jsonStr);
        return new Subscribe(searchName, preferredFansub);
    }

    isSatisfy(title) {
        return isMatch(title, this.searchName) && isBig5(title);
    }

    isInPreferredFansub(title) {
        return this.preferredFansub.length > 0 && isMatch(title, this.preferredFansub);
    }

    checkSatisfiedItems(items) {
        const satisfiedItems = [];
        const satisfiedItemsInPreferredFansub = [];
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

module.exports = Subscribe;
