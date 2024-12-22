import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { defaultTheme } from '../../styles/theme';
export const createMerchantTheme = (branding) => {
    return {
        ...defaultTheme,
        colors: {
            ...defaultTheme.colors,
            primary: branding.colors?.primary ?? defaultTheme.colors.primary,
            secondary: branding.colors?.secondary ?? defaultTheme.colors.secondary,
            background: branding.colors?.background ?? defaultTheme.colors.background,
            text: branding.colors?.text ?? defaultTheme.colors.text,
            chatBubble: {
                ...defaultTheme.colors.chatBubble,
                user: branding.colors?.primary ?? defaultTheme.colors.chatBubble.user,
            },
        },
        fonts: {
            primary: branding.fonts?.primary ?? defaultTheme.fonts.primary,
            secondary: branding.fonts?.secondary ?? defaultTheme.fonts.secondary,
        },
    };
};
export const ThemeProvider = ({ children, merchantBranding, }) => {
    const theme = createMerchantTheme(merchantBranding);
    return (_jsxs("div", { children: [_jsx("style", { children: `
          :root {
            --primary-color: ${theme.colors.primary};
            --secondary-color: ${theme.colors.secondary};
            --background-color: ${theme.colors.background};
            --text-color: ${theme.colors.text};
            --primary-font: ${theme.fonts.primary};
            --secondary-font: ${theme.fonts.secondary};
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: var(--primary-font);
            color: var(--text-color);
            background-color: var(--background-color);
          }
        ` }), React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { theme, merchantConfig: merchantBranding });
                }
                return child;
            })] }));
};
