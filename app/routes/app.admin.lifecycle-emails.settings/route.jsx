import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useSubmit, useActionData } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Checkbox,
  Layout
} from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { PrismaClient } from '@prisma/client';
import { updateGlobalSettings, sendLifecycleEmail } from '~/lib/lifecycle-emails/lifecycle-email.service.server';

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    // Get global settings
    let settings = await prisma.lifecycleEmailSettings.findFirst({
      where: { tenantId: null }
    });
    
    // Create default if doesn't exist
    if (!settings) {
      settings = await prisma.lifecycleEmailSettings.create({
        data: {
          tenantId: null,
          teamEmails: JSON.stringify(['team@mattressai.com']),
          replyToEmail: 'support@mattressai.com',
          enabled: true
        }
      });
    }
    
    await prisma.$disconnect();
    
    return json({
      settings: {
        teamEmails: JSON.parse(settings.teamEmails).join(', '),
        replyToEmail: settings.replyToEmail || '',
        enabled: settings.enabled
      },
      success: true
    });
  } catch (error) {
    console.error('[LifecycleEmailSettings] Loader error:', error);
    await prisma.$disconnect();
    return json({ settings: null, error: error.message }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get('_action');
    
    if (action === 'save') {
      const teamEmailsString = formData.get('teamEmails');
      const teamEmails = teamEmailsString
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      
      const replyToEmail = formData.get('replyToEmail');
      const enabled = formData.get('enabled') === 'true';
      
      await updateGlobalSettings({
        teamEmails,
        replyToEmail,
        enabled
      });
      
      return json({
        success: true,
        message: 'Settings saved successfully'
      });
    } else if (action === 'test') {
      const { shop } = await authenticate.admin(request);
      const testEmail = formData.get('testEmail');
      
      if (!testEmail) {
        return json({ error: 'Test email is required' }, { status: 400 });
      }
      
      // Send a test email
      try {
        const result = await sendLifecycleEmail('app_installed', shop, {
          merchantName: 'Test User',
          shopDomain: shop,
          planName: 'Pro',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          loginUrl: `https://${shop}/admin/apps/mattressai`,
          supportEmail: formData.get('replyToEmail') || 'support@mattressai.com'
        });
        
        if (result.success) {
          return json({
            success: true,
            message: `Test email sent to ${testEmail}`
          });
        } else {
          return json({
            error: `Failed to send test email: ${result.errors?.join(', ')}`
          }, { status: 500 });
        }
      } catch (error) {
        return json({
          error: `Test email failed: ${error.message}`
        }, { status: 500 });
      }
    }
    
    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[LifecycleEmailSettings] Action error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function LifecycleEmailSettingsPage() {
  const { settings, error: loaderError } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const submit = useSubmit();
  
  const [teamEmails, setTeamEmails] = useState(settings?.teamEmails || '');
  const [replyToEmail, setReplyToEmail] = useState(settings?.replyToEmail || '');
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);
  const [testEmail, setTestEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  useEffect(() => {
    if (actionData) {
      setIsSaving(false);
      setIsTesting(false);
    }
  }, [actionData]);
  
  const handleSave = () => {
    setIsSaving(true);
    const data = new FormData();
    data.append('_action', 'save');
    data.append('teamEmails', teamEmails);
    data.append('replyToEmail', replyToEmail);
    data.append('enabled', enabled.toString());
    
    submit(data, { method: 'post' });
  };
  
  const handleTest = () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }
    
    setIsTesting(true);
    const data = new FormData();
    data.append('_action', 'test');
    data.append('testEmail', testEmail);
    data.append('replyToEmail', replyToEmail);
    
    submit(data, { method: 'post' });
  };
  
  return (
    <Page
      title="Lifecycle Email Settings"
      subtitle="Configure global settings for lifecycle email automations"
      backAction={{ onAction: () => navigate('/app/admin/lifecycle-emails') }}
    >
      <Layout>
        {loaderError && (
          <Layout.Section>
            <Banner status="critical" title="Error loading settings">
              <p>{loaderError}</p>
            </Banner>
          </Layout.Section>
        )}
        
        {actionData?.success && (
          <Layout.Section>
            <Banner status="success" title="Success">
              <p>{actionData.message}</p>
            </Banner>
          </Layout.Section>
        )}
        
        {actionData?.error && (
          <Layout.Section>
            <Banner status="critical" title="Error">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        )}
        
        <Layout.Section>
          <Card>
            <FormLayout>
              <Checkbox
                label="Enable lifecycle emails"
                checked={enabled}
                onChange={setEnabled}
                helpText="When disabled, no lifecycle emails will be sent"
              />
              
              <TextField
                label="Team Email Addresses"
                value={teamEmails}
                onChange={setTeamEmails}
                helpText="Comma-separated list of email addresses to receive internal notifications"
                placeholder="team@mattressai.com, sales@mattressai.com"
                autoComplete="off"
              />
              
              <TextField
                label="Reply-To Email"
                value={replyToEmail}
                onChange={setReplyToEmail}
                helpText="Email address that merchants can reply to"
                placeholder="support@mattressai.com"
                type="email"
                autoComplete="off"
              />
              
              <Button
                primary
                onClick={handleSave}
                loading={isSaving}
              >
                Save Settings
              </Button>
            </FormLayout>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card title="Test Email">
            <FormLayout>
              <TextField
                label="Send Test Email To"
                value={testEmail}
                onChange={setTestEmail}
                placeholder="your-email@example.com"
                type="email"
                autoComplete="off"
                helpText="Sends a test 'app_installed' email to verify your configuration"
              />
              
              <Button
                onClick={handleTest}
                loading={isTesting}
              >
                Send Test Email
              </Button>
            </FormLayout>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card title="Environment Variables">
            <FormLayout>
              <p><strong>SENDGRID_API_KEY</strong>: {process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Not set'}</p>
              <p><strong>SENDGRID_FROM_EMAIL</strong>: {process.env.SENDGRID_FROM_EMAIL || 'alerts@mattressai.app (default)'}</p>
              <p><strong>LIFECYCLE_EMAILS_FROM_NAME</strong>: {process.env.LIFECYCLE_EMAILS_FROM_NAME || 'MattressAI Team (default)'}</p>
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

