import { json, redirect } from '@remix-run/node';
import { useState, useEffect } from 'react';
import { useLoaderData, useActionData, useNavigation, Form } from '@remix-run/react';
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
import { createCompiledPrompt } from '~/lib/domain/runtimeRules';

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
  await authenticate.admin(request);
  return json({
    steps: STEPS,
    toneOptions: TONE_OPTIONS,
    positionOptions: POSITION_OPTIONS,
    fieldOptions: FIELD_OPTIONS
  });
}

// Action function
export async function action({ request }) {
  const auth = await authenticate.admin(request);

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
          maxRecommendations: parseInt(formData.get('maxRecommendations'))
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
      // Redirect to activation endpoint
      const activationUrl = new URL('/admin/prompt/activate', request.url);

      // Forward all form data to the activation endpoint
      const form = new FormData();
      for (const [key, value] of formData.entries()) {
        if (key !== 'step') {
          form.append(key, value);
        }
      }

      // This will be handled by the activation endpoint
      const response = await fetch(activationUrl, {
        method: 'POST',
        body: form,
        headers: {
          'Authorization': request.headers.get('Authorization'),
          'X-Shopify-Shop-Domain': request.headers.get('X-Shopify-Shop-Domain')
        }
      });

      return response;
    }
  }

  return json({ error: 'Invalid request' }, { status: 400 });
}

// Main component
export default function PromptBuilder() {
  const { steps, toneOptions, positionOptions, fieldOptions } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    tone: 'friendly',
    questionLimit: 3,
    earlyExit: false,
    leadCaptureEnabled: false,
    leadCapturePosition: 'end',
    leadCaptureFields: [],
    maxRecommendations: 3
  });
  const [compiledPrompt, setCompiledPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

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

  // Navigate between steps
  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      setShowPreview(false);
    }
  };

  // Compile preview
  const handleCompilePreview = async () => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => form.append(key, item));
      } else {
        form.append(key, value.toString());
      }
    });
    form.append('step', 'compile');

    try {
      const response = await fetch(window.location.pathname, {
        method: 'POST',
        body: form
      });

      const result = await response.json();

      if (result.success) {
        setCompiledPrompt(result.compiledPrompt);
        setShowPreview(true);
      } else {
        console.error('Compilation failed:', result.error);
      }
    } catch (error) {
      console.error('Error compiling preview:', error);
    }
  };

  // Activate prompt
  const handleActivate = async () => {
    setIsActivating(true);

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
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
          <FormLayout>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toneOptions.map(option => (
                <div
                  key={option.value}
                  onClick={() => handleInputChange('tone', option.value)}
                  className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.tone === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioButton
                      label=""
                      checked={formData.tone === option.value}
                      onChange={() => handleInputChange('tone', option.value)}
                    />
                    <div className="flex-1">
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        {option.label}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        {option.description}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FormLayout>
        );

      case 1: // Question Limit
        return (
          <FormLayout>
            <Card>
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
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
                  <Text variant="bodyMd" as="p" tone="subdued">
                    The AI will ask up to {formData.questionLimit} question{formData.questionLimit > 1 ? 's' : ''} before making mattress recommendations
                  </Text>
                </div>

                <Divider />

                <div className="mt-6">
                  <Checkbox
                    label="Allow early exit when enough information is gathered"
                    helpText="The AI can skip remaining questions if it has sufficient information to make accurate recommendations"
                    checked={formData.earlyExit}
                    onChange={checked => handleInputChange('earlyExit', checked)}
                  />
                </div>
              </div>
            </Card>
          </FormLayout>
        );

      case 2: // Lead Capture
        return (
          <FormLayout>
            <Card>
              <div className="p-6">
                <Checkbox
                  label="Enable lead capture"
                  helpText="Collect customer information during or after the conversation"
                  checked={formData.leadCaptureEnabled}
                  onChange={checked => handleInputChange('leadCaptureEnabled', checked)}
                />

                {formData.leadCaptureEnabled && (
                  <>
                    <Divider />

                    <div className="mt-6">
                      <Select
                        label="When to capture leads"
                        options={positionOptions}
                        value={formData.leadCapturePosition}
                        onChange={value => handleInputChange('leadCapturePosition', value)}
                      />
                    </div>

                    <Divider />

                    <div className="mt-6">
                      <Text variant="headingSm" as="h4" fontWeight="semibold">
                        Information to collect
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Select which customer details you'd like to collect
                      </Text>
                      <div className="mt-4 space-y-3">
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
          </FormLayout>
        );

      case 3: // Review & Activate
        return (
          <div className="space-y-6">
            {!showPreview ? (
              <div className="text-center py-12">
                <Text variant="headingMd" as="h3" fontWeight="semibold">
                  Ready to review your configuration
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Generate a preview to see how your AI assistant will behave
                </Text>
                <div className="mt-6">
                  <Button 
                    primary 
                    size="large"
                    onClick={handleCompilePreview} 
                    loading={navigation.state === 'submitting'}
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
                  <div className="p-6">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      Configuration Summary
                    </Text>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Tone</Text>
                        <Text variant="bodyMd" as="p">{toneOptions.find(t => t.value === formData.tone)?.label}</Text>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Question Limit</Text>
                        <Text variant="bodyMd" as="p">{formData.questionLimit} questions</Text>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Early Exit</Text>
                        <Text variant="bodyMd" as="p">{formData.earlyExit ? 'Enabled' : 'Disabled'}</Text>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Text variant="headingSm" as="h4" fontWeight="semibold">Lead Capture</Text>
                        <Text variant="bodyMd" as="p">{formData.leadCaptureEnabled ? 'Enabled' : 'Disabled'}</Text>
                      </div>
                      {formData.leadCaptureEnabled && (
                        <>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <Text variant="headingSm" as="h4" fontWeight="semibold">Capture Timing</Text>
                            <Text variant="bodyMd" as="p">{positionOptions.find(p => p.value === formData.leadCapturePosition)?.label}</Text>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <Text variant="headingSm" as="h4" fontWeight="semibold">Fields to Collect</Text>
                            <Text variant="bodyMd" as="p">{formData.leadCaptureFields.join(', ') || 'None'}</Text>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      Generated AI Prompt
                    </Text>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Text variant="bodyMd" as="p" breakWord>
                        {compiledPrompt}
                      </Text>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3 justify-end">
                  <Button onClick={() => goToStep(2)}>
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
            <div>
              {/* Clean progress bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
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

              <div className="mb-6">
                <Text variant="headingLg" as="h2" fontWeight="semibold">
                  {steps[currentStep].title}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  {steps[currentStep].description}
                </Text>
              </div>

              {renderStepContent()}
            </div>

            {/* Navigation buttons */}
            {currentStep < steps.length - 1 && (
              <div>
                <div className="flex justify-between">
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
