import { Subscribe } from 'src/entities/Subscribe';

export class User {
    public chatId: string;
    public subscribeSet: Record<string, Subscribe>;

    constructor(chatId: string) {
        this.chatId = chatId;
        this.subscribeSet = {};
    }

    addSubscribe(subscribe: Subscribe): User {
        this.subscribeSet[subscribe.id] = subscribe;
        return this;
    }

    deleteSubscribe(subscribeId: string): void {
        delete this.subscribeSet[subscribeId];
    }

    get subscribeList(): Subscribe[] {
        return Object.values(this.subscribeSet);
    }

    serialize(): string {
        return JSON.stringify(this);
    }

    static deserialize(jsonStr: string): User {
        const { chatId, subscribeSet } = JSON.parse(jsonStr);
        const user = new User(chatId);
        Object.values(subscribeSet as Record<string, Subscribe>).forEach((i) => {
            const subscribe = new Subscribe(i.searchName, i.preferredFansub);
            user.addSubscribe(subscribe);
        });
        return user;
    }
}
