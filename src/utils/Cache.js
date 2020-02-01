const log4js = require('log4js');
const logger = log4js.getLogger('Cache.js');

module.exports = function (func, cacheTime) {
    if (typeof func !== "function" || isNaN(Number(cacheTime))) {
        throw new Error("Invalid construct values!");
    }

    const updateFunc = func;
    const ttl = cacheTime;
    let lastUpdateTime = null;
    let cacheObject = null;
    let lockedTime = null;
    let isLocked = false;

    function updateExecutor() {
        return new Promise((resolve, reject) => {
            const resType = updateFunc((data, err) => {
                if (resType instanceof Promise) return;
                if (err) return reject(err);
                resolve(data);
            });
            if (resType instanceof Promise) resType.then(resolve).catch(reject);
        });
    }

    function timer(expire) {
        const time = expire || 1000;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('timeout');
            }, time);
        });
    }

    function lock() {
        if (isLocked) return false;
        isLocked = true;
        lockedTime = new Date();
        return true;
    }

    function release() {
        isLocked = false;
    }

    async function updateIfExpire() {
        const startTime = new Date();
        if (!(!lastUpdateTime || startTime - lastUpdateTime > ttl)) return;
        if (!lock()) return;
        try {
            logger.info('Locked!');
            const timeout = timer(20000);
            const executor = updateExecutor(startTime);
            const result = await Promise.race([timeout, executor]);
            if (result !== 'timeout') {
                lastUpdateTime = new Date();
                cacheObject = result;
            }
        } finally {
            logger.info('Released!');
            release();
        }
    }

    this.get = async () => {
        await updateIfExpire();
        return cacheObject;
    }
};
