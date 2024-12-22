import React from 'react';
import { Theme } from '../../styles/theme';
interface ChatProps {
    theme: Theme;
}
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}
export declare const Chat: React.FC<ChatProps>;
export {};
