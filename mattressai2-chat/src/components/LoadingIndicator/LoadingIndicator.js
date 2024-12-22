import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LoadingContainer, Dot, LoadingText } from './styles';
export const LoadingIndicator = ({ theme, text = 'AI is thinking...', }) => {
    return (_jsxs(LoadingContainer, { theme: theme, children: [_jsx(Dot, { theme: theme, delay: 0 }), _jsx(Dot, { theme: theme, delay: 0.2 }), _jsx(Dot, { theme: theme, delay: 0.4 }), _jsx(LoadingText, { theme: theme, children: text })] }));
};
