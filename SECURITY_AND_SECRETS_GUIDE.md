# Security & Secrets Management Guide

Complete guide to securely managing API keys, secrets, and environment variables for your Shopify app.

---

## 🔒 Security Principles

### The Golden Rules
1. **NEVER commit secrets to git** (even private repos)
2. **Use environment variables** for all secrets
3. **Different secrets for dev/staging/prod**
4. **Rotate secrets regularly** (every 90 days minimum)
5. **Principle of least privilege** (only grant needed permissions)
6. **Audit access logs** regularly

---

## ✅ Current Security Status

### What's Secure ✓
```bash
# Check your .gitignore
cat .gitignore | grep env
# Should show:
# .env
# .env.*
# !.env.example
```

✅ `.env` is ignored by git  
✅ Only `.env.example` is tracked (template only)  
✅ No secrets in git history (verified)  
✅ Secrets accessed via `process.env` only  

### What You Need to Do
- [ ] Create actual `.env` file locally (never commit it)
- [ ] Set up secrets in production platform
- [ ] Enable secret scanning (GitHub/GitLab)
- [ ] Document who has access to production secrets
- [ ] Set up secret rotation schedule

---

## 📋 Environment Variables Checklist

### Critical Secrets (HIGH RISK)
These give full access to your systems:

- [ ] `SHOPIFY_API_SECRET` - Can access ALL Shopify data
- [ ] `ANTHROPIC_API_KEY` - Can cost you money
- [ ] `OPENAI_API_KEY` - Can cost you money
- [ ] `PINECONE_API_KEY` - Database access
- [ ] `DATABASE_URL` - Full database access

### Important Variables (MEDIUM RISK)
- [ ] `SHOPIFY_API_KEY` - Public but paired with secret
- [ ] `HOST` - Your app URL
- [ ] `SENDGRID_API_KEY` - Email access
- [ ] `TWILIO_AUTH_TOKEN` - SMS access

### Configuration (LOW RISK)
- [ ] `BILLING_ENABLED` - Feature flags
- [ ] `NODE_ENV` - Environment name
- [ ] `SCOPES` - Permission list

---

## 🛠️ Local Development Setup

### Step 1: Create Your Local .env File

```bash
# Copy the example
cp .env.example .env

# Edit with your actual values
nano .env
# or
code .env  # VS Code
```

### Step 2: Verify .env is Ignored

```bash
# This should return empty (file is ignored)
git status | grep .env

# This should show .env is in .gitignore
cat .gitignore | grep "^.env$"
```

### Step 3: NEVER Accidentally Commit .env

Add this git pre-commit hook:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check if .env file is being committed
if git diff --cached --name-only | grep -E "^.env$"; then
    echo "❌ ERROR: .env file is being committed!"
    echo "This file contains secrets and should NEVER be committed."
    echo "Remove it from staging: git reset HEAD .env"
    exit 1
fi

# Check for potential secrets in staged files
if git diff --cached --name-only -z | xargs -0 grep -HnE "(api[_-]?key|secret|password|token|auth[_-]?key)" --ignore-case; then
    echo "⚠️  WARNING: Potential secrets found in staged files!"
    echo "Review the above matches carefully."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

exit 0
EOF

# Make it executable
chmod +x .git/hooks/pre-commit

echo "✅ Git pre-commit hook installed!"
```

---

## 🚀 Production Deployment - Secrets Management

### Option 1: Fly.io (Recommended)

#### Set Secrets via CLI
```bash
# Login first
fly auth login

# Set secrets one by one
fly secrets set SHOPIFY_API_SECRET="your_secret_here" -a mattressai-shopify
fly secrets set ANTHROPIC_API_KEY="sk-ant-xxx" -a mattressai-shopify
fly secrets set OPENAI_API_KEY="sk-xxx" -a mattressai-shopify
fly secrets set PINECONE_API_KEY="xxx" -a mattressai-shopify

# Set all at once from file (CAREFUL - never commit this file!)
fly secrets import < .env.production -a mattressai-shopify

# List secrets (shows names only, not values)
fly secrets list -a mattressai-shopify

# Remove a secret
fly secrets unset OLD_SECRET -a mattressai-shopify
```

#### Set Secrets via Dashboard
1. Go to: https://fly.io/dashboard
2. Select your app → Secrets
3. Click "New Secret"
4. Enter name and value
5. Click "Set Secret"

**Best Practice:**
```bash
# Create a secure script to set all secrets
cat > deploy-secrets.sh << 'EOF'
#!/bin/bash
set -e

echo "🔐 Setting production secrets for Fly.io..."

fly secrets set \
  SHOPIFY_API_SECRET="$SHOPIFY_API_SECRET" \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  PINECONE_API_KEY="$PINECONE_API_KEY" \
  PINECONE_INDEX="$PINECONE_INDEX" \
  DATABASE_URL="$DATABASE_URL" \
  HOST="$HOST" \
  -a mattressai-shopify

echo "✅ Secrets set successfully!"
EOF

chmod +x deploy-secrets.sh

# Run it (after setting env vars in your shell)
export SHOPIFY_API_SECRET="xxx"
export ANTHROPIC_API_KEY="xxx"
# ... set all vars ...
./deploy-secrets.sh
```

### Option 2: Railway

#### Set via CLI
```bash
# Login
railway login

# Link to your project
railway link

# Set environment variables
railway variables set SHOPIFY_API_SECRET="your_secret"
railway variables set ANTHROPIC_API_KEY="sk-ant-xxx"
railway variables set OPENAI_API_KEY="sk-xxx"

# Import from file
railway variables set -f .env.production
```

#### Set via Dashboard
1. Go to: https://railway.app/dashboard
2. Select your project
3. Go to "Variables" tab
4. Click "+ New Variable"
5. Add each variable
6. Click "Deploy" to apply changes

### Option 3: Render

#### Set via Dashboard (No CLI for secrets)
1. Go to: https://dashboard.render.com/
2. Select your web service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable:
   - Key: `SHOPIFY_API_SECRET`
   - Value: `your_secret_here`
6. Click "Save Changes"
7. Render will automatically redeploy

**Tip:** Use "Add from .env" button to bulk import (parse your .env.production)

### Option 4: Heroku

```bash
# Login
heroku login

# Set secrets
heroku config:set SHOPIFY_API_SECRET="xxx" -a your-app-name
heroku config:set ANTHROPIC_API_KEY="sk-ant-xxx" -a your-app-name

# View secrets (shows values!)
heroku config -a your-app-name

# Remove secret
heroku config:unset OLD_SECRET -a your-app-name
```

### Option 5: Vercel

```bash
# Login
vercel login

# Set environment variables
vercel env add SHOPIFY_API_SECRET production
# (Will prompt for value)

# Or via vercel.json (NOT RECOMMENDED - can be committed accidentally)
# Use dashboard instead
```

**Via Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add variables for each environment (Production, Preview, Development)

---

## 🔐 Secret Rotation Strategy

### When to Rotate Secrets

**Immediately:**
- Secret is accidentally exposed (committed to git, posted in Slack, etc.)
- Team member with access leaves
- Suspected security breach
- API reports suspicious activity

**Regularly:**
- Every 90 days (minimum)
- Every 30 days (recommended for production)
- After major releases
- During security audits

### How to Rotate Secrets

#### 1. Shopify API Secret

```bash
# 1. Generate new credentials in Partners Dashboard
# Go to: https://partners.shopify.com/[org]/apps/[app]/edit
# Click "Rotate API credentials"

# 2. Update in production
fly secrets set SHOPIFY_API_SECRET="new_secret" -a mattressai-shopify

# 3. Test that app still works
curl https://your-app.fly.dev/health

# 4. Old secret is now invalid
```

#### 2. Anthropic API Key

```bash
# 1. Generate new key at https://console.anthropic.com/
# 2. Update production
fly secrets set ANTHROPIC_API_KEY="new_key" -a mattressai-shopify
# 3. Delete old key from Anthropic console
```

#### 3. Database Password

```bash
# 1. Create new database user (don't delete old yet)
# 2. Update DATABASE_URL with new credentials
fly secrets set DATABASE_URL="postgresql://newuser:newpass@host:5432/db" -a mattressai-shopify
# 3. Test that app works
# 4. Delete old database user
```

### Rotation Checklist Template

```markdown
## Secret Rotation - [Date]

### Secrets Rotated
- [ ] SHOPIFY_API_SECRET
- [ ] ANTHROPIC_API_KEY
- [ ] OPENAI_API_KEY
- [ ] PINECONE_API_KEY
- [ ] DATABASE_URL
- [ ] SENDGRID_API_KEY
- [ ] TWILIO_AUTH_TOKEN

### Steps Completed
- [ ] Generated new credentials
- [ ] Updated in production platform
- [ ] Tested app functionality
- [ ] Updated team documentation
- [ ] Deleted old credentials from providers
- [ ] Updated password manager/vault

### Next Rotation Date
[90 days from today]
```

---

## 🚨 What to Do If Secrets Are Exposed

### If You Accidentally Commit .env to Git

```bash
# 1. IMMEDIATELY rotate all secrets (don't wait!)

# 2. Remove from git history (if pushed)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (only if you must)
git push origin --force --all

# 4. Tell team to re-clone repo
# 5. Consider the repo compromised - rotate EVERYTHING
```

### If Secrets Are in a Public Repo

```bash
# 1. Rotate ALL secrets immediately
# 2. Make repo private
# 3. Review who had access
# 4. Monitor API usage for suspicious activity
# 5. Enable GitHub secret scanning
# 6. File incident report (if required by policy)
```

### Emergency Response Checklist

- [ ] **5 min:** Rotate exposed secrets
- [ ] **15 min:** Check API logs for suspicious usage
- [ ] **30 min:** Notify team and stakeholders
- [ ] **1 hour:** Review all access logs
- [ ] **24 hours:** Full security audit
- [ ] **1 week:** Implement preventive measures

---

## 🛡️ Additional Security Best Practices

### 1. Use a Secret Manager (Production)

**Recommended Tools:**

#### AWS Secrets Manager
```bash
# Install AWS CLI
brew install awscli

# Configure
aws configure

# Store secret
aws secretsmanager create-secret \
  --name mattressai/prod/shopify-secret \
  --secret-string "your_secret_here"

# Retrieve in code
# (Requires AWS SDK in your app)
```

#### HashiCorp Vault
```bash
# Start Vault server
vault server -dev

# Store secret
vault kv put secret/mattressai/prod SHOPIFY_API_SECRET="xxx"

# Retrieve
vault kv get secret/mattressai/prod
```

#### 1Password CLI
```bash
# Install
brew install 1password-cli

# Store secret
op item create \
  --category=login \
  --title="MattressAI Production Secrets" \
  SHOPIFY_API_SECRET="xxx"

# Retrieve
op item get "MattressAI Production Secrets" --fields SHOPIFY_API_SECRET
```

### 2. Enable Secret Scanning

#### GitHub
1. Go to: Settings → Security → Code security and analysis
2. Enable "Secret scanning"
3. Enable "Push protection"

#### GitLab
1. Go to: Settings → Security & Compliance
2. Enable "Secret Detection"

### 3. Implement Principle of Least Privilege

```bash
# Create read-only database user for monitoring
CREATE USER monitoring_user WITH PASSWORD 'xxx';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_user;

# Create limited API keys where possible
# Example: Pinecone with read-only access for analytics
```

### 4. Audit Access Regularly

```bash
# Check who has access to Fly.io app
fly orgs show

# Check Shopify app collaborators
# Go to Partners Dashboard → Apps → Your App → Manage

# Check database users
SELECT usename, usesuper, usecreatedb 
FROM pg_user 
WHERE usename NOT LIKE 'pg_%';
```

### 5. Use HTTPS Everywhere

```bash
# Force HTTPS in production (already configured in Remix)
# Verify with:
curl -I https://your-app.fly.dev
# Should return: Strict-Transport-Security header
```

---

## 📊 Security Monitoring

### What to Monitor

1. **API Usage Anomalies**
   - Sudden spike in API calls
   - Calls from unusual IP addresses
   - Failed authentication attempts

2. **Database Access**
   - Unusual query patterns
   - Access from unexpected locations
   - Large data exports

3. **Error Rates**
   - Authentication errors
   - Authorization errors
   - 500 errors

### Setting Up Alerts

#### Sentry (Error Monitoring)
```bash
npm install @sentry/remix

# In app/entry.server.jsx
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Log Monitoring
```bash
# Fly.io logs
fly logs -a mattressai-shopify | grep -i "error\|failed\|unauthorized"

# Set up log aggregation
# Recommended: Papertrail, Logtail, or Datadog
```

---

## ✅ Pre-Deployment Security Checklist

Before deploying to production:

### Code Review
- [ ] No hardcoded secrets in code
- [ ] All secrets via environment variables
- [ ] No `console.log` of sensitive data
- [ ] No secrets in comments
- [ ] No secrets in error messages

### Git Repository
- [ ] `.env` in `.gitignore`
- [ ] No `.env` in git history
- [ ] Secret scanning enabled
- [ ] Protected branches configured
- [ ] Required reviews for main branch

### Environment Variables
- [ ] All required vars in `.env.example`
- [ ] Production vars set in hosting platform
- [ ] Different secrets for dev/staging/prod
- [ ] Secrets documented (names only) in README

### Access Control
- [ ] Minimal team access to production
- [ ] 2FA enabled for all production access
- [ ] SSH keys password-protected
- [ ] API keys have minimal permissions

### Monitoring
- [ ] Error tracking enabled (Sentry)
- [ ] Log aggregation set up
- [ ] Uptime monitoring configured
- [ ] Alerts configured for suspicious activity

---

## 📚 Additional Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **12-Factor App (Config):** https://12factor.net/config
- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning
- **Shopify Security Best Practices:** https://shopify.dev/docs/apps/store/security
- **NIST Password Guidelines:** https://pages.nist.gov/800-63-3/

---

## 🆘 Emergency Contacts

Document these for your team:

```
## Production Access Emergency Contacts

Fly.io Access: [name] - [email]
Shopify Partners Access: [name] - [email]
Database Admin: [name] - [email]
API Key Owner (Anthropic): [name] - [email]
API Key Owner (OpenAI): [name] - [email]

## Incident Response
1. Security Lead: [name] - [phone]
2. Tech Lead: [name] - [phone]
3. CTO/Founder: [name] - [phone]

## Service Status Pages
- Shopify: https://www.shopifystatus.com/
- Anthropic: https://status.anthropic.com/
- OpenAI: https://status.openai.com/
- Fly.io: https://status.flyio.net/
```

---

## Summary: Quick Security Setup

```bash
# 1. Copy and configure local .env
cp .env.example .env
nano .env  # Add your secrets

# 2. Verify .env is gitignored
git status | grep .env  # Should be empty

# 3. Install pre-commit hook
chmod +x .git/hooks/pre-commit

# 4. Set production secrets
fly secrets set SHOPIFY_API_SECRET="xxx" -a your-app

# 5. Enable monitoring
# Sign up for Sentry, add DSN to env vars

# 6. Document rotation schedule
# Add to calendar: Rotate secrets every 90 days
```

🔒 **You're now secure!**

