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
import { handleAuthError, authenticatedFetch } from '~/lib/shopify/auth.client.js';

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
      const response = await authenticatedFetch(window.location.pathname, {
        method: 'POST',
        body: form
      });

      const result = await response.json();

      if (result.success) {
        setCompiledPrompt(result.compiledPrompt);
        setShowPreview(true);
      } else {
        console.error('Compilation failed:', result.error);
        if (result.error === 'Session expired or invalid') {
          // Auth error handled by authenticatedFetch
          return;
        }
      }
    } catch (error) {
      console.error('Error compiling preview:', error);
      if (!handleAuthError(error)) {
        // Handle other errors
        console.error('Unexpected error:', error);
      }
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
      const response = await authenticatedFetch(window.location.pathname, {
        method: 'POST',
        body: form
      });

      if (response.ok) {
        // Success - redirect or show success message
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Activation failed:', errorData.error);

        if (errorData.error === 'Session expired or invalid') {
          // Auth error handled by authenticatedFetch
          return;
        }
      }
    } catch (error) {
      console.error('Error activating prompt:', error);
      if (!handleAuthError(error)) {
        console.error('Unexpected error:', error);
      }
    } finally {
      setIsActivating(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Tone & Style
        return (
          <Card.Section>
            <FormLayout>
              <div className="space-y-4">
                {toneOptions.map(option => (
                  <div key={option.value} className="p-4 border rounded-lg">
                    <RadioButton
                      label={option.label}
                      checked={formData.tone === option.value}
                      onChange={() => handleInputChange('tone', option.value)}
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      {option.description}
                    </div>
                  </div>
                ))}
              </div>
            </FormLayout>
          </Card.Section>
        );

      case 1: // Question Limit
        return (
          <Card.Section>
            <FormLayout>
              <div className="space-y-6">
                <div>
                  <Text variant="headingMd" as="h3">
                    Question Limit: {formData.questionLimit}
                  </Text>
                  <div className="mt-2">
                    <RangeSlider
                      label="Maximum questions to ask"
                      labelHidden
                      value={formData.questionLimit}
                      onChange={value => handleInputChange('questionLimit', value)}
                      min={1}
                      max={6}
                      step={1}
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    The AI will ask up to {formData.questionLimit} question{formData.questionLimit > 1 ? 's' : ''} before making recommendations
                  </div>
                </div>

                <Checkbox
                  label="Allow early exit when enough information is gathered"
                  checked={formData.earlyExit}
                  onChange={checked => handleInputChange('earlyExit', checked)}
                />
              </div>
            </FormLayout>
          </Card.Section>
        );

      case 2: // Lead Capture
        return (
          <Card.Section>
            <FormLayout>
              <div className="space-y-6">
                <Checkbox
                  label="Enable lead capture"
                  checked={formData.leadCaptureEnabled}
                  onChange={checked => handleInputChange('leadCaptureEnabled', checked)}
                />

                {formData.leadCaptureEnabled && (
                  <>
                    <Select
                      label="Capture timing"
                      options={positionOptions}
                      value={formData.leadCapturePosition}
                      onChange={value => handleInputChange('leadCapturePosition', value)}
                    />

                    <div>
                      <Text variant="headingSm" as="h4">
                        Information to collect:
                      </Text>
                      <div className="mt-2 space-y-2">
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
            </FormLayout>
          </Card.Section>
        );

      case 3: // Review & Activate
        return (
          <Card.Section>
            <div className="space-y-6">
              {!showPreview ? (
                <div className="text-center py-8">
                  <Button onClick={handleCompilePreview} loading={navigation.state === 'submitting'}>
                    Generate Preview
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <Banner status="info">
                    <p>Here's how your AI assistant will behave:</p>
                  </Banner>

                  <Card>
                    <Card.Section>
                      <Text variant="headingSm" as="h4">
                        Configuration Summary:
                      </Text>
                      <div className="mt-3 space-y-2 text-sm">
                        <div><strong>Tone:</strong> {toneOptions.find(t => t.value === formData.tone)?.label}</div>
                        <div><strong>Question Limit:</strong> {formData.questionLimit}</div>
                        <div><strong>Early Exit:</strong> {formData.earlyExit ? 'Enabled' : 'Disabled'}</div>
                        <div><strong>Lead Capture:</strong> {formData.leadCaptureEnabled ? 'Enabled' : 'Disabled'}</div>
                        {formData.leadCaptureEnabled && (
                          <>
                            <div><strong>Capture Position:</strong> {formData.leadCapturePosition}</div>
                            <div><strong>Fields:</strong> {formData.leadCaptureFields.join(', ')}</div>
                          </>
                        )}
                        <div><strong>Max Recommendations:</strong> {formData.maxRecommendations}</div>
                      </div>
                    </Card.Section>
                  </Card>

                  <Card>
                    <Card.Section>
                      <Text variant="headingSm" as="h4">
                        Generated Prompt:
                      </Text>
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                        <Text variant="bodyMd" as="p">
                          {compiledPrompt}
                        </Text>
                      </div>
                    </Card.Section>
                  </Card>

                  <div className="flex gap-3 justify-end">
                    <Button onClick={() => goToStep(2)}>
                      Back to Settings
                    </Button>
                    <Button
                      primary
                      onClick={handleActivate}
                      loading={isActivating}
                    >
                      Save & Activate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card.Section>
        );

      default:
        return null;
    }
  };

  return (
    <Page
      title="Prompt Builder"
      subtitle="Configure your AI assistant's behavior"
      breadcrumbs={[
        { content: 'Home', url: '/app' }
      ]}
    >
      <Layout>
        <Layout.Section>
          {/* Progress indicator */}
          <Card>
            <Card.Section>
              <div className="mb-6">
                <ProgressBar
                  progress={(currentStep + 1) / steps.length * 100}
                  size="small"
                />
              </div>

              <div className="flex justify-between mb-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex-1 text-center cursor-pointer ${
                      index === currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}
                    onClick={() => goToStep(index)}
                  >
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm ${
                      index === currentStep ? 'bg-blue-100 text-blue-600' :
                      index < currentStep ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  </div>
                ))}
              </div>
            </Card.Section>
          </Card>

          {/* Step content */}
          <Card>
            <Card.Section>
              <div className="mb-6">
                <Text variant="headingLg" as="h2">
                  {steps[currentStep].title}
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  {steps[currentStep].description}
                </Text>
              </div>

              {renderStepContent()}
            </Card.Section>

            {/* Navigation buttons */}
            {currentStep < steps.length - 1 && (
              <Card.Section>
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
              </Card.Section>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
