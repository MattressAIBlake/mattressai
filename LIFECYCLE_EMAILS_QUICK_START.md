# Lifecycle Email Automations - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run the Seed Script

This populates your database with 10 pre-built email templates:

```bash
node --loader ts-node/esm app/lib/lifecycle-emails/seed-templates.ts
```

Expected output:
```
🌱 Seeding lifecycle email templates...
✓ Created template: app_installed
✓ Created template: app_uninstalled
... (8 more)
✅ Seeding complete!
   Created: 10
```

### Step 2: Configure Email Settings

1. Navigate to your admin: `/app/admin/lifecycle-emails/settings`
2. Enter your team email addresses (comma-separated):
   ```
   team@yourdomain.com, sales@yourdomain.com
   ```
3. Set your reply-to email:
   ```
   support@yourdomain.com
   ```
4. Click "Save Settings"

### Step 3: Send a Test Email

Still on the settings page:
1. Enter your email address in "Send Test Email To"
2. Click "Send Test Email"
3. Check your inbox (and spam folder) for the test email

✅ If you receive it, your setup is working!

### Step 4: Set Up Trial Worker (Production Only)

#### For Vercel:

Create `app/routes/api.cron.trial-worker/route.ts`:
```typescript
import { processTrialLifecycles } from '~/workers/trial-worker';

export const loader = async () => {
  await processTrialLifecycles();
  return new Response('OK', { status: 200 });
};
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/trial-worker",
    "schedule": "0 9 * * *"
  }]
}
```

#### For Railway/Heroku:

Add to Procfile or cron config:
```
0 9 * * * node --loader ts-node/esm app/workers/trial-worker.ts
```

---

## 📧 What Emails Will Be Sent?

### Automatically Triggered:

✅ **When merchant installs app** → Welcome email (to merchant + team)  
✅ **When merchant uninstalls** → Goodbye email (to team)  
✅ **3 days before trial ends** → Upgrade reminder (to merchant + team)  
✅ **When trial expires** → Expiration notice (to merchant + team)  
✅ **When plan upgraded** → Congratulations email (to merchant + team)  
✅ **When subscription cancelled** → Confirmation (to merchant + team)  
✅ **When payment fails** → Action required alert (to merchant + team)  

---

## 🎨 Customizing Templates

1. Go to `/app/admin/lifecycle-emails`
2. Click "Edit" on any template
3. Modify the subject and/or body
4. Use variables like `{{merchantName}}` and `{{shopDomain}}`
5. Click "Save"

**Pro tip**: Keep the HTML structure intact for best results!

---

## 📊 Viewing Email History

1. Navigate to `/app/admin/lifecycle-emails/logs`
2. Filter by event type, status, or date
3. See all sent emails with delivery status
4. Resend any failed emails with one click

---

## 🔧 Environment Variables Needed

These should already be set from Phase 4:
```bash
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=alerts@mattressai.app
```

Optional new ones:
```bash
LIFECYCLE_EMAILS_FROM_NAME=MattressAI Team
LIFECYCLE_EMAILS_REPLY_TO=system@themattressai.com
LIFECYCLE_EMAILS_TEAM_DEFAULT=team@mattressai.com
```

---

## ⚠️ Troubleshooting

### "No emails being sent"
- ✓ Check SendGrid API key is valid
- ✓ Verify templates are enabled in admin UI
- ✓ Look at logs for error messages
- ✓ Try sending a test email from settings page

### "Test email not received"
- ✓ Check spam folder
- ✓ Verify SENDGRID_API_KEY env var is set
- ✓ Confirm SendGrid account is active
- ✓ Check SendGrid dashboard for delivery status

### "Trial emails not working"
- ✓ Verify trial worker cron job is set up
- ✓ Check tenant has `trialEndsAt` field populated
- ✓ Run worker manually to test: `node app/workers/trial-worker.ts`
- ✓ Check logs - emails only sent once per event

---

## 📱 Need Help?

1. **Check the logs**: `/app/admin/lifecycle-emails/logs`
2. **Review console**: Look for `[LifecycleEmail]` prefixed messages
3. **Test configuration**: Use "Send Test Email" button
4. **Verify templates**: Ensure they're enabled in admin UI

---

## 🎉 That's It!

Your lifecycle email automation system is now ready to:
- Welcome new merchants
- Remind about trial expirations
- Celebrate upgrades
- Re-engage churned users
- Alert on payment issues

All with beautiful, professional emails sent automatically! 🚀

