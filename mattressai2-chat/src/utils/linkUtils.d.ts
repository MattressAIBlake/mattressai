export declare const LinkUtils: {
    isValidDomain(url: string): boolean;
    sanitizeUrl(url: string): string | null;
    findLinks(text: string): Array<{
        url: string;
        start: number;
        end: number;
    }>;
    processMessageWithLinks(text: string): Array<{
        type: "text" | "link";
        content: string;
    }>;
};
