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
            this.db.createReadStream({limit})
                .on('data', (data) => {
                    allKeyValue.push({key: data.key.toString(), value: data.value.toString()});
                })
                .on('error', reject)
                // .on('close', () => {
                //     console.log('Stream closed')
                // })
                .on('end', () => resolve(allKeyValue));
        });
    }
}

module.exports = LeveldbAdapter;