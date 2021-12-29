import { logger as baseLogger } from 'src/logger';

const logger = baseLogger.child({ source: 'Cache' });

export class Cache<T> {
    private readonly updateFunc: (() => Promise<T>) | ((callback: (data: T, err?: Error) => void) => void);
    private readonly ttl: number;
    private readonly executorTimeoutMs: number;

    private lastUpdateTime: Date | undefined;
    private cacheObject: T | undefined;
    private lockedTime: Date | undefined;
    private isLocked = false;

    constructor(
        updateFunc: (() => Promise<T>) | ((callback: (data: T, err?: Error) => void) => void),
        ttl: number,
        executorTimeoutMs = 70000,
    ) {
        this.updateFunc = updateFunc;
        this.ttl = ttl;
        this.executorTimeoutMs = executorTimeoutMs;
    }

    private updateExecutor(): Promise<T> {
        return new Promise((resolve, reject) => {
            const resType = this.updateFunc((data, err) => {
                if (resType instanceof Promise) return;
                if (err) return reject(err);
                resolve(data);
            });
            if (resType instanceof Promise) resType.then(resolve).catch(reject);
        });
    }

    private timer(expire = 1000): Promise<'timeout'> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('timeout');
            }, expire);
        });
    }

    private lock() {
        if (this.isLocked) return false;
        this.isLocked = true;
        this.lockedTime = new Date();
        return true;
    }

    private release() {
        this.isLocked = false;
    }

    private async updateIfExpire() {
        const nowTime = new Date().getTime();
        if (this.lastUpdateTime && nowTime - this.lastUpdateTime.getTime() < this.ttl) return;
        if (!this.lock()) return;
        try {
            logger.info('Locked!');
            const timeout = this.timer(this.executorTimeoutMs);
            const executor = this.updateExecutor();
            const result = await Promise.race([timeout, executor]);
            if (result !== 'timeout') {
                this.lastUpdateTime = new Date();
                this.cacheObject = result;
            }
        } finally {
            logger.info('Released!');
            this.release();
        }
    }

    async get(): Promise<T | undefined>;
    async get(defaultValue: T): Promise<T>;
    async get(defaultValue?: T): Promise<T | undefined> {
        await this.updateIfExpire();
        return this.cacheObject || defaultValue;
    }
}
