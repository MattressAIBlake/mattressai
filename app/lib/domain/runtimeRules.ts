import { z } from 'zod';

export const RuntimeRules = z.object({
  tone: z.string(),
  questionLimit: z.number().min(1).max(6),
  earlyExit: z.boolean(),
  leadCapture: z.object({
    enabled: z.boolean(),
    position: z.enum(['start', 'end']),
    fields: z.array(z.enum(['name', 'email', 'phone', 'zip']))
  }),
  maxRecommendations: z.number().min(1).max(5),
  customQuestions: z.array(z.string()).optional()
});

export type RuntimeRulesType = z.infer<typeof RuntimeRules>;

/**
 * Validates and parses runtime rules from user input
 */
export function validateRuntimeRules(data: unknown): RuntimeRulesType {
  return RuntimeRules.parse(data);
}

/**
 * Creates a compiled prompt text summary from runtime rules
 */
export function createCompiledPrompt(rules: RuntimeRulesType): string {
  const toneDescription = getToneDescription(rules.tone);
  const questionLimitText = `${rules.questionLimit} question${rules.questionLimit > 1 ? 's' : ''}`;
  const earlyExitText = rules.earlyExit ? 'with early exit' : 'without early exit';
  const leadCaptureText = rules.leadCapture.enabled
    ? `collecting ${rules.leadCapture.fields.join(', ')} at ${rules.leadCapture.position}`
    : 'no lead capture';
  const maxRecsText = `up to ${rules.maxRecommendations} recommendation${rules.maxRecommendations > 1 ? 's' : ''}`;

  let prompt = `AI assistant configured with ${toneDescription} tone, ${questionLimitText} ${earlyExitText}, ${leadCaptureText}, and ${maxRecsText}.`;

  // Add custom questions if any
  if (rules.customQuestions && rules.customQuestions.length > 0) {
    prompt += `\n\nCustom questions to ask:\n`;
    rules.customQuestions.forEach((question, index) => {
      prompt += `${index + 1}. ${question}\n`;
    });
  }

  return prompt;
}

/**
 * Maps tone enum values to human-readable descriptions
 */
function getToneDescription(tone: string): string {
  const toneMap: Record<string, string> = {
    'friendly': 'friendly and approachable',
    'professional': 'professional and informative',
    'casual': 'casual and conversational',
    'formal': 'formal and structured',
    'enthusiastic': 'enthusiastic and energetic',
    'empathetic': 'empathetic and understanding'
  };

  return toneMap[tone] || tone;
}
