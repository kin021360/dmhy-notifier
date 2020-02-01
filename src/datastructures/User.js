const {Subscribe} = require('./Subscribe');

class User {
    constructor(chatId) {
        this.chatId = chatId;
        this.subscribeSet = {};
    }

    addSubscribe(subscribe) {
        this.subscribeSet[subscribe.id] = subscribe;
        return this;
    }

    deleteSubscribe(subscribeId) {
        delete this.subscribeSet[subscribeId];
    }

    get subscribeList() {
        return Object.values(this.subscribeSet);
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(jsonStr) {
        let {chatId, subscribeSet} = JSON.parse(jsonStr);
        const user = new User(chatId);
        Object.values(subscribeSet).forEach((i) => {
            const subscribe = new Subscribe(i.searchName, i.preferredFansub);
            user.addSubscribe(subscribe);
        });
        return user;
    }
}

module.exports = User;