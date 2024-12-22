import React from 'react';
import { Theme } from '../../styles/theme';
interface ErrorMessageProps {
    error: Error;
    theme: Theme;
    onRetry?: () => void;
}
export declare const ErrorMessage: React.FC<ErrorMessageProps>;
export {};
