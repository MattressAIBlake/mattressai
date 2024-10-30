import 'cross-fetch/polyfill';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { ChatAnalytics, MattressPreferences, RecommendedMattress } from '@/types/chat';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Initialize assistant if it doesn't exist
async function getOrCreateAssistant() {
  const assistantName = "MattressAI Assistant";
  
  // List assistants to check if ours exists
  const assistants = await openai.beta.assistants.list();
  const existing = assistants.data.find(a => a.name === assistantName);
  
  if (existing) return existing;

  // Create new assistant if not found
  return await openai.beta.assistants.create({
    name: assistantName,
    instructions: `You are a mattress expert assistant. Help users find the perfect mattress by asking relevant questions about their needs, preferences, and concerns. After understanding their requirements, search the product database and provide personalized recommendations with links.`,
    model: "gpt-4-turbo-preview",
    tools: [
      { 
        type: "code_interpreter"  // Changed from retrieval to code_interpreter
      },
      { 
        type: "function",
        function: {  // Added required function property
          name: "search_products",
          description: "Search the product database for mattresses",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query"
              }
            },
            required: ["query"]
          }
        }
      }
    ]
  });
}

// Function to safely extract text content
function getMessageText(content: MessageContentText[]): string {
  if (!content.length || !('text' in content[0])) return '';
  return content[0].text.value;
}

// Function to extract preferences from conversation
function extractPreferences(messages: any[]): MattressPreferences {
  // Initialize empty preferences
  const preferences: MattressPreferences = {};
  
  // Analyze AI messages for collected data points
  messages.forEach(msg => {
    const content = msg.content[0]?.text?.value;
    if (!content) return;

    // Extract sleep position
    if (content.includes('sleep position')) {
      preferences.sleepPosition = extractSleepPosition(content);
    }
    // Extract budget
    if (content.includes('budget') || content.includes('price')) {
      preferences.budget = extractBudget(content);
    }
    // Add more extraction logic for other preferences
  });

  return preferences;
}

// Function to extract recommendations from conversation
function extractRecommendations(messages: any[]): RecommendedMattress[] {
  const recommendations: RecommendedMattress[] = [];
  
  messages.forEach(msg => {
    const content = msg.content[0]?.text?.value;
    if (!content) return;

    // Look for recommendation patterns
    if (content.includes('recommend') || content.includes('suggest')) {
      const mattresses = extractMattressDetails(content);
      recommendations.push(...mattresses);
    }
  });

  return recommendations;
}

// Store failed webhooks for retry
async function storeFailedWebhook(data: ChatAnalytics) {
  // Implement your storage logic here (e.g., Redis, Database)
  console.error('Failed webhook stored for retry:', data.sessionId);
}

// Updated POST handler with better error handling
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { message, threadId, sessionId } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    const assistant = await getOrCreateAssistant();
    const thread = threadId ? 
      await openai.beta.threads.retrieve(threadId) :
      await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    // Poll for updates with streaming
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let lastMessageId = null;

    while (runStatus.status !== "completed") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === "failed") {
        throw new Error("Assistant run failed");
      }

      // Check for new message chunks while running
      const messages = await openai.beta.threads.messages.list(thread.id);
      const latestMessage = messages.data[0];
      const messageContent = extractMessageContent(latestMessage);

      if (latestMessage.id !== lastMessageId) {
        lastMessageId = latestMessage.id;
        // Return partial response
        return NextResponse.json({
          reply: messageContent,
          threadId: thread.id,
          status: 'streaming'
        });
      }
    }

    // After completion, analyze the conversation
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Extract data points
    const preferences = extractPreferences(messages.data);
    const recommendations = extractRecommendations(messages.data);

    // Prepare analytics with proper error handling
    const analytics: ChatAnalytics = {
      sessionId,
      threadId: thread.id,
      startTime: new Date().toISOString(),
      preferences,
      recommendations,
      userResponses: messages.data
        .filter(msg => msg.role === 'user')
        .map(msg => ({
          question: 'User Input',
          answer: extractMessageContent(msg)
        }))
    };

    try {
      await sendToWebhook(analytics);
    } catch (webhookError) {
      console.error('Webhook failed but continuing with response:', webhookError);
    }

    return NextResponse.json({ 
      reply: messageContent,
      threadId: thread.id,
      status: 'completed',
      analytics
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Specific error handling
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper functions for data extraction
function extractSleepPosition(text: string): string[] {
  const positions = ['side', 'back', 'stomach', 'combination'];
  return positions.filter(position => text.toLowerCase().includes(position));
}

function extractBudget(text: string): { min?: number; max?: number } {
  const budget = { min: undefined, max: undefined };
  
  // Look for currency amounts
  const amounts = text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g);
  if (amounts && amounts.length) {
    const numbers = amounts.map(amount => 
      Number(amount.replace(/[$,]/g, ''))
    ).sort((a, b) => a - b);
    
    if (numbers.length >= 2) {
      budget.min = numbers[0];
      budget.max = numbers[numbers.length - 1];
    } else if (numbers.length === 1) {
      budget.max = numbers[0];
    }
  }

  return budget;
}

function extractMattressDetails(text: string): RecommendedMattress[] {
  const mattresses: RecommendedMattress[] = [];
  
  // Example pattern matching for mattress recommendations
  const regex = /(?:recommend|suggest)\s+the\s+([^\.]+)/gi;
  const matches = text.matchAll(regex);
  
  for (const match of matches) {
    if (match[1]) {
      const name = match[1].trim();
      // Basic extraction - you'll want to make this more sophisticated
      mattresses.push({
        name,
        brand: name.split(' ')[0], // Assumes first word is brand
        price: 0, // You'll need more complex parsing for price
        url: '', // You'll need to match this with your product database
        features: [],
      });
    }
  }

  return mattresses;
}

type MessageContentText = Extract<ChatCompletionMessageParam, { content: string }>;
