import { json } from '@remix-run/node';
import { authenticateAdmin } from '~/lib/shopify/auth.server';
import { 
  getOrCreateAlertSettings, 
  updateAlertSettings,
  sendTestAlert 
} from '~/lib/alerts/alert.service.server';

/**
 * GET /admin/alerts/settings
 * Returns alert settings for the tenant
 */
export const loader = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    const settings = await getOrCreateAlertSettings(shop);

    return json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching alert settings:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

/**
 * POST /admin/alerts/settings
 * Update alert settings or send test alert
 */
export const action = async ({ request }) => {
  try {
    const auth = await authenticateAdmin(request);
    const { shop } = auth;

    if (request.method !== 'POST') {
      throw json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await request.json();
    const { action: actionType } = body;

    // Handle test alert
    if (actionType === 'test') {
      const { channel, config } = body;

      if (!channel) {
        return json(
          { error: 'channel is required for test alerts' },
          { status: 400 }
        );
      }

      await sendTestAlert(shop, channel, config || {});

      return json({
        success: true,
        message: 'Test alert sent'
      });
    }

    // Handle settings update
    const { triggers, channels, quietHours, digest } = body;

    const settings = await updateAlertSettings(shop, {
      triggers,
      channels,
      quietHours,
      digest
    });

    return json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error updating alert settings:', error);

    if (error.status) {
      return error;
    }

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

