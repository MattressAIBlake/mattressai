export interface Theme {
    colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
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
    };
}
export declare const defaultTheme: Theme;
