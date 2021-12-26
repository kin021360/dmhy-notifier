import path from 'path';

export const tgBotToken = '' || process.env.tgBotToken; // Telegram bot API token
export const cachedbPath = path.resolve(__dirname, './leveldb/cachedb');
export const userdbPath = path.resolve(__dirname, './leveldb/userdb');
export const magnetHelperLink = '' || process.env.magnetHelperLink;

export const esLogEndpoint = process.env.esLogEndpoint || '';
export const esLogIndex = process.env.esLogIndex || '';
