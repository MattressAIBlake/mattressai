import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ApiError, RateLimitError, ErrorService } from '../../services/error.service';
import { ErrorContainer, RetryButton } from './styles';
export const ErrorMessage = ({ error, theme, onRetry, }) => {
    const [retryCountdown, setRetryCountdown] = useState(0);
    const message = ErrorService.getUserFriendlyMessage(error);
    const isRetryable = error instanceof ApiError && error.isRetryable;
    useEffect(() => {
        if (error instanceof RateLimitError && error.retryAfter) {
            setRetryCountdown(Math.ceil(error.retryAfter / 1000));
            const interval = setInterval(() => {
                setRetryCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [error]);
    return (_jsxs(ErrorContainer, { theme: theme, children: [_jsx("span", { children: message }), isRetryable && onRetry && (_jsx(RetryButton, { theme: theme, onClick: onRetry, disabled: retryCountdown > 0, children: retryCountdown > 0
                    ? `Retry in ${retryCountdown}s`
                    : 'Retry' }))] }));
};
