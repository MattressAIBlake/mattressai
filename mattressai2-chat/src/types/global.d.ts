interface Window {
  webkitSpeechRecognition: typeof SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    item(index: number): {
      item(index: number): {
        transcript: string;
      };
    };
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  new(): SpeechRecognition;
} 