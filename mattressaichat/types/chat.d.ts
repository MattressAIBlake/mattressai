export interface Message {
  id: number;
  text: string;
  sender: 'User' | 'AI';
}

export interface ChatState {
  messages: Message[];
  threadId: string | null;
}

export interface MattressPreferences {
  sleepPosition?: string[];
  firmness?: string;
  budget?: {
    min?: number;
    max?: number;
  };
  painPoints?: string[];
  sleepingPartner?: boolean;
  temperature?: string;
  weight?: number;
  height?: number;
  allergies?: string[];
}

export interface RecommendedMattress {
  name: string;
  brand: string;
  price: number;
  url: string;
  features: string[];
  matchScore?: number;
}

export interface ChatAnalytics {
  sessionId: string;
  threadId: string;
  startTime: string;
  endTime?: string;
  preferences: MattressPreferences;
  recommendations: RecommendedMattress[];
  userResponses: Array<{
    question: string;
    answer: string;
  }>;
}
