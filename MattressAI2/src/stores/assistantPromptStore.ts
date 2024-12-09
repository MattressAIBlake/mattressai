import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MattressSpecs {
  firmness?: string;
  type?: string;
  height?: string;
  materials?: string[];
  sleepingPositions?: string[];
  coolingSystems?: string[];
  edgeSupport?: string;
  motionTransfer?: string;
  warranty?: string;
  trialPeriod?: string;
}

interface Mattress {
  id: string;
  brand: string;
  name: string;
  description?: string;
  specs?: MattressSpecs;
  priceRange?: {
    min: number;
    max: number;
  };
  productUrl?: string;
}

interface StoreInfo {
  name?: string;
  hours?: string;
  locations?: string;
  contactInfo?: string;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'rating';
  required: boolean;
}

interface AssistantConfig {
  // Store Information
  storeInfo: StoreInfo;
  
  // Conversation Settings
  initialGreeting: string;
  toneDirective: string;
  conversationStyle: 'professional' | 'friendly' | 'casual' | 'luxury';
  leadCaptureTiming: 'immediate' | 'after-engagement' | 'before-recommendation' | 'end';
  
  // AI Behavior
  productKnowledgeBase: 'all' | 'in-stock' | 'featured';
  primaryGoal: 'lead' | 'product';
  educationTopics: string[];
  responseCreativity: number; // 0-100
  productRecommendationLimit: number;
  
  // Questions
  questions: Question[];
}

interface PromptStore {
  inventory: Mattress[];
  config: AssistantConfig;
  masterPrompt: string;
  setInventory: (inventory: Mattress[]) => void;
  setConfig: (config: AssistantConfig) => void;
  setMasterPrompt: (prompt: string) => void;
  generateMasterPrompt: () => string;
}

const defaultConfig: AssistantConfig = {
  storeInfo: {},
  initialGreeting: "Hello! I'm your mattress expert. How can I help you find the perfect mattress today?",
  toneDirective: "Be friendly and professional, use occasional emojis to keep the conversation engaging 😊",
  conversationStyle: 'professional',
  leadCaptureTiming: 'after-engagement',
  productKnowledgeBase: 'all',
  primaryGoal: 'lead',
  educationTopics: ['Sleep Positions', 'Mattress Types', 'Support & Comfort'],
  responseCreativity: 70,
  productRecommendationLimit: 3,
  questions: [
    {
      id: '1',
      text: 'What is your preferred sleeping position?',
      type: 'multiple_choice',
      required: true
    },
    {
      id: '2',
      text: 'Do you experience any back pain?',
      type: 'multiple_choice',
      required: true
    },
    {
      id: '3',
      text: 'What is your budget range?',
      type: 'multiple_choice',
      required: true
    }
  ]
};

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      inventory: [],
      config: defaultConfig,
      masterPrompt: '',

      setInventory: (inventory) => set({ inventory }),
      setConfig: (config) => set({ config }),
      setMasterPrompt: (prompt) => set({ masterPrompt: prompt }),

      generateMasterPrompt: () => {
        const { inventory, config } = get();
        
        // Format store information
        const storeContext = [
          config.storeInfo.name ? `Store Name: ${config.storeInfo.name}` : null,
          config.storeInfo.hours ? `Store Hours: ${config.storeInfo.hours}` : null,
          config.storeInfo.locations ? `Locations: ${config.storeInfo.locations}` : null,
          config.storeInfo.contactInfo ? `Contact: ${config.storeInfo.contactInfo}` : null,
        ].filter(Boolean).join('\n');

        // Format each mattress's details
        const inventoryContext = inventory.map(mattress => {
          const specs = mattress.specs || {};
          const lines = [
            `${mattress.brand} ${mattress.name}:`,
            mattress.description ? `Description: ${mattress.description}` : null,
            specs.type ? `Type: ${specs.type}` : null,
            specs.firmness ? `Firmness: ${specs.firmness}` : null,
            specs.height ? `Height: ${specs.height}` : null,
            specs.materials?.length ? `Materials: ${specs.materials.join(', ')}` : null,
            specs.sleepingPositions?.length ? `Best for: ${specs.sleepingPositions.join(', ')} sleepers` : null,
            specs.coolingSystems?.length ? `Cooling: ${specs.coolingSystems.join(', ')}` : null,
            specs.edgeSupport ? `Edge Support: ${specs.edgeSupport}` : null,
            specs.motionTransfer ? `Motion Transfer: ${specs.motionTransfer}` : null,
            mattress.priceRange ? `Price Range: $${mattress.priceRange.min.toLocaleString()} - $${mattress.priceRange.max.toLocaleString()}` : null,
            mattress.productUrl ? `Product URL: ${mattress.productUrl}` : null,
            specs.warranty ? `Warranty: ${specs.warranty}` : null,
            specs.trialPeriod ? `Trial Period: ${specs.trialPeriod}` : null
          ].filter(Boolean).map(line => `  ${line}`).join('\n');

          return lines;
        }).join('\n\n');

        // Format questions
        const questionsContext = config.questions.map(q => 
          `${q.required ? '(Required)' : '(Optional)'} ${q.text} [${q.type}]`
        ).join('\n');

        // Core assistant capabilities and constraints
        const coreInstructions = `
You are a mattress expert AI assistant. Your role is to help customers find the perfect mattress from our available inventory.

CONVERSATION STYLE:
${config.toneDirective}
Communication Style: ${config.conversationStyle}
Initial Greeting: "${config.initialGreeting}"

GOALS AND BEHAVIOR:
Primary Goal: ${config.primaryGoal === 'lead' ? 'Collect customer information while helping them find the right mattress' : 'Guide customers directly to product pages that best match their needs'}
Lead Capture Timing: ${config.leadCaptureTiming}
Product Knowledge: ${config.productKnowledgeBase === 'all' ? 'Access to all products' : config.productKnowledgeBase === 'in-stock' ? 'Only show in-stock items' : 'Focus on featured products'}
Maximum Recommendations: Limit to ${config.productRecommendationLimit} products per response
Response Style: ${config.responseCreativity < 30 ? 'Conservative and straightforward' : config.responseCreativity > 70 ? 'Creative and engaging' : 'Balanced approach'}

REQUIRED QUESTIONS:
${questionsContext}

EDUCATION TOPICS:
The following topics should be covered when relevant:
${config.educationTopics.map(topic => `- ${topic}`).join('\n')}

STORE INFORMATION:
${storeContext}

AVAILABLE INVENTORY:
${inventoryContext}

INTERACTION GUIDELINES:
1. Ask questions to understand:
   - Sleeping position(s)
   - Any pain points or specific concerns
   - Temperature preferences
   - Budget range
   - Size requirements
   - Partner considerations (if applicable)

2. Provide education about:
   - How different mattress types feel
   - The importance of proper support
   - Material benefits and differences
   - Value for money considerations

3. Make recommendations:
   - Start broad and narrow down based on responses
   - Explain why each recommendation fits their needs
   - Include prices and key features
   - Provide direct links when appropriate

4. Always:
   - Be honest about pros and cons
   - Stay within the customer's budget
   - Only recommend from available inventory
   - Explain technical terms in simple language
   - Focus on benefits over features
   - Maintain the specified conversation style
   - Follow the lead capture timing directive

5. Handle missing information:
   - If certain product details are missing, focus on the available information
   - Be transparent about what you don't know
   - Make recommendations based on the information you do have
   - Ask the customer about their preferences for aspects where product details are missing

Remember: Your recommendations should always be based on the customer's specific needs and preferences, using only the mattresses listed above. If certain product details are missing, focus on the information that is available and be transparent about what you don't know.`.trim();

        set({ masterPrompt: coreInstructions });
        return coreInstructions;
      }
    }),
    {
      name: 'mattressai-prompt-store'
    }
  )
); 