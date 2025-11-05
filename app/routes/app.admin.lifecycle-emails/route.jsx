import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import {
  Page,
  Card,
  DataTable,
  Badge,
  Button,
  TextField,
  FormLayout,
  Modal,
  TextContainer,
  Banner,
  Checkbox,
  Layout
} from '@shopify/polaris';
import { useState } from 'react';
import { getAllTemplates, updateTemplate } from '~/lib/lifecycle-emails/lifecycle-email.service.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    const templates = await getAllTemplates();
    
    return json({
      templates: templates.map(t => ({
        id: t.id,
        eventType: t.eventType,
        merchantSubject: t.merchantSubject,
        merchantBody: t.merchantBody,
        teamSubject: t.teamSubject,
        teamBody: t.teamBody,
        enabled: t.enabled,
        sendToMerchant: t.sendToMerchant,
        sendToTeam: t.sendToTeam,
        updatedAt: t.updatedAt.toISOString()
      })),
      success: true
    });
  } catch (error) {
    console.error('[LifecycleEmails] Loader error:', error);
    return json({ templates: [], error: error.message }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get('_action');
    
    if (action === 'update') {
      const eventType = formData.get('eventType');
      const data = {
        merchantSubject: formData.get('merchantSubject') || undefined,
        merchantBody: formData.get('merchantBody') || undefined,
        teamSubject: formData.get('teamSubject') || undefined,
        teamBody: formData.get('teamBody') || undefined,
        enabled: formData.get('enabled') === 'true',
        sendToMerchant: formData.get('sendToMerchant') === 'true',
        sendToTeam: formData.get('sendToTeam') === 'true'
      };
      
      await updateTemplate(eventType, data);
      
      return json({ success: true, message: 'Template updated successfully' });
    }
    
    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[LifecycleEmails] Action error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function LifecycleEmailsPage() {
  const { templates, error } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  
  const [editModalActive, setEditModalActive] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  
  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      eventType: template.eventType,
      merchantSubject: template.merchantSubject,
      merchantBody: template.merchantBody,
      teamSubject: template.teamSubject || '',
      teamBody: template.teamBody || '',
      enabled: template.enabled,
      sendToMerchant: template.sendToMerchant,
      sendToTeam: template.sendToTeam
    });
    setEditModalActive(true);
  };
  
  const handleSave = () => {
    const data = new FormData();
    data.append('_action', 'update');
    data.append('eventType', formData.eventType);
    data.append('merchantSubject', formData.merchantSubject);
    data.append('merchantBody', formData.merchantBody);
    data.append('teamSubject', formData.teamSubject);
    data.append('teamBody', formData.teamBody);
    data.append('enabled', formData.enabled.toString());
    data.append('sendToMerchant', formData.sendToMerchant.toString());
    data.append('sendToTeam', formData.sendToTeam.toString());
    
    submit(data, { method: 'post' });
    setEditModalActive(false);
  };
  
  const eventTypeLabels = {
    app_installed: 'App Installed',
    app_uninstalled: 'App Uninstalled',
    trial_started: 'Trial Started',
    trial_ending_soon: 'Trial Ending Soon',
    trial_ended: 'Trial Ended',
    plan_upgraded: 'Plan Upgraded',
    plan_downgraded: 'Plan Downgraded',
    subscription_cancelled: 'Subscription Cancelled',
    subscription_expired: 'Subscription Expired',
    payment_failed: 'Payment Failed'
  };
  
  const rows = templates.map((template) => [
    eventTypeLabels[template.eventType] || template.eventType,
    template.enabled ? (
      <Badge status="success">Enabled</Badge>
    ) : (
      <Badge status="critical">Disabled</Badge>
    ),
    template.sendToMerchant ? 'Yes' : 'No',
    template.sendToTeam ? 'Yes' : 'No',
    new Date(template.updatedAt).toLocaleDateString(),
    <Button size="slim" onClick={() => handleEdit(template)}>
      Edit
    </Button>
  ]);
  
  return (
    <Page
      title="Lifecycle Email Templates"
      subtitle="Manage automated email templates for merchant lifecycle events"
      secondaryActions={[
        {
          content: 'Email Settings',
          onAction: () => navigate('/app/admin/lifecycle-emails/settings')
        },
        {
          content: 'Email Logs',
          onAction: () => navigate('/app/admin/lifecycle-emails/logs')
        }
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical" title="Error loading templates">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}
        
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={['Event Type', 'Status', 'To Merchant', 'To Team', 'Last Updated', 'Actions']}
              rows={rows}
            />
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card title="Available Variables">
            <TextContainer>
              <p>Use these variables in your email templates (they'll be replaced with actual values):</p>
              <ul>
                <li><code>{'{{merchantName}}'}</code> - Merchant's first name</li>
                <li><code>{'{{shopDomain}}'}</code> - Store domain</li>
                <li><code>{'{{planName}}'}</code> - Current plan name</li>
                <li><code>{'{{trialEndsAt}}'}</code> - Trial end date</li>
                <li><code>{'{{loginUrl}}'}</code> - Login URL</li>
                <li><code>{'{{upgradeUrl}}'}</code> - Plans page URL</li>
                <li><code>{'{{supportEmail}}'}</code> - Support email</li>
              </ul>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
      
      {selectedTemplate && (
        <Modal
          open={editModalActive}
          onClose={() => setEditModalActive(false)}
          title={`Edit: ${eventTypeLabels[selectedTemplate.eventType]}`}
          primaryAction={{
            content: 'Save',
            onAction: handleSave
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setEditModalActive(false)
            }
          ]}
          large
        >
          <Modal.Section>
            <FormLayout>
              <Checkbox
                label="Enable this template"
                checked={formData.enabled}
                onChange={(value) => setFormData({ ...formData, enabled: value })}
              />
              
              <Checkbox
                label="Send to merchant"
                checked={formData.sendToMerchant}
                onChange={(value) => setFormData({ ...formData, sendToMerchant: value })}
              />
              
              {formData.sendToMerchant && (
                <>
                  <TextField
                    label="Merchant Email Subject"
                    value={formData.merchantSubject}
                    onChange={(value) => setFormData({ ...formData, merchantSubject: value })}
                    autoComplete="off"
                  />
                  
                  <TextField
                    label="Merchant Email Body (HTML)"
                    value={formData.merchantBody}
                    onChange={(value) => setFormData({ ...formData, merchantBody: value })}
                    multiline={8}
                    autoComplete="off"
                  />
                </>
              )}
              
              <Checkbox
                label="Send to team"
                checked={formData.sendToTeam}
                onChange={(value) => setFormData({ ...formData, sendToTeam: value })}
              />
              
              {formData.sendToTeam && (
                <>
                  <TextField
                    label="Team Email Subject"
                    value={formData.teamSubject}
                    onChange={(value) => setFormData({ ...formData, teamSubject: value })}
                    autoComplete="off"
                  />
                  
                  <TextField
                    label="Team Email Body (HTML)"
                    value={formData.teamBody}
                    onChange={(value) => setFormData({ ...formData, teamBody: value })}
                    multiline={8}
                    autoComplete="off"
                  />
                </>
              )}
            </FormLayout>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}

