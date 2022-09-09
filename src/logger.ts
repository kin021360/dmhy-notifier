import pino from 'pino';
import pretty from 'pino-pretty';

import { esLogEndpoint, esLogIndex } from 'src/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ecsFormat = require('@elastic/ecs-pino-format')();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pinoElastic = require('pino-elasticsearch');

const prettyStream = pretty({
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
        return `${log[messageKey]}:${pureObjectStr !== '{}' ? '\n' + pureObjectStr : ''}`;
    },
});

const logStreams: pino.StreamEntry[] = [{ level: 'debug', stream: prettyStream }];

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
    pino.multistream(logStreams),
);

export const logger = baseLogger.child({ application: 'dmhy-notifier' });
