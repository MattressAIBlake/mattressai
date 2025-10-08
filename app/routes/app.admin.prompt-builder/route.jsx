import { json, redirect } from '@remix-run/node';
import { useState, useEffect } from 'react';
import { useLoaderData, useActionData, useNavigation, useFetcher } from '@remix-run/react';
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
import prisma from '~/db.server';

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
            <div className="p-8">
              <div className="space-y-5">
                {toneOptions.map(option => (
                  <div
                    key={option.value}
                    onClick={() => handleInputChange('tone', option.value)}
                    className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.tone === option.value
                        ? 'shadow-lg'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    style={{
                      borderColor: formData.tone === option.value ? '#449de7' : undefined,
                      backgroundColor: formData.tone === option.value ? '#f0f9ff' : undefined,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <RadioButton
                          label=""
                          checked={formData.tone === option.value}
                          onChange={() => handleInputChange('tone', option.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Text variant="headingMd" as="h4" fontWeight="semibold">
                          <span style={{ color: formData.tone === option.value ? '#449de7' : undefined }}>
                            {option.label}
                          </span>
                        </Text>
                        <div className="mt-1">
                          <Text variant="bodyMd" as="p" tone="subdued">
                            {option.description}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case 1: // Question Limit
        return (
          <Card>
            <div className="p-8">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-5">
                  <Text variant="headingMd" as="h3" fontWeight="semibold">
                    <span style={{ color: '#449de7' }}>Maximum Questions</span>
                  </Text>
                  <div className="px-4 py-2 rounded-full font-semibold text-sm" style={{ backgroundColor: '#3da7b1', color: 'white' }}>
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
                <div className="mt-3">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    The AI will ask up to {formData.questionLimit} question{formData.questionLimit > 1 ? 's' : ''} before making mattress recommendations
                  </Text>
                </div>
              </div>

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

              <div className="mt-8">
                <div className="mb-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        <span style={{ color: '#3da7b1' }}>Advanced: Custom Questions</span>
                      </Text>
                      <div className="mt-1">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Add your own specific questions for the AI to ask customers
                        </Text>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      disclosure={showAdvanced ? 'up' : 'down'}
                    >
                      {showAdvanced ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="mt-5 p-6 rounded-lg border-2" style={{ backgroundColor: '#f0f9ff', borderColor: '#449de7' }}>
                    <div className="space-y-5">
                      <div>
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Write questions you want the AI to ask. These will be asked in addition to the AI's standard questions.
                        </Text>
                      </div>

                      {/* Custom Questions List */}
                      {formData.customQuestions.length > 0 && (
                        <div className="space-y-3">
                          {formData.customQuestions.map((question, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border-l-4 shadow-sm" style={{ borderLeftColor: '#3da7b1' }}>
                              <div className="flex-1">
                                <Text variant="bodyMd" as="p">
                                  <span style={{ color: '#3da7b1', fontWeight: '600' }}>{index + 1}.</span> {question}
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
                      )}

                      {/* Add Question Input */}
                      <div className="space-y-3">
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
                  </div>
                )}
              </div>
            </div>
          </Card>
        );

      case 2: // Lead Capture
        return (
          <Card>
            <div className="p-8">
              <div className="p-5 rounded-xl border-2 transition-all" style={{
                borderColor: formData.leadCaptureEnabled ? '#3da7b1' : '#e5e7eb',
                backgroundColor: formData.leadCaptureEnabled ? '#ecfeff' : 'transparent'
              }}>
                <Checkbox
                  label={<span style={{ color: formData.leadCaptureEnabled ? '#3da7b1' : undefined, fontWeight: formData.leadCaptureEnabled ? '600' : undefined }}>Enable lead capture</span>}
                  helpText="Collect customer information during or after the conversation"
                  checked={formData.leadCaptureEnabled}
                  onChange={checked => handleInputChange('leadCaptureEnabled', checked)}
                />
              </div>

              {formData.leadCaptureEnabled && (
                <>
                  <div className="my-8">
                    <Divider />
                  </div>

                  <div className="mb-8">
                    <Select
                      label={<span style={{ color: '#449de7' }}>When to capture leads</span>}
                      options={positionOptions}
                      value={formData.leadCapturePosition}
                      onChange={value => handleInputChange('leadCapturePosition', value)}
                    />
                  </div>

                  <Divider />

                  <div className="mt-8">
                    <div className="mb-4">
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        <span style={{ color: '#449de7' }}>Information to collect</span>
                      </Text>
                      <div className="mt-2">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Select which customer details you'd like to collect
                        </Text>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4">
                      {fieldOptions.map(field => (
                        <div 
                          key={field.value}
                          className="p-3 rounded-lg transition-all"
                          style={{
                            backgroundColor: formData.leadCaptureFields.includes(field.value) ? '#f0f9ff' : 'transparent'
                          }}
                        >
                          <Checkbox
                            label={field.label}
                            checked={formData.leadCaptureFields.includes(field.value)}
                            onChange={checked => handleArrayChange('leadCaptureFields', field.value, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        );

      case 3: // Review & Activate
        return (
          <div className="space-y-8">
            {!showPreview ? (
              <Card>
                <div className="text-center py-16 px-8 rounded-lg" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfeff 100%)' }}>
                  <div className="mb-4">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      <span style={{ color: '#449de7' }}>Ready to review your configuration</span>
                    </Text>
                  </div>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Generate a preview to see how your AI assistant will behave
                  </Text>
                  <div className="mt-8">
                    <Button 
                      primary 
                      size="large"
                      onClick={handleCompilePreview} 
                      loading={fetcher.state === 'submitting' || fetcher.state === 'loading'}
                    >
                      Generate Preview
                    </Button>
                  </div>
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
                  <div className="p-8">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      <span style={{ color: '#449de7' }}>Configuration Summary</span>
                    </Text>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-5 rounded-lg border-l-4 shadow-sm" style={{ backgroundColor: '#f0f9ff', borderLeftColor: '#449de7' }}>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          <span style={{ color: '#449de7' }}>Tone</span>
                        </Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{toneOptions.find(t => t.value === formData.tone)?.label}</Text>
                        </div>
                      </div>
                      <div className="p-5 rounded-lg border-l-4 shadow-sm" style={{ backgroundColor: '#ecfeff', borderLeftColor: '#3da7b1' }}>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          <span style={{ color: '#3da7b1' }}>Question Limit</span>
                        </Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{formData.questionLimit} questions</Text>
                        </div>
                      </div>
                      <div className="p-5 rounded-lg border-l-4 shadow-sm" style={{ backgroundColor: '#f0f9ff', borderLeftColor: '#449de7' }}>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          <span style={{ color: '#449de7' }}>Early Exit</span>
                        </Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{formData.earlyExit ? 'Enabled' : 'Disabled'}</Text>
                        </div>
                      </div>
                      <div className="p-5 rounded-lg border-l-4 shadow-sm" style={{ backgroundColor: '#ecfeff', borderLeftColor: '#3da7b1' }}>
                        <Text variant="headingSm" as="h4" fontWeight="semibold">
                          <span style={{ color: '#3da7b1' }}>Lead Capture</span>
                        </Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{formData.leadCaptureEnabled ? 'Enabled' : 'Disabled'}</Text>
                        </div>
                      </div>
                      {formData.leadCaptureEnabled && (
                        <>
                          <div className="p-5 rounded-lg border-l-4 shadow-sm" style={{ backgroundColor: '#f0f9ff', borderLeftColor: '#449de7' }}>
                            <Text variant="headingSm" as="h4" fontWeight="semibold">
                              <span style={{ color: '#449de7' }}>Capture Timing</span>
                            </Text>
                            <div className="mt-2">
                              <Text variant="bodyMd" as="p">{positionOptions.find(p => p.value === formData.leadCapturePosition)?.label}</Text>
                            </div>
                          </div>
                          <div className="p-5 rounded-lg border-l-4 shadow-sm" style={{ backgroundColor: '#ecfeff', borderLeftColor: '#3da7b1' }}>
                            <Text variant="headingSm" as="h4" fontWeight="semibold">
                              <span style={{ color: '#3da7b1' }}>Fields to Collect</span>
                            </Text>
                            <div className="mt-2">
                              <Text variant="bodyMd" as="p">{formData.leadCaptureFields.join(', ') || 'None'}</Text>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {formData.customQuestions.length > 0 && (
                      <>
                        <Divider />
                        <div className="mt-6">
                          <Text variant="headingSm" as="h4" fontWeight="semibold">
                            <span style={{ color: '#3da7b1' }}>Custom Questions ({formData.customQuestions.length})</span>
                          </Text>
                          <div className="mt-4 space-y-2">
                            {formData.customQuestions.map((question, index) => (
                              <div key={index} className="p-4 rounded-lg border-l-4 shadow-sm" style={{ backgroundColor: '#f0f9ff', borderLeftColor: '#449de7' }}>
                                <Text variant="bodyMd" as="p">
                                  <span style={{ color: '#449de7', fontWeight: '600' }}>{index + 1}.</span> {question}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="p-8">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      <span style={{ color: '#3da7b1' }}>Generated AI Prompt</span>
                    </Text>
                    <div className="mt-6 p-6 rounded-lg border-2 shadow-sm" style={{ backgroundColor: '#f0f9ff', borderColor: '#449de7' }}>
                      <Text variant="bodyMd" as="p" breakWord>
                        {compiledPrompt}
                      </Text>
                    </div>
                  </div>
                </Card>

                {activationSuccess ? (
                  <div className="flex gap-4 justify-end">
                    <Button onClick={() => window.location.href = '/app'} size="large">
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
                  <div className="flex gap-4 justify-end">
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
      <TitleBar 
        title="Prompt Builder"
        primaryAction={null}
        secondaryActions={[
          {
            content: 'Back to Dashboard',
            onAction: () => window.location.href = '/app'
          }
        ]}
      />
      <Layout>
        <Layout.Section>
          {/* Current Active Prompt Card */}
          {activePrompt && showCurrentPrompt && (
            <Card>
              <div className="p-8 border-l-8 rounded-lg" style={{ borderLeftColor: '#449de7', backgroundColor: '#f0f9ff' }}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Text variant="headingLg" as="h2" fontWeight="semibold">
                      <span style={{ color: '#449de7' }}>Current Active Prompt</span>
                    </Text>
                    <div className="mt-2">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Activated on {new Date(activePrompt.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </div>
                  </div>
                  <Button onClick={() => setShowCurrentPrompt(false)}>
                    Dismiss
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="p-5 bg-white rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: '#449de7' }}>
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span style={{ color: '#449de7' }}>Tone</span>
                    </Text>
                    <div className="mt-2">
                      <Text variant="bodyMd" as="p">
                        {toneOptions.find(t => t.value === activePrompt.runtimeRules.tone)?.label || activePrompt.runtimeRules.tone}
                      </Text>
                    </div>
                  </div>
                  <div className="p-5 bg-white rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: '#3da7b1' }}>
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span style={{ color: '#3da7b1' }}>Question Limit</span>
                    </Text>
                    <div className="mt-2">
                      <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.questionLimit} questions</Text>
                    </div>
                  </div>
                  <div className="p-5 bg-white rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: '#449de7' }}>
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span style={{ color: '#449de7' }}>Early Exit</span>
                    </Text>
                    <div className="mt-2">
                      <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.earlyExit ? 'Enabled' : 'Disabled'}</Text>
                    </div>
                  </div>
                  <div className="p-5 bg-white rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: '#3da7b1' }}>
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span style={{ color: '#3da7b1' }}>Lead Capture</span>
                    </Text>
                    <div className="mt-2">
                      <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.leadCapture?.enabled ? 'Enabled' : 'Disabled'}</Text>
                    </div>
                  </div>
                  {activePrompt.runtimeRules.customQuestions && activePrompt.runtimeRules.customQuestions.length > 0 && (
                    <div className="p-5 bg-white rounded-lg shadow-sm border-l-4 md:col-span-2" style={{ borderLeftColor: '#3da7b1' }}>
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        <span style={{ color: '#3da7b1' }}>Custom Questions</span>
                      </Text>
                      <div className="mt-2">
                        <Text variant="bodyMd" as="p">{activePrompt.runtimeRules.customQuestions.length} question(s)</Text>
                      </div>
                    </div>
                  )}
                </div>

                <Divider />

                <div className="mt-6 flex gap-4 flex-wrap">
                  <Button primary onClick={handleLoadCurrentPrompt}>
                    Load & Edit Settings
                  </Button>
                  <Button onClick={handleOpenAdvancedEditor}>
                    Edit Prompt Text Directly
                  </Button>
                  <Button onClick={() => window.location.href = '/app/admin/prompt/versions'}>
                    View All Versions
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Advanced Editor */}
          {showAdvancedEditor ? (
            <Card>
              <div className="p-8 border-l-8 rounded-lg" style={{ borderLeftColor: '#3da7b1', backgroundColor: '#ecfeff' }}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Text variant="headingLg" as="h2" fontWeight="semibold">
                      <span style={{ color: '#3da7b1' }}>Advanced Prompt Editor</span>
                    </Text>
                    <div className="mt-2">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Directly edit the AI prompt text. Changes will be saved and immediately applied to customer conversations.
                      </Text>
                    </div>
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

                <div className="mt-6">
                  <div className="mb-4">
                    <Text variant="headingSm" as="h4" fontWeight="semibold">
                      <span style={{ color: '#449de7' }}>Prompt Text</span>
                    </Text>
                    <div className="mt-1">
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Edit the complete AI system prompt below. Use markdown formatting for best results.
                      </Text>
                    </div>
                  </div>
                  
                  <textarea
                    value={advancedPromptText}
                    onChange={(e) => setAdvancedPromptText(e.target.value)}
                    className="w-full h-96 p-4 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:border-transparent"
                    placeholder="Enter your AI system prompt here..."
                    style={{
                      minHeight: '400px',
                      lineHeight: '1.6',
                      backgroundColor: '#ffffff',
                      border: '2px solid #3da7b1',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#449de7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(68, 157, 231, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#3da7b1';
                      e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                    }}
                  />
                  
                  <div className="mt-2 flex items-center gap-2">
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
                </div>

                <Divider />

                {activationSuccess ? (
                  <div className="mt-6 flex gap-4">
                    <Button onClick={() => window.location.href = '/app'} size="large">
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
                  <div className="mt-6 flex gap-4">
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
            <div className="p-8">
              {/* Clean progress bar */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <Text variant="bodyMd" as="p">
                    <span style={{ color: '#449de7', fontWeight: '600' }}>Step {currentStep + 1} of {steps.length}</span>
                  </Text>
                  <div className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#3da7b1', color: 'white' }}>
                    {Math.round((currentStep + 1) / steps.length * 100)}% complete
                  </div>
                </div>
                <div className="relative">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${(currentStep + 1) / steps.length * 100}%`,
                        background: 'linear-gradient(90deg, #449de7 0%, #3da7b1 100%)'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <Text variant="headingLg" as="h2" fontWeight="semibold">
                  <span style={{ color: '#449de7' }}>{steps[currentStep].title}</span>
                </Text>
                <div className="mt-2">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {steps[currentStep].description}
                  </Text>
                </div>
              </div>

              {renderStepContent()}
            </div>

            {/* Navigation buttons */}
            {currentStep < steps.length - 1 && (
              <div className="p-8 pt-0">
                <div className="flex justify-between gap-4">
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
              </div>
            )}
          </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
