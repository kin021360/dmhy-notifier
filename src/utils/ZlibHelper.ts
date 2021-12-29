import zlib from 'zlib';

export const ZlibHelper = {
    zip: (input: string | Buffer): string => {
        const dataBuff = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
        const outBuffer = zlib.deflateSync(dataBuff, { level: 9 });
        return outBuffer.toString('base64');
    },

    unzip: (input: string | Buffer, isOutputUtf8 = true): string | Buffer => {
        const dataBuff = typeof input === 'string' ? Buffer.from(input, 'base64') : input;
        const outBuffer = zlib.unzipSync(dataBuff);
        return isOutputUtf8 ? outBuffer.toString('utf8') : outBuffer;
    },

    uint8ArrayToBase64: (uint8Arr: Uint8Array): string => Buffer.from(uint8Arr).toString('base64'),

    base64ToUint8Array: (base64Str: string): Uint8Array => new Uint8Array(Buffer.from(base64Str, 'base64').buffer),
};
