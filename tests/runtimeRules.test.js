import { RuntimeRules, validateRuntimeRules, createCompiledPrompt } from '../app/lib/domain/runtimeRules.js';

describe('RuntimeRules Schema', () => {
  test('validates correct runtime rules', () => {
    const validRules = {
      tone: 'friendly',
      questionLimit: 3,
      earlyExit: true,
      leadCapture: {
        enabled: true,
        position: 'start',
        fields: ['name', 'email']
      },
      maxRecommendations: 3
    };

    expect(() => validateRuntimeRules(validRules)).not.toThrow();
    const result = validateRuntimeRules(validRules);
    expect(result).toEqual(validRules);
  });

  test('rejects invalid tone', () => {
    const invalidRules = {
      tone: 'invalid-tone',
      questionLimit: 3,
      earlyExit: false,
      leadCapture: {
        enabled: false,
        position: 'start',
        fields: []
      },
      maxRecommendations: 3
    };

    expect(() => validateRuntimeRules(invalidRules)).toThrow();
  });

  test('rejects question limit out of range', () => {
    const invalidRules = {
      tone: 'friendly',
      questionLimit: 10, // Should be 1-6
      earlyExit: false,
      leadCapture: {
        enabled: false,
        position: 'start',
        fields: []
      },
      maxRecommendations: 3
    };

    expect(() => validateRuntimeRules(invalidRules)).toThrow();
  });

  test('rejects max recommendations out of range', () => {
    const invalidRules = {
      tone: 'friendly',
      questionLimit: 3,
      earlyExit: false,
      leadCapture: {
        enabled: false,
        position: 'start',
        fields: []
      },
      maxRecommendations: 10 // Should be 1-5
    };

    expect(() => validateRuntimeRules(invalidRules)).toThrow();
  });

  test('rejects invalid lead capture position', () => {
    const invalidRules = {
      tone: 'friendly',
      questionLimit: 3,
      earlyExit: false,
      leadCapture: {
        enabled: true,
        position: 'middle', // Should be 'start' or 'end'
        fields: ['name']
      },
      maxRecommendations: 3
    };

    expect(() => validateRuntimeRules(invalidRules)).toThrow();
  });

  test('rejects invalid lead capture fields', () => {
    const invalidRules = {
      tone: 'friendly',
      questionLimit: 3,
      earlyExit: false,
      leadCapture: {
        enabled: true,
        position: 'start',
        fields: ['invalid-field'] // Should be from ['name', 'email', 'phone', 'zip']
      },
      maxRecommendations: 3
    };

    expect(() => validateRuntimeRules(invalidRules)).toThrow();
  });
});

describe('createCompiledPrompt', () => {
  test('creates correct prompt for basic configuration', () => {
    const rules = {
      tone: 'friendly',
      questionLimit: 3,
      earlyExit: false,
      leadCapture: {
        enabled: false,
        position: 'start',
        fields: []
      },
      maxRecommendations: 3
    };

    const prompt = createCompiledPrompt(rules);
    expect(prompt).toContain('friendly and approachable');
    expect(prompt).toContain('3 questions');
    expect(prompt).toContain('without early exit');
    expect(prompt).toContain('no lead capture');
    expect(prompt).toContain('up to 3 recommendations');
  });

  test('creates correct prompt with lead capture', () => {
    const rules = {
      tone: 'professional',
      questionLimit: 2,
      earlyExit: true,
      leadCapture: {
        enabled: true,
        position: 'end',
        fields: ['name', 'email', 'phone']
      },
      maxRecommendations: 5
    };

    const prompt = createCompiledPrompt(rules);
    expect(prompt).toContain('professional and informative');
    expect(prompt).toContain('2 questions');
    expect(prompt).toContain('with early exit');
    expect(prompt).toContain('collecting name, email, phone at end');
    expect(prompt).toContain('up to 5 recommendations');
  });

  test('handles singular vs plural correctly', () => {
    const rules = {
      tone: 'friendly',
      questionLimit: 1,
      earlyExit: false,
      leadCapture: {
        enabled: false,
        position: 'start',
        fields: []
      },
      maxRecommendations: 1
    };

    const prompt = createCompiledPrompt(rules);
    expect(prompt).toContain('1 question');
    expect(prompt).toContain('1 recommendation');
  });
});
