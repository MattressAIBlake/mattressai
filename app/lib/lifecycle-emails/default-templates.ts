/**
 * Default Email Templates for Lifecycle Events
 * Professional, mobile-responsive HTML templates with MattressAI branding
 */

export interface EmailTemplate {
  eventType: string;
  merchantSubject: string;
  merchantBody: string;
  teamSubject: string;
  teamBody: string;
  sendToMerchant: boolean;
  sendToTeam: boolean;
}

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  color: #333;
`;

const HEADER_STYLES = `
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  border-radius: 8px 8px 0 0;
  text-align: center;
`;

const CONTENT_STYLES = `
  background: #ffffff;
  padding: 30px 20px;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
`;

const BUTTON_STYLES = `
  display: inline-block;
  background: #667eea;
  color: white !important;
  padding: 14px 30px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin: 20px 0;
`;

const FOOTER_STYLES = `
  background: #f8f8f8;
  padding: 20px;
  border-radius: 0 0 8px 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
  font-size: 12px;
  color: #666;
`;

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    eventType: 'app_installed',
    merchantSubject: '🎉 Welcome to MattressAI - Let\'s Get Started!',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Welcome to MattressAI!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your AI-powered shopping assistant is ready</p>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for installing MattressAI! We're excited to help you provide an amazing shopping experience for your customers.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>What happens next:</strong>
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>We're indexing your product catalog (this takes a few minutes)</li>
            <li>Your AI chat widget is being activated on your storefront</li>
            <li>You're on the <strong>{{planName}}</strong> plan with a 14-day trial</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="{{loginUrl}}" style="${BUTTON_STYLES}">
              Complete Your Setup
            </a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Need help?</strong> Our team is here for you at {{supportEmail}}
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Intelligent Product Recommendations</p>
          <p style="margin: 10px 0 0 0;">Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '🎉 New Installation: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 24px;">New App Installation</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Merchant:</strong> {{merchantName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Plan:</strong> {{planName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Trial Ends:</strong> {{trialEndsAt}}</p>
          
          <div style="text-align: center;">
            <a href="{{loginUrl}}" style="${BUTTON_STYLES}">
              View in Admin
            </a>
          </div>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  },
  
  {
    eventType: 'app_uninstalled',
    merchantSubject: 'Sorry to see you go - MattressAI',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">We'll Miss You</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We noticed you've uninstalled MattressAI from your store. We're sorry to see you go!
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Your data will be retained for 30 days</strong> in case you change your mind. After that, all data will be permanently deleted per our privacy policy.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            If you had any issues or feedback, we'd love to hear from you at {{supportEmail}}
          </p>
          
          <div style="text-align: center;">
            <a href="{{reinstallUrl}}" style="${BUTTON_STYLES}">
              Reinstall MattressAI
            </a>
          </div>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Thank you for trying MattressAI</p>
        </div>
      </div>
    `,
    teamSubject: '⚠️ Uninstall: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #f44336; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">App Uninstalled</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Merchant:</strong> {{merchantName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Was on Plan:</strong> {{planName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Reason:</strong> {{reason}}</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Follow up within 24 hours to understand why they left and see if we can win them back.
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: false,
    sendToTeam: true
  },
  
  {
    eventType: 'trial_started',
    merchantSubject: '🚀 Your 14-Day Trial Has Started - MattressAI',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Your Trial is Live!</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your 14-day free trial of MattressAI has officially started. Here's what you get:
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>AI-powered product recommendations</li>
            <li>Intelligent lead capture</li>
            <li>Real-time analytics dashboard</li>
            <li>Unlimited customer conversations</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Trial ends:</strong> {{trialEndsAt}}
          </p>
          
          <div style="text-align: center;">
            <a href="{{loginUrl}}" style="${BUTTON_STYLES}">
              View Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            No credit card required during trial. Cancel anytime.
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '📊 Trial Started: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 24px;">Trial Started</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Trial Ends:</strong> {{trialEndsAt}}</p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: false
  },
  
  {
    eventType: 'trial_ending_soon',
    merchantSubject: '⏰ Your Trial Ends in 3 Days - Upgrade to Keep Your AI Assistant',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Trial Ending Soon</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your 14-day trial ends in <strong>3 days</strong> on {{trialEndsAt}}.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Your results so far:</strong>
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>{{sessionCount}} customer conversations</li>
            <li>{{leadCount}} leads captured</li>
            <li>{{conversionRate}}% conversion rate</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Don't lose your AI shopping assistant! Upgrade now to continue delighting your customers.
          </p>
          
          <div style="text-align: center;">
            <a href="{{upgradeUrl}}" style="${BUTTON_STYLES}">
              Upgrade Now - Starting at $29/mo
            </a>
          </div>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '⏰ Trial Ending Soon: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #ff9800; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Trial Ending in 3 Days</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Trial Ends:</strong> {{trialEndsAt}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Sessions:</strong> {{sessionCount}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Leads:</strong> {{leadCount}}</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Reach out to help with upgrade decision.
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  },
  
  {
    eventType: 'trial_ended',
    merchantSubject: 'Your Trial Has Ended - Thanks for Trying MattressAI',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Trial Ended</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your 14-day trial of MattressAI has ended. Your AI assistant is now paused.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Ready to upgrade?</strong> Choose the plan that's right for you:
          </p>
          
          <div style="background: #f8f8f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>Starter:</strong> $29/mo</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Perfect for small stores</p>
          </div>
          
          <div style="background: #f8f8f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>Pro:</strong> $49/mo</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Advanced features + SMS alerts</p>
          </div>
          
          <div style="text-align: center;">
            <a href="{{upgradeUrl}}" style="${BUTTON_STYLES}">
              Choose Your Plan
            </a>
          </div>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '⏰ Trial Expired: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #f44336; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Trial Expired</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Expired:</strong> {{trialEndsAt}}</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Follow up to convert to paid plan.
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  },
  
  {
    eventType: 'plan_upgraded',
    merchantSubject: '🎊 Welcome to {{planName}} - MattressAI',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Upgrade Successful!</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for upgrading to the <strong>{{planName}}</strong> plan! Your new features are now active.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>What's included:</strong>
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>{{tokensPerMonth}} tokens per month</li>
            <li>{{alertsPerHour}} alerts per hour</li>
            <li>{{vectorQueries}} vector queries</li>
            <li>{{indexJobs}} index jobs per month</li>
            {{#if smsEnabled}}<li>✓ SMS notifications</li>{{/if}}
            {{#if prioritySupport}}<li>✓ Priority support</li>{{/if}}
          </ul>
          
          <div style="text-align: center;">
            <a href="{{loginUrl}}" style="${BUTTON_STYLES}">
              View Dashboard
            </a>
          </div>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '💰 Plan Upgraded: {{shopDomain}} → {{planName}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #4caf50; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Plan Upgraded</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>New Plan:</strong> {{planName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Previous Plan:</strong> {{previousPlan}}</p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  },
  
  {
    eventType: 'plan_downgraded',
    merchantSubject: 'Plan Changed - MattressAI',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Plan Updated</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your plan has been changed to <strong>{{planName}}</strong>.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your new plan includes:
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>{{tokensPerMonth}} tokens per month</li>
            <li>{{alertsPerHour}} alerts per hour</li>
            <li>{{vectorQueries}} vector queries</li>
            <li>{{indexJobs}} index jobs per month</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Need more? You can upgrade anytime.
          </p>
          
          <div style="text-align: center;">
            <a href="{{upgradeUrl}}" style="${BUTTON_STYLES}">
              View Plans
            </a>
          </div>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '📉 Plan Downgraded: {{shopDomain}} → {{planName}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #ff9800; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Plan Downgraded</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>New Plan:</strong> {{planName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Previous Plan:</strong> {{previousPlan}}</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Follow up to understand why they downgraded.
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  },
  
  {
    eventType: 'subscription_cancelled',
    merchantSubject: 'Subscription Cancelled - MattressAI',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Subscription Cancelled</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your subscription to MattressAI has been cancelled. You'll continue to have access until {{subscriptionEndsAt}}.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We're sorry to see you go! If you change your mind, you can reactivate anytime.
          </p>
          
          <div style="text-align: center;">
            <a href="{{reactivateUrl}}" style="${BUTTON_STYLES}">
              Reactivate Subscription
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Questions? Contact us at {{supportEmail}}
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '❌ Subscription Cancelled: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #f44336; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Subscription Cancelled</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Was on Plan:</strong> {{planName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Ends:</strong> {{subscriptionEndsAt}}</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Reach out to understand why and see if we can save them.
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  },
  
  {
    eventType: 'subscription_expired',
    merchantSubject: 'Your Subscription Has Expired - MattressAI',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin: 0; font-size: 28px;">Subscription Expired</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your subscription to MattressAI has expired. Your AI assistant is now paused.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Want to continue? Reactivate your subscription to get back up and running.
          </p>
          
          <div style="text-align: center;">
            <a href="{{reactivateUrl}}" style="${BUTTON_STYLES}">
              Reactivate Now
            </a>
          </div>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '❌ Subscription Expired: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #9e9e9e; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Subscription Expired</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Was on Plan:</strong> {{planName}}</p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  },
  
  {
    eventType: 'payment_failed',
    merchantSubject: '⚠️ Payment Failed - Action Required',
    merchantBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #f44336; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Payment Failed</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;">Hi {{merchantName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We were unable to process your payment for MattressAI. Your subscription will be paused in 7 days if not resolved.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>What to do:</strong>
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>Check your payment method in Shopify</li>
            <li>Ensure sufficient funds are available</li>
            <li>Update your billing information if needed</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="{{updatePaymentUrl}}" style="${BUTTON_STYLES}">
              Update Payment Method
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Need help? Contact us at {{supportEmail}}
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">MattressAI - Shop: {{shopDomain}}</p>
        </div>
      </div>
    `,
    teamSubject: '🚨 Payment Failed: {{shopDomain}}',
    teamBody: `
      <div style="${BASE_STYLES}">
        <div style="background: #f44336; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Payment Failed</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <p style="font-size: 16px; line-height: 1.6;"><strong>Shop:</strong> {{shopDomain}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Plan:</strong> {{planName}}</p>
          <p style="font-size: 16px; line-height: 1.6;"><strong>Amount:</strong> {{amount}}</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Reach out to help resolve payment issue.
          </p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin: 0;">Internal Team Notification</p>
        </div>
      </div>
    `,
    sendToMerchant: true,
    sendToTeam: true
  }
];

