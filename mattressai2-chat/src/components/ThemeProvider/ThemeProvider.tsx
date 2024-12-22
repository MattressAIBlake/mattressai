import React, { ReactElement } from 'react';
import { Theme, defaultTheme } from '../../styles/theme';

export interface MerchantBranding {
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

interface ThemeProviderProps {
  children: ReactElement;
  merchantBranding: MerchantBranding;
}

interface ThemedChildProps {
  theme: Theme;
  merchantConfig: MerchantBranding;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  merchantBranding,
}) => {
  const theme = {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: merchantBranding.colors?.primary ?? defaultTheme.colors.primary,
      secondary: merchantBranding.colors?.secondary ?? defaultTheme.colors.secondary,
      background: merchantBranding.colors?.background ?? defaultTheme.colors.background,
      text: merchantBranding.colors?.text ?? defaultTheme.colors.text,
    },
    fonts: {
      primary: merchantBranding.fonts?.primary ?? defaultTheme.fonts.primary,
      secondary: merchantBranding.fonts?.secondary ?? defaultTheme.fonts.secondary,
    },
  };
  
  return (
    <>
      <style>
        {`
          :root {
            --primary: ${theme.colors.primary};
            --primary-hover: ${theme.colors.secondary};
            --background: ${theme.colors.background};
            --foreground: ${theme.colors.text};
            --font-primary: ${theme.fonts.primary};
            --font-secondary: ${theme.fonts.secondary};
            
            /* Gray scale */
            --gray-100: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e1;
            --gray-400: #94a3b8;
            --gray-500: #64748b;
            
            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            
            /* Border radius */
            --border-radius: 12px;
            --max-width: 1100px;
          }
        `}
      </style>
      {React.Children.map(children, child => {
        if (React.isValidElement<ThemedChildProps>(child)) {
          return React.cloneElement<ThemedChildProps>(child, {
            theme,
            merchantConfig: merchantBranding,
          });
        }
        return child;
      })}
    </>
  );
} 