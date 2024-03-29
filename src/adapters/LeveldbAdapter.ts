import levelttl, { LevelTTL } from 'level-ttl';
import leveldown from 'leveldown';
import levelup from 'levelup';

import { LeveldbResult } from 'src/entities/LeveldbResult';

export interface Kvp {
    key: string;
    value: string;
}

export class LeveldbAdapter<T> {
    private readonly db: LevelTTL;
    private readonly deserializeFn: (x: string) => T;

    constructor(dbPath: string, deserializeFn: (x: string) => T = JSON.parse) {
        this.db = levelttl(levelup(leveldown(dbPath)));
        this.deserializeFn = deserializeFn;
    }

    setKV(key: string | number, value: string, ttl?: number): Promise<void> {
        return this.db.put(String(key), value, { ttl });
    }

    remove(key: string | number): Promise<void> {
        return this.db.del(String(key));
    }

    getV(key: string | number): Promise<LeveldbResult<string>> {
        return this.db
            .get(key.toString())
            .then((v) => ({ isExisted: true, record: String(v) }))
            .catch(() => ({ isExisted: false }));
    }

    async getEntity(key: string | number): Promise<LeveldbResult<T>> {
        const { isExisted, record } = await this.getV(key);
        if (isExisted && record) {
            return {
                isExisted,
                record: this.deserializeFn(record),
            };
        }
        return { isExisted };
    }

    scanKV(limit = -1): Promise<Kvp[]> {
        return new Promise((resolve, reject) => {
            const allKeyValue = [] as Kvp[];
            const readStream = this.db.createReadStream({ limit });
            readStream
                .on('data', (data) => allKeyValue.push({ key: String(data.key), value: String(data.value) }))
                .on('error', reject)
                .on('end', () => resolve(allKeyValue))
                .on('close', () => {
                    readStream.removeAllListeners('data');
                    readStream.removeAllListeners('error');
                    readStream.removeAllListeners('end');
                    readStream.removeAllListeners('close');
                });
        });
    }
}
