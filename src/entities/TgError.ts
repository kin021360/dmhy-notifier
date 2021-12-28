interface NodeTgBotErrorResponse {
    body?: {
        error_code?: number;
        description?: string;
    };
    statusCode?: number;
}

interface NodeTgBotError extends Error {
    code?: string;
    response?: NodeTgBotErrorResponse;
}

export default class TgError extends Error implements NodeTgBotError {
    public readonly code?: string;
    public readonly response?: NodeTgBotErrorResponse;
    public readonly chatId: number;

    constructor(err: NodeTgBotError, chatId = -1) {
        super(err.message);
        this.chatId = chatId;
        this.code = err.code;
        this.response = err.response;
        // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        // Object.setPrototypeOf(this, TgError.prototype);
    }

    isBlockedByUser(): boolean {
        return (
            this.code === 'ETELEGRAM' &&
            this.response?.body?.error_code === 403 &&
            this.response?.body?.description?.indexOf('bot was blocked by the user') !== -1
        );
    }
}
