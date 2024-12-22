const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
// Allowed domains for links
const ALLOWED_DOMAINS = [
    'mattressai.com',
    'trustpilot.com',
    'google.com',
    'maps.google.com',
    // Add more trusted domains as needed
];
export const LinkUtils = {
    isValidDomain(url) {
        try {
            const domain = new URL(url).hostname.toLowerCase();
            return ALLOWED_DOMAINS.some(allowed => domain.endsWith(allowed));
        }
        catch {
            return false;
        }
    },
    sanitizeUrl(url) {
        try {
            const sanitized = new URL(url);
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(sanitized.protocol)) {
                return null;
            }
            return sanitized.toString();
        }
        catch {
            return null;
        }
    },
    findLinks(text) {
        const matches = Array.from(text.matchAll(URL_REGEX));
        return matches.map(match => ({
            url: match[0],
            start: match.index,
            end: match.index + match[0].length,
        }));
    },
    processMessageWithLinks(text) {
        const links = this.findLinks(text);
        if (links.length === 0) {
            return [{ type: 'text', content: text }];
        }
        const result = [];
        let lastIndex = 0;
        links.forEach(({ url, start, end }) => {
            // Add text before the link
            if (start > lastIndex) {
                result.push({
                    type: 'text',
                    content: text.slice(lastIndex, start),
                });
            }
            // Add the link if it's valid and from an allowed domain
            const sanitizedUrl = this.sanitizeUrl(url);
            if (sanitizedUrl && this.isValidDomain(url)) {
                result.push({
                    type: 'link',
                    content: sanitizedUrl,
                });
            }
            else {
                // If link is invalid, keep it as text
                result.push({
                    type: 'text',
                    content: url,
                });
            }
            lastIndex = end;
        });
        // Add remaining text after the last link
        if (lastIndex < text.length) {
            result.push({
                type: 'text',
                content: text.slice(lastIndex),
            });
        }
        return result;
    },
};
