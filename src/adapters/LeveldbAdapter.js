const levelup = require('levelup');
const leveldown = require('leveldown');
const levelttl = require('level-ttl');

class LeveldbAdapter {
    constructor(dbPath) {
        this.db = levelttl(levelup(leveldown(dbPath)));
    }

    setKV(key, value, ttl) {
        return this.db.put(key.toString(), value, {ttl});
    }

    getV(key) {
        return this.db.get(key.toString()).then(v => v.toString()).catch(() => null);
    }

    scanKV(limit = -1) {
        return new Promise((resolve, reject) => {
            const allKeyValue = [];
            const readStream = this.db.createReadStream({limit});
            readStream.on('data', data => allKeyValue.push({key: data.key.toString(), value: data.value.toString()}))
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

    async scanKV2(limit = -1) {
        const allKeyValue = [];
        const iterator = this.db.iterator({limit});
        const iteratorNext = () => new Promise((resolve, reject) => {
            iterator.next((error, key, value) => {
                if (error) return reject(error);
                if (key === undefined && value === undefined) return resolve(null);
                resolve({key: key.toString(), value: value.toString()});
            });
        });

        try {
            let kv = await iteratorNext();
            while (kv) {
                allKeyValue.push(kv);
                kv = await iteratorNext();
            }
            return allKeyValue;
        } catch (e) {
            throw e;
        } finally {
            iterator.end(() => {});
        }
    }
}

module.exports = LeveldbAdapter;