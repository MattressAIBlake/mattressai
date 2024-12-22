export interface MerchantConfig {
    id: string;
    name: string;
    branding: {
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
    };
    chatConfig: {
        masterPrompt: string;
        temperature: number;
        welcomeMessage?: string;
        maxTokens?: number;
        model?: string;
    };
}
export declare const MerchantService: {
    getConfig(merchantId: string): Promise<MerchantConfig>;
    refreshConfig(merchantId: string): Promise<MerchantConfig>;
};
