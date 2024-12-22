export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    chatBubble: {
      user: string;
      ai: string;
      userText: string;
      aiText: string;
    };
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    wide: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

export const defaultTheme: Theme = {
  colors: {
    primary: '#2563eb',
    secondary: '#4f46e5',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    chatBubble: {
      user: '#2563eb',
      ai: '#f1f5f9',
      userText: '#ffffff',
      aiText: '#0f172a',
    },
  },
  fonts: {
    primary: "'Inter', system-ui, -apple-system, sans-serif",
    secondary: "'SF Pro Display', system-ui, -apple-system, sans-serif",
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  },
}; 