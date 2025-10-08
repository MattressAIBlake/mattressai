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
  const { session } = await authenticate.admin(request);
  return json({
    steps: STEPS,
    toneOptions: TONE_OPTIONS,
    positionOptions: POSITION_OPTIONS,
    fieldOptions: FIELD_OPTIONS,
    shop: session.shop
  });
}

// Action function
export async function action({ request }) {
  const { session } = await authenticate.admin(request);

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

        // Create and activate the prompt version
        const promptVersion = await createPromptVersion({
          tenant: shop,
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
  }

  return json({ error: 'Invalid request' }, { status: 400 });
}

// Main component
export default function PromptBuilder() {
  const { steps, toneOptions, positionOptions, fieldOptions } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const fetcher = useFetcher();

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
  const [isActivating, setIsActivating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data && fetcher.data.success && fetcher.data.compiledPrompt) {
      setCompiledPrompt(fetcher.data.compiledPrompt);
      setShowPreview(true);
    } else if (fetcher.data && !fetcher.data.success) {
      console.error('Compilation failed:', fetcher.data.error);
    }
  }, [fetcher.data]);

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
  const handleActivate = async () => {
    setIsActivating(true);

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

    try {
      const response = await fetch(window.location.pathname, {
        method: 'POST',
        body: form
      });

      if (response.ok) {
        // Success - redirect or show success message
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Activation failed:', errorData.error);
      }
    } catch (error) {
      console.error('Error activating prompt:', error);
    } finally {
      setIsActivating(false);
    }
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
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
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
                          {option.label}
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
                    Maximum Questions
                  </Text>
                  <Badge tone="info">{formData.questionLimit} question{formData.questionLimit > 1 ? 's' : ''}</Badge>
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
                        Advanced: Custom Questions
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
                  <div className="mt-5 p-6 bg-gray-50 rounded-lg border border-gray-200">
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
                            <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <Text variant="bodyMd" as="p">
                                  {index + 1}. {question}
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
              <Checkbox
                label="Enable lead capture"
                helpText="Collect customer information during or after the conversation"
                checked={formData.leadCaptureEnabled}
                onChange={checked => handleInputChange('leadCaptureEnabled', checked)}
              />

              {formData.leadCaptureEnabled && (
                <>
                  <div className="my-8">
                    <Divider />
                  </div>

                  <div className="mb-8">
                    <Select
                      label="When to capture leads"
                      options={positionOptions}
                      value={formData.leadCapturePosition}
                      onChange={value => handleInputChange('leadCapturePosition', value)}
                    />
                  </div>

                  <Divider />

                  <div className="mt-8">
                    <div className="mb-4">
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        Information to collect
                      </Text>
                      <div className="mt-2">
                        <Text variant="bodyMd" as="p" tone="subdued">
                          Select which customer details you'd like to collect
                        </Text>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4">
                      {fieldOptions.map(field => (
                        <Checkbox
                          key={field.value}
                          label={field.label}
                          checked={formData.leadCaptureFields.includes(field.value)}
                          onChange={checked => handleArrayChange('leadCaptureFields', field.value, checked)}
                        />
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
              <div className="text-center py-16">
                <div className="mb-4">
                  <Text variant="headingMd" as="h3" fontWeight="semibold">
                    Ready to review your configuration
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
            ) : (
              <>
                <Banner tone="success">
                  <p><strong>Configuration Ready!</strong> Review your settings below and activate when ready.</p>
                </Banner>

                <Card>
                  <div className="p-8">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      Configuration Summary
                    </Text>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-5 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Tone</Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{toneOptions.find(t => t.value === formData.tone)?.label}</Text>
                        </div>
                      </div>
                      <div className="p-5 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Question Limit</Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{formData.questionLimit} questions</Text>
                        </div>
                      </div>
                      <div className="p-5 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Early Exit</Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{formData.earlyExit ? 'Enabled' : 'Disabled'}</Text>
                        </div>
                      </div>
                      <div className="p-5 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Lead Capture</Text>
                        <div className="mt-2">
                          <Text variant="bodyMd" as="p">{formData.leadCaptureEnabled ? 'Enabled' : 'Disabled'}</Text>
                        </div>
                      </div>
                      {formData.leadCaptureEnabled && (
                        <>
                          <div className="p-5 bg-gray-50 rounded-lg">
                            <Text variant="headingSm" as="h4" fontWeight="semibold">Capture Timing</Text>
                            <div className="mt-2">
                              <Text variant="bodyMd" as="p">{positionOptions.find(p => p.value === formData.leadCapturePosition)?.label}</Text>
                            </div>
                          </div>
                          <div className="p-5 bg-gray-50 rounded-lg">
                            <Text variant="headingSm" as="h4" fontWeight="semibold">Fields to Collect</Text>
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
                            Custom Questions ({formData.customQuestions.length})
                          </Text>
                          <div className="mt-4 space-y-2">
                            {formData.customQuestions.map((question, index) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                <Text variant="bodyMd" as="p">
                                  {index + 1}. {question}
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
                      Generated AI Prompt
                    </Text>
                    <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <Text variant="bodyMd" as="p" breakWord>
                        {compiledPrompt}
                      </Text>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4 justify-end">
                  <Button onClick={() => goToStep(2)} size="large">
                    Back to Settings
                  </Button>
                  <Button
                    primary
                    size="large"
                    onClick={handleActivate}
                    loading={isActivating}
                  >
                    Save & Activate
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Page
      title="Prompt Builder"
      subtitle="Configure your AI assistant's behavior and conversation flow"
      breadcrumbs={[
        { content: 'Home', url: '/app' }
      ]}
    >
      <Layout>
        <Layout.Section>
          {/* Step content */}
          <Card>
            <div className="p-8">
              {/* Clean progress bar */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Step {currentStep + 1} of {steps.length}
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {Math.round((currentStep + 1) / steps.length * 100)}% complete
                  </Text>
                </div>
                <ProgressBar
                  progress={(currentStep + 1) / steps.length * 100}
                  size="medium"
                />
              </div>

              <div className="mb-8">
                <Text variant="headingLg" as="h2" fontWeight="semibold">
                  {steps[currentStep].title}
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
        </Layout.Section>
      </Layout>
    </Page>
  );
}
