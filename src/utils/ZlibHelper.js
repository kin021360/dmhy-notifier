const zlib = require('zlib');

class ZlibHelper {
    static zip(input, isOutputBase64 = true) {
        const dataBuff = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
        const outBuffer = zlib.deflateSync(dataBuff, {level: 9});
        return isOutputBase64 ? outBuffer.toString('base64') : outBuffer;
    }

    static unzip(input, isOutputUtf8 = true) {
        const dataBuff = typeof input === 'string' ? Buffer.from(input, 'base64') : input;
        const outBuffer = zlib.unzipSync(dataBuff);
        return isOutputUtf8 ? outBuffer.toString('utf8') : outBuffer;
    }

    static uint8ArrayToBase64(uint8Arr) {
        return Buffer.from(uint8Arr).toString('base64');
    }

    static base64ToUint8Array(base64Str) {
        return new Uint8Array(Buffer.from(base64Str, 'base64').buffer);
    }
}

module.exports = ZlibHelper;
