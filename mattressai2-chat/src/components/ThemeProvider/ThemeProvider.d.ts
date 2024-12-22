import React from 'react';
import { Theme } from '../../styles/theme';
interface MerchantBranding {
    colors?: {
        primary?: string;
        secondary?: string;
        background?: string;
        text?: string;
    };
    fonts?: {
        primary?: string;
        secondary?: string;
    };
    logo?: string;
    name: string;
}
export declare const createMerchantTheme: (branding: MerchantBranding) => Theme;
interface ThemeProviderProps {
    children: React.ReactNode;
    merchantBranding: MerchantBranding;
}
export declare const ThemeProvider: React.FC<ThemeProviderProps>;
export {};
