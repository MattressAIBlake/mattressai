export declare class ApiError extends Error {
    statusCode?: number | undefined;
    isRetryable: boolean;
    constructor(message: string, statusCode?: number | undefined, isRetryable?: boolean);
}
export declare class OpenAIError extends ApiError {
    constructor(message: string, statusCode?: number);
}
export declare class NetworkError extends ApiError {
    constructor(message?: string);
}
export declare class RateLimitError extends ApiError {
    retryAfter?: number | undefined;
    constructor(message?: string, retryAfter?: number | undefined);
}
export declare const ErrorService: {
    isNetworkError(error: any): boolean;
    isRateLimitError(error: any): boolean;
    getRetryAfter(error: any): number | undefined;
    handleApiError(error: any): ApiError;
    getUserFriendlyMessage(error: Error): string;
};
