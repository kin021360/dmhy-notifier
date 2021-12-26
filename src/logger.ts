import pino from 'pino';
import pinoms from 'pino-multi-stream';

import { esLogEndpoint, esLogIndex } from 'src/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ecsFormat = require('@elastic/ecs-pino-format')();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pinoElastic = require('pino-elasticsearch');

const prettyStream = pinoms.prettyStream({
    prettyPrint: {
        colorize: true,
        translateTime: true,
        hideObject: true,
        messageKey: 'message',
        messageFormat: (log, messageKey) => {
            const pureObject = {
                ...log,
                application: undefined,
                level: undefined,
                time: undefined,
                message: undefined,
                ecs: undefined,
                process: undefined,
                host: undefined,
            };
            const pureObjectStr = JSON.stringify(pureObject);
            return `${log[messageKey]}${pureObjectStr !== '{}' ? '\n' + pureObjectStr : ''}`;
        },
    },
});

const logStreams: pinoms.Streams = [{ level: 'debug', stream: prettyStream }];

if (esLogEndpoint && esLogIndex) {
    const streamToElastic = pinoElastic({
        index: esLogIndex,
        consistency: 'one',
        node: esLogEndpoint,
        'es-version': 7,
        // 'flush-bytes': 1000,
        'flush-interval': 10000,
    });
    logStreams.push({ level: 'info', stream: streamToElastic });
}

const baseLogger = pino(
    {
        // prettyPrint: {
        //     colorize: true,
        //     translateTime: true
        // },
        // formatters:{
        //     level(label, number) {
        //         return {
        //             level: label,
        //         }
        //     }
        // }
        level: 'debug',
        ...ecsFormat,
    },
    pinoms.multistream(logStreams),
);

export const logger = baseLogger.child({ application: 'dmhy-notifier' });
