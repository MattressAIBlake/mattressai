import { json, redirect } from '@remix-run/node';
import { useState, useEffect } from 'react';
import { useLoaderData, useActionData, useNavigation, useFetcher, useNavigate } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  RadioButton,
  RangeSlider,
  Checkbox,
  Select,
  Button,
  Text,
  Banner,
  ProgressBar,
  Divider,
  Box,
  Badge
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '~/shopify.server';
import { createCompiledPrompt, validateRuntimeRules } from '~/lib/domain/runtimeRules';
import { createPromptVersion } from '~/lib/domain/promptVersion.server';

// Step definitions
const STEPS = [
  {
    id: 'tone',
    title: 'Tone & Style',
    description: 'Choose how your AI assistant should communicate with customers'
  },
  {
    id: 'questions',
    title: 'Question Limit',
    description: 'Set conversation boundaries and flow control'
  },
  {
    id: 'leads',
    title: 'Lead Capture Settings',
    description: 'Configure when and what information to collect from customers'
  },
  {
    id: 'review',
    title: 'Review & Activate',
    description: 'Review your configuration and activate the prompt'
  }
];

const TONE_OPTIONS = [
  { label: 'Friendly', value: 'friendly', description: 'Warm and approachable communication style' },
  { label: 'Professional', value: 'professional', description: 'Formal and informative tone' },
  { label: 'Casual', value: 'casual', description: 'Relaxed and conversational approach' },
  { label: 'Formal', value: 'formal', description: 'Structured and business-like communication' },
  { label: 'Enthusiastic', value: 'enthusiastic', description: 'Energetic and engaging style' },
  { label: 'Empathetic', value: 'empathetic', description: 'Understanding and supportive tone' }
];

const POSITION_OPTIONS = [
  { label: 'At the start', value: 'start' },
  { label: 'At the end', value: 'end' }
];

const FIELD_OPTIONS = [
  { label: 'Name', value: 'name' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'ZIP Code', value: 'zip' }
];

// Loader function
export async function loader({ request }) {
  const { prisma } = await import('~/db.server');
  try {
    const { session } = await authenticate.admin(request);
    
    if (!session?.shop) {
      throw new Error('No session found');
    }
    
    // Try to load the active prompt version
    let activePrompt = null;
    try {
      const { getActivePromptVersion } = await import('~/lib/domain/promptVersion.server');
      activePrompt = await getActivePromptVersion(session.shop);
    } catch (error) {
      console.error('Error loading active prompt:', error);
      // Continue without active prompt
    }
    
    return json({
      steps: STEPS,
      toneOptions: TONE_OPTIONS,
      positionOptions: POSITION_OPTIONS,
      fieldOptions: FIELD_OPTIONS,
      shop: session.shop,
      activePrompt: activePrompt ? {
        id: activePrompt.id,
        runtimeRules: activePrompt.runtimeRules,
        compiledPrompt: activePrompt.compiledPrompt,
        createdAt: activePrompt.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error in prompt builder loader:', error);
    throw error; // Let Remix handle the redirect
  }
}

// Action function
export async function action({ request }) {
  const { prisma } = await import('~/db.server');
  try {
    const { session } = await authenticate.admin(request);

    if (!session?.shop) {
      return json({ error: 'No session found' }, { status: 401 });
    }

    if (request.method === 'POST') {
      const formData = await request.formData();
      const step = formData.get('step');

    if (step === 'compile') {
      // Compile and return preview
      try {
        const runtimeRulesData = {
          tone: formData.get('tone'),
          questionLimit: parseInt(formData.get('questionLimit')),
          earlyExit: formData.get('earlyExit') === 'true',
          leadCapture: {
            enabled: formData.get('leadCaptureEnabled') === 'true',
            position: formData.get('leadCapturePosition'),
            fields: formData.getAll('leadCaptureFields')
          },
          maxRecommendations: parseInt(formData.get('maxRecommendations')),
          customQuestions: formData.getAll('customQuestions')
        };

        const compiledPrompt = createCompiledPrompt(runtimeRulesData);

        return json({
          success: true,
          compiledPrompt,
          runtimeRules: runtimeRulesData
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message,
          issues: error.issues || []
        }, { status: 422 });
      }
    }

    if (step === 'activate') {
      // Handle activation directly
      try {
        const runtimeRulesData = {
          tone: formData.get('tone'),
          questionLimit: parseInt(formData.get('questionLimit')),
          earlyExit: formData.get('earlyExit') === 'true',
          leadCapture: {
            enabled: formData.get('leadCaptureEnabled') === 'true',
            position: formData.get('leadCapturePosition'),
            fields: formData.getAll('leadCaptureFields')
          },
          maxRecommendations: parseInt(formData.get('maxRecommendations'))
        };

        // Validate the runtime rules
        const runtimeRules = validateRuntimeRules(runtimeRulesData);

        // Create compiled prompt
        const compiledPrompt = createCompiledPrompt(runtimeRules);

        // Deactivate all previous versions for this tenant
        await prisma.promptVersion.updateMany({
          where: { tenant: session.shop, isActive: true },
          data: { isActive: false }
        });

        // Create and activate the prompt version
        const promptVersion = await createPromptVersion({
          tenant: session.shop,
          runtimeRules,
          isActive: true
        });

        return json({
          success: true,
          message: 'Prompt activated successfully',
          promptVersion: {
            id: promptVersion.id,
            compiledPrompt: promptVersion.compiledPrompt,
            runtimeRules: promptVersion.runtimeRules,
            isActive: promptVersion.isActive,
            createdAt: promptVersion.createdAt
          }
        });
      } catch (error) {
        console.error('Error activating prompt:', error);
        
        if (error.issues) {
          // Zod validation error
          return json(
            {
              success: false,
              error: 'Validation failed',
              details: error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
              }))
            },
            { status: 422 }
          );
        }

        return json(
          { 
            success: false,
            error: error.message || 'Failed to activate prompt' 
          },
          { status: 500 }
        );
      }
    }

    if (step === 'activateAdvanced') {
      // Handle direct prompt text activation
      try {
        const compiledPrompt = formData.get('compiledPrompt');
        
        if (!compiledPrompt || compiledPrompt.trim().length === 0) {
          return json(
            { success: false, error: 'Prompt text cannot be empty' },
            { status: 400 }
          );
        }

        // Create minimal runtime rules for advanced editing
        const runtimeRules = {
          tone: 'custom',
          questionLimit: 3,
          earlyExit: false,
          leadCapture: {
            enabled: false,
            position: 'end',
            fields: []
          },
          maxRecommendations: 3,
          customQuestions: [],
          isAdvancedEdit: true
        };

        // Deactivate all previous versions for this tenant
        await prisma.promptVersion.updateMany({
          where: { tenant: session.shop, isActive: true },
          data: { isActive: false }
        });

        // Create prompt version directly with the edited text
        const promptVersion = await prisma.promptVersion.create({
          data: {
            tenant: session.shop,
            compiledPrompt: compiledPrompt.trim(),
            runtimeRules: JSON.stringify(runtimeRules),
            isActive: true
          }
        });

        return json({
          success: true,
          message: 'Custom prompt activated successfully',
          promptVersion: {
            id: promptVersion.id,
            compiledPrompt: promptVersion.compiledPrompt,
            isActive: promptVersion.isActive,
            createdAt: promptVersion.createdAt
          }
        });
      } catch (error) {
        console.error('Error activating advanced prompt:', error);
        return json(
          { success: false, error: error.message || 'Failed to activate custom prompt' },
          { status: 500 }
        );
      }
    }
  }

  return json({ error: 'Invalid request' }, { status: 400 });
  } catch (authError) {
    console.error('Authentication error in prompt builder:', authError);
    return json(
      { error: 'Authentication failed. Please refresh and try again.' },
      { status: 401 }
    );
  }
}

// Main component
export default function PromptBuilder() {
  const { steps, toneOptions, positionOptions, fieldOptions, activePrompt } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const activateFetcher = useFetcher();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    tone: 'friendly',
    questionLimit: 3,
    earlyExit: false,
    leadCaptureEnabled: false,
    leadCapturePosition: 'end',
    leadCaptureFields: [],
    maxRecommendations: 3,
    customQuestions: []
  });
  const [compiledPrompt, setCompiledPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [showCurrentPrompt, setShowCurrentPrompt] = useState(true);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [advancedPromptText, setAdvancedPromptText] = useState('');
  const [savingAdvanced, setSavingAdvanced] = useState(false);

  // Handle compile fetcher response
  useEffect(() => {
    if (fetcher.data && fetcher.data.success && fetcher.data.compiledPrompt) {
      setCompiledPrompt(fetcher.data.compiledPrompt);
      setShowPreview(true);
    } else if (fetcher.data && !fetcher.data.success) {
      console.error('Compilation failed:', fetcher.data.error);
    }
  }, [fetcher.data]);

  // Handle activation fetcher response
  useEffect(() => {
    if (activateFetcher.data) {
      if (activateFetcher.data.success) {
        // Success - show success message
        setActivationSuccess(true);
      } else {
        console.error('Activation failed:', activateFetcher.data.error);
        alert(`Activation failed: ${activateFetcher.data.error}`);
      }
    }
  }, [activateFetcher.data]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle array field changes (checkboxes)
  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  // Add custom question
  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        customQuestions: [...prev.customQuestions, newQuestion.trim()]
      }));
      setNewQuestion('');
    }
  };

  // Remove custom question
  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((_, i) => i !== index)
    }));
  };

  // Navigate between steps
  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      setShowPreview(false);
    }
  };

  // Load current active prompt into form
  const handleLoadCurrentPrompt = () => {
    if (activePrompt && activePrompt.runtimeRules) {
      const rules = activePrompt.runtimeRules;
      setFormData({
        tone: rules.tone || 'friendly',
        questionLimit: rules.questionLimit || 3,
        earlyExit: rules.earlyExit || false,
        leadCaptureEnabled: rules.leadCapture?.enabled || false,
        leadCapturePosition: rules.leadCapture?.position || 'end',
        leadCaptureFields: rules.leadCapture?.fields || [],
        maxRecommendations: rules.maxRecommendations || 3,
        customQuestions: rules.customQuestions || []
      });
      setShowCurrentPrompt(false);
      setCurrentStep(0);
    }
  };

  // Open advanced editor with current prompt
  const handleOpenAdvancedEditor = () => {
    if (activePrompt && activePrompt.compiledPrompt) {
      setAdvancedPromptText(activePrompt.compiledPrompt);
    } else {
      // If no active prompt, compile current form data
      handleCompilePreview();
    }
    setShowAdvancedEditor(true);
    setShowCurrentPrompt(false);
  };

  // Save directly edited prompt
  const handleSaveAdvancedPrompt = async () => {
    setSavingAdvanced(true);
    
    const form = new FormData();
    form.append('step', 'activateAdvanced');
    form.append('compiledPrompt', advancedPromptText);
    
    activateFetcher.submit(form, { method: 'POST' });
  };

  // Update advanced prompt text when compile completes
  useEffect(() => {
    if (showAdvancedEditor && compiledPrompt && !advancedPromptText) {
      setAdvancedPromptText(compiledPrompt);
    }
  }, [compiledPrompt, showAdvancedEditor, advancedPromptText]);

  // Compile preview
  const handleCompilePreview = () => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'customQuestions') {
        // Handle custom questions specially
        value.forEach(question => form.append('customQuestions', question));
      } else if (Array.isArray(value)) {
        value.forEach(item => form.append(key, item));
      } else {
        form.append(key, value.toString());
      }
    });
    form.append('step', 'compile');

    fetcher.submit(form, { method: 'POST' });
  };

  // Activate prompt
  const handleActivate = () => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'customQuestions') {
        // Handle custom questions specially
        value.forEach(question => form.append('customQuestions', question));
      } else if (Array.isArray(value)) {
        value.forEach(item => form.append(key, item));
      } else {
        form.append(key, value.toString());
      }
    });
    form.append('step', 'activate');

    activateFetcher.submit(form, { method: 'POST' });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Tone & Style
        return (
          <Card>
            <Box padding="800">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {toneOptions.map(option => (
                  <div
                    key={option.value}
                    onClick={() => handleInputChange('tone', option.value)}
                    className={`tone-card ${formData.tone === option.value ? 'tone-card-selected' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ paddingTop: '4px' }}>
                        <RadioButton
                          label=""
                          checked={formData.tone === option.value}
                          onChange={() => handleInputChange('tone', option.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text variant="headingMd" as="h4" fontWeight="semibold">
                          <span className={formData.tone === option.value ? 'text-blue' : ''}>
                            {option.label}
                          </span>
                        </Text>
                        <Box paddingBlockStart="100">
                          <Text variant="bodyMd" as="p" tone="subdued">
                            {option.description}
                          </Text>
                        </Box>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Box>
          </Card>
        );

      case 1: // Question Limit
        return (
          <Card>
            <Box padding="800">
              <Box paddingBlockEnd="800">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <Text variant="headingMd" as="h3" fontWeight="semibold">
                    <span className="text-blue">Maximum Questions</span>
                  </Text>
                  <div className="progress-badge">
                    {formData.questionLimit} question{formData.questionLimit > 1 ? 's' : ''}
                  </div>
                </div>
                <RangeSlider
                  label="Maximum questions to ask"
                  labelHidden
                  value={formData.questionLimit}
                  onChange={value => handleInputChange('questionLimit', value)}
                  min={1}
                  max={6}
                  step={1}
                />
                <Box paddingBlockStart="300">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    The AI will ask up to {formData.questionLimit} question{formData.questionLimit > 1 ? 's' : ''} before making mattress recommendations
                  </Text>
                </Box>
              </Box>

              <Divider />

              <div className="mt-8">
                <Checkbox
                  label="Allow early exit when enough information is gathered"
                  helpText="The AI can skip remaining questions if it has sufficient information to make accurate recommendations"
                  checked={formData.earlyExit}
                  onChange={checked => handleInputChange('earlyExit', checked)}
                />
              </div>

              <Divider />

              <Box paddingBlockStart="800">
                <Box paddingBlockEnd="500">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        <span className="text-teal">Advanced: Custom Questions</span>
                      </Text>
                      <Box paddingBlockStart="100">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Add your own specific questions for the AI to ask customers
                        </Text>
                      </Box>
                    </div>
                    <Button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      disclosure={showAdvanced ? 'up' : 'down'}
                    >
                      {showAdvanced ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </Box>

                {showAdvanced && (
                  <div className="custom-questions-container">
                    <Box paddingBlockEnd="500">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Write questions you want the AI to ask. These will be asked in addition to the AI's standard questions.
                      </Text>
                    </Box>

                    {/* Custom Questions List */}
                    {formData.customQuestions.length > 0 && (
                      <Box paddingBlockEnd="500">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {formData.customQuestions.map((question, index) => (
                            <div key={index} className="custom-question-item">
                              <div style={{ flex: 1 }}>
                                <Text variant="bodyMd" as="p">
                                  <span className="custom-question-number">{index + 1}.</span> {question}
                                </Text>
                              </div>
                              <Button
                                size="slim"
                                onClick={() => handleRemoveQuestion(index)}
                                tone="critical"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </Box>
                    )}

                    {/* Add Question Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <TextField
                        label="New question"
                        labelHidden
                        placeholder="e.g., Do you prefer a soft or firm mattress?"
                        value={newQuestion}
                        onChange={setNewQuestion}
                        autoComplete="off"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddQuestion();
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddQuestion}
                        disabled={!newQuestion.trim()}
                      >
                        Add Question
                      </Button>
                    </div>
                  </div>
                )}
              </Box>
            </Box>
          </Card>
        );

      case 2: // Lead Capture
        return (
          <Card>
            <Box padding="800">
              <div className={`lead-capture-container ${formData.leadCaptureEnabled ? 'lead-capture-container-enabled' : ''}`}>
                <Checkbox
                  label={
                    <span className={formData.leadCaptureEnabled ? 'text-teal' : ''} style={{ fontWeight: formData.leadCaptureEnabled ? '600' : 'normal' }}>
                      Enable lead capture
                    </span>
                  }
                  helpText="Collect customer information during or after the conversation"
                  checked={formData.leadCaptureEnabled}
                  onChange={checked => handleInputChange('leadCaptureEnabled', checked)}
                />
              </div>

              {formData.leadCaptureEnabled && (
                <>
                  <Box paddingBlock="800">
                    <Divider />
                  </Box>

                  <Box paddingBlockEnd="800">
                    <Select
                      label={<span className="text-blue">When to capture leads</span>}
                      options={positionOptions}
                      value={formData.leadCapturePosition}
                      onChange={value => handleInputChange('leadCapturePosition', value)}
                    />
                  </Box>

                  <Divider />

                  <Box paddingBlockStart="800">
                    <Box paddingBlockEnd="400">
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        <span className="text-blue">Information to collect</span>
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Select which customer details you'd like to collect
                        </Text>
                      </Box>
                    </Box>
                    <Box paddingBlockStart="500">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {fieldOptions.map(field => (
                          <div 
                            key={field.value}
                            className={`lead-capture-field-item ${formData.leadCaptureFields.includes(field.value) ? 'lead-capture-field-item-selected' : ''}`}
                          >
                            <Checkbox
                              label={field.label}
                              checked={formData.leadCaptureFields.includes(field.value)}
                              onChange={checked => handleArrayChange('leadCaptureFields', field.value, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Card>
        );

      case 3: // Review & Activate
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {!showPreview ? (
              <Card>
                <div className="review-preview-container">
                  <Box paddingBlockEnd="400">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      <span className="text-blue">Ready to review your configuration</span>
                    </Text>
                  </Box>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Generate a preview to see how your AI assistant will behave
                  </Text>
                  <Box paddingBlockStart="800">
                    <Button 
                      primary 
                      size="large"
                      onClick={handleCompilePreview} 
                      loading={fetcher.state === 'submitting' || fetcher.state === 'loading'}
                    >
                      Generate Preview
                    </Button>
                  </Box>
                </div>
              </Card>
            ) : (
              <>
                {activationSuccess ? (
                  <Banner tone="success">
                    <p><strong>✓ Prompt Activated Successfully!</strong> Your AI assistant is now using the new configuration. Changes are live for all customer conversations.</p>
                  </Banner>
                ) : (
                  <Banner tone="info">
                    <p><strong>Configuration Ready!</strong> Review your settings below and activate when ready.</p>
                  </Banner>
                )}

                <Card>
                  <Box padding="800">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      <span className="text-blue">Configuration Summary</span>
                    </Text>
                    <Box paddingBlockStart="600">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div className="summary-card-item">
                          <Text variant="headingSm" as="h4" fontWeight="semibold">
                            <span className="text-blue">Tone</span>
                          </Text>
                          <Box paddingBlockStart="200">
                            <Text variant="bodyMd" as="p">{toneOptions.find(t => t.value === formData.tone)?.label}</Text>
                          </Box>
                        </div>
                        <div className="summary-card-item-alt">
                          <Text variant="headingSm" as="h4" fontWeight="semibold">
                            <span className="text-teal">Question Limit</span>
                          </Text>
                          <Box paddingBlockStart="200">
                            <Text variant="bodyMd" as="p">{formData.questionLimit} questions</Text>
                          </Box>
                        </div>
                        <div className="summary-card-item">
                          <Text variant="headingSm" as="h4" fontWeight="semibold">
                            <span className="text-blue">Early Exit</span>
                          </Text>
                          <Box paddingBlockStart="200">
                            <Text variant="bodyMd" as="p">{formData.earlyExit ? 'Enabled' : 'Disabled'}</Text>
                          </Box>
                        </div>
                        <div className="summary-card-item-alt">
                          <Text variant="headingSm" as="h4" fontWeight="semibold">
                            <span className="text-teal">Lead Capture</span>
                          </Text>
                          <Box paddingBlockStart="200">
                            <Text variant="bodyMd" as="p">{formData.leadCaptureEnabled ? 'Enabled' : 'Disabled'}</Text>
                          </Box>
                        </div>
                        {formData.leadCaptureEnabled && (
                          <>
                            <div className="summary-card-item">
                              <Text variant="headingSm" as="h4" fontWeight="semibold">
                                <span className="text-blue">Capture Timing</span>
                              </Text>
                              <Box paddingBlockStart="200">
                                <Text variant="bodyMd" as="p">{positionOptions.find(p => p.value === formData.leadCapturePosition)?.label}</Text>
                              </Box>
                            </div>
                            <div className="summary-card-item-alt">
                              <Text variant="headingSm" as="h4" fontWeight="semibold">
                                <span className="text-teal">Fields to Collect</span>
                              </Text>
                              <Box paddingBlockStart="200">
                                <Text variant="bodyMd" as="p">{formData.leadCaptureFields.join(', ') || 'None'}</Text>
                              </Box>
                            </div>
                          </>
                        )}
                      </div>
                    </Box>

                    {formData.customQuestions.length > 0 && (
                      <>
                        <Box paddingBlock="600">
                          <Divider />
                        </Box>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          <span className="text-teal">Custom Questions ({formData.customQuestions.length})</span>
                        </Text>
                        <Box paddingBlockStart="400">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {formData.customQuestions.map((question, index) => (
                              <div key={index} className="summary-card-item">
                                <Text variant="bodyMd" as="p">
                                  <span className="text-blue" style={{ fontWeight: '600' }}>{index + 1}.</span> {question}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </Box>
                      </>
                    )}
                  </Box>
                </Card>

                <Card>
                  <Box padding="800">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      <span className="text-teal">Generated AI Prompt</span>
                    </Text>
                    <div className="generated-prompt-box">
                      <Text variant="bodyMd" as="p" breakWord>
                        {compiledPrompt}
                      </Text>
                    </div>
                  </Box>
                </Card>

                {activationSuccess ? (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <Button onClick={() => navigate('/app')} size="large">
                      Back to Dashboard
                    </Button>
                    <Button
                      primary
                      size="large"
                      onClick={() => {
                        setActivationSuccess(false);
                        setShowPreview(false);
                        setCurrentStep(0);
                      }}
                    >
                      Create New Version
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <Button onClick={() => goToStep(2)} size="large">
                      Back to Settings
                    </Button>
                    <Button
                      primary
                      size="large"
                      onClick={handleActivate}
                      loading={activateFetcher.state === 'submitting' || activateFetcher.state === 'loading'}
                    >
                      Save & Activate
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Page>
      <TitleBar title="Prompt Builder" />
      <Layout>
        <Layout.Section>
          {/* Current Active Prompt Card */}
          {activePrompt && showCurrentPrompt && (
            <Card>
              <div className="active-prompt-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <Text variant="headingLg" as="h2" fontWeight="semibold">
                      <span className="text-blue">Current Active Prompt</span>
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Activated on {new Date(activePrompt.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Box>
                  </div>
                  <Button onClick={() => setShowCurrentPrompt(false)}>
                    Dismiss
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div className="active-prompt-info-item">
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span className="text-blue">Tone</span>
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p">
                        {toneOptions.find(t => t.value === activePrompt.runtimeRules.tone)?.label || activePrompt.runtimeRules.tone}
                      </Text>
                    </Box>
                  </div>
                  <div className="active-prompt-info-item-alt">
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span className="text-teal">Question Limit</span>
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.questionLimit} questions</Text>
                    </Box>
                  </div>
                  <div className="active-prompt-info-item">
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span className="text-blue">Early Exit</span>
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.earlyExit ? 'Enabled' : 'Disabled'}</Text>
                    </Box>
                  </div>
                  <div className="active-prompt-info-item-alt">
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span className="text-teal">Lead Capture</span>
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.leadCapture?.enabled ? 'Enabled' : 'Disabled'}</Text>
                    </Box>
                  </div>
                  {activePrompt.runtimeRules.customQuestions && activePrompt.runtimeRules.customQuestions.length > 0 && (
                    <div className="active-prompt-info-item-alt" style={{ gridColumn: '1 / -1' }}>
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        <span className="text-teal">Custom Questions</span>
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.customQuestions.length} question(s)</Text>
                      </Box>
                    </div>
                  )}
                </div>

                <Divider />

                <Box paddingBlockStart="600">
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Button primary onClick={handleLoadCurrentPrompt}>
                      Load & Edit Settings
                    </Button>
                    <Button onClick={handleOpenAdvancedEditor}>
                      Edit Prompt Text Directly
                    </Button>
                    <Button onClick={() => navigate('/app/admin/prompt/versions')}>
                      View All Versions
                    </Button>
                  </div>
                </Box>
              </div>
            </Card>
          )}

          {/* Advanced Editor */}
          {showAdvancedEditor ? (
            <Card>
              <div className="advanced-editor-container">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <Text variant="headingLg" as="h2" fontWeight="semibold">
                      <span className="text-teal">Advanced Prompt Editor</span>
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Directly edit the AI prompt text. Changes will be saved and immediately applied to customer conversations.
                      </Text>
                    </Box>
                  </div>
                  <Button onClick={() => {
                    setShowAdvancedEditor(false);
                    setShowCurrentPrompt(true);
                  }}>
                    Close Editor
                  </Button>
                </div>

                {activationSuccess ? (
                  <Banner tone="success">
                    <p><strong>✓ Custom Prompt Activated!</strong> Your directly edited prompt is now live.</p>
                  </Banner>
                ) : (
                  <Banner tone="warning">
                    <p><strong>Advanced Mode:</strong> You are editing the raw prompt text. Make sure your changes maintain the proper structure and instructions for the AI.</p>
                  </Banner>
                )}

                <Box paddingBlockStart="600">
                  <Box paddingBlockEnd="400">
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span className="text-blue">Prompt Text</span>
                    </Text>
                    <Box paddingBlockStart="100">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Edit the complete AI system prompt below. Use markdown formatting for best results.
                      </Text>
                    </Box>
                  </Box>
                  
                  <textarea
                    value={advancedPromptText}
                    onChange={(e) => setAdvancedPromptText(e.target.value)}
                    className="advanced-editor-textarea"
                    placeholder="Enter your AI system prompt here..."
                  />
                  
                  <Box paddingBlockStart="200">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text variant="bodySm" as="p" tone="subdued">
                        {advancedPromptText.length} characters
                      </Text>
                      {advancedPromptText.length < 100 && (
                        <Badge tone="warning">Too short</Badge>
                      )}
                      {advancedPromptText.length > 10000 && (
                        <Badge tone="warning">Very long prompt may affect performance</Badge>
                      )}
                    </div>
                  </Box>
                </Box>

                <Box paddingBlock="600">
                  <Divider />
                </Box>

                {activationSuccess ? (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Button onClick={() => navigate('/app')} size="large">
                      Back to Dashboard
                    </Button>
                    <Button
                      primary
                      size="large"
                      onClick={() => {
                        setActivationSuccess(false);
                        setShowAdvancedEditor(false);
                        setShowCurrentPrompt(true);
                        setAdvancedPromptText('');
                      }}
                    >
                      Create Another
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Button 
                      onClick={() => {
                        setShowAdvancedEditor(false);
                        setShowCurrentPrompt(true);
                      }}
                      size="large"
                    >
                      Cancel
                    </Button>
                    <Button
                      primary
                      size="large"
                      onClick={handleSaveAdvancedPrompt}
                      loading={activateFetcher.state === 'submitting' || activateFetcher.state === 'loading'}
                      disabled={!advancedPromptText || advancedPromptText.trim().length < 100}
                    >
                      Save & Activate Custom Prompt
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : null}

          {/* Step content */}
          {!showAdvancedEditor && (
            <Card>
            <Box padding="800">
              {/* Clean progress bar */}
              <Box paddingBlockEnd="1000">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Text variant="bodyMd" as="p">
                    <span className="text-blue" style={{ fontWeight: '600' }}>Step {currentStep + 1} of {steps.length}</span>
                  </Text>
                  <div className="progress-badge">
                    {Math.round((currentStep + 1) / steps.length * 100)}% complete
                  </div>
                </div>
                <div className="gradient-progress-bar">
                  <div 
                    className="gradient-progress-fill" 
                    style={{ width: `${(currentStep + 1) / steps.length * 100}%` }}
                  />
                </div>
              </Box>

              <Box paddingBlockEnd="800">
                <Text variant="headingLg" as="h2" fontWeight="semibold">
                  <span className="text-blue">{steps[currentStep].title}</span>
                </Text>
                <Box paddingBlockStart="200">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {steps[currentStep].description}
                  </Text>
                </Box>
              </Box>

              {renderStepContent()}
            </Box>

            {/* Navigation buttons */}
            {currentStep < steps.length - 1 && (
              <Box padding="800" paddingBlockStart="0">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <Button
                    disabled={currentStep === 0}
                    onClick={() => goToStep(currentStep - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    primary
                    onClick={() => goToStep(currentStep + 1)}
                  >
                    Next
                  </Button>
                </div>
              </Box>
            )}
          </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
