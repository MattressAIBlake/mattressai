export class ApiError extends Error {
    constructor(message, statusCode, isRetryable = false) {
        super(message);
        Object.defineProperty(this, "statusCode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: statusCode
        });
        Object.defineProperty(this, "isRetryable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isRetryable
        });
        this.name = 'ApiError';
    }
}
export class OpenAIError extends ApiError {
    constructor(message, statusCode) {
        super(message, statusCode);
        this.name = 'OpenAIError';
        // Most OpenAI errors are retryable except for invalid requests
        this.isRetryable = statusCode ? statusCode !== 400 : true;
    }
}
export class NetworkError extends ApiError {
    constructor(message = 'Network connection error') {
        super(message);
        this.name = 'NetworkError';
        this.isRetryable = true;
    }
}
export class RateLimitError extends ApiError {
    constructor(message = 'Rate limit exceeded. Please try again in a moment.', retryAfter) {
        super(message, 429, true);
        Object.defineProperty(this, "retryAfter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: retryAfter
        });
        this.name = 'RateLimitError';
    }
}
export const ErrorService = {
    isNetworkError(error) {
        return !error.response && !error.request;
    },
    isRateLimitError(error) {
        return error.response?.status === 429;
    },
    getRetryAfter(error) {
        return error.response?.headers?.['retry-after']
            ? parseInt(error.response.headers['retry-after'], 10) * 1000
            : undefined;
    },
    handleApiError(error) {
        if (this.isNetworkError(error)) {
            return new NetworkError();
        }
        if (this.isRateLimitError(error)) {
            return new RateLimitError('Rate limit exceeded. Please try again in a moment.', this.getRetryAfter(error));
        }
        if (error.response?.status === 401) {
            return new ApiError('Authentication failed. Please check your API keys.', 401, false);
        }
        if (error.response?.status === 400) {
            return new ApiError('Invalid request. Please check your input.', 400, false);
        }
        return new ApiError(error.response?.data?.message || 'An unexpected error occurred', error.response?.status, true);
    },
    getUserFriendlyMessage(error) {
        if (error instanceof RateLimitError) {
            const waitTime = error.retryAfter
                ? `Please try again in ${Math.ceil(error.retryAfter / 1000)} seconds.`
                : 'Please try again in a moment.';
            return `We're experiencing high demand. ${waitTime}`;
        }
        if (error instanceof NetworkError) {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        }
        if (error instanceof OpenAIError) {
            return 'The AI service is temporarily unavailable. Please try again in a moment.';
        }
        return 'An unexpected error occurred. Please try again.';
    },
};
