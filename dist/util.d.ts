export declare function getUuid(): string;
export declare class StatusError extends Error {
    code: number;
    constructor(message: string, statusCode: number);
}
