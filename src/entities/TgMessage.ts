export interface TgMessage {
    chatId: number;
    date: number;
    rawText?: string;
    matchedText: string;
    matchedTexts: string[];
}
