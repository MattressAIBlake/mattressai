# Privacy Policy for MattressAI

**Effective Date:** [INSERT DATE]  
**Last Updated:** [INSERT DATE]

---

## Introduction

This Privacy Policy describes how MattressAI ("we," "us," or "our") collects, uses, and shares information when you use our Shopify app (the "App"). This policy applies to merchants who install our App and to their customers who interact with the App through the merchant's storefront.

**Important:** This App is designed for mattress stores and furniture retailers. If you are a customer of a store using MattressAI, please also review that store's privacy policy.

---

## 1. Information We Collect

### A. Information from Merchants
When you install and use MattressAI, we collect:

- **Shopify Store Information:** Store name, domain, owner email, plan type
- **Product Data:** Product titles, descriptions, prices, images, metafields, variants, inventory
- **Configuration Data:** Prompt settings, recommendation rules, alert preferences, billing information
- **Usage Data:** Feature usage, indexing jobs, API calls, error logs

### B. Information from Customers (Shoppers)
When a customer interacts with the MattressAI widget on your store:

**With Customer Consent (Lead Capture):**
- Name, email address, phone number, ZIP code
- Explicitly provided only when customer submits lead capture form with consent

**Automatically Collected (Analytics):**
- Chat messages and conversation history
- Product views, clicks, and recommendations shown
- Cart actions (add to cart, remove from cart)
- Session timestamps, duration, and intent scores
- Browser type, device type, IP address (for security only)
- Page URLs visited during session

**Important:** We do NOT collect customer PII (name, email, phone) without explicit consent via the lead capture form.

---

## 2. How We Use Your Information

### A. To Provide the Service
- Generate AI-powered product recommendations based on customer preferences
- Index and enrich product catalog with mattress-specific attributes
- Create vector embeddings for semantic search
- Track conversation flow and shopping intent
- Send alerts to merchants when customers request assistance

### B. To Improve Our Service
- Analyze app performance and usage patterns
- Train and improve AI recommendation algorithms
- Conduct A/B testing to optimize conversion rates
- Monitor system health and troubleshoot errors
- Aggregate analytics for product development

### C. To Communicate with You
- Send transactional emails (installation, billing, alerts)
- Provide customer support and respond to inquiries
- Send product updates and feature announcements (with permission)
- Deliver weekly analytics digests (if configured)

### D. For Compliance and Safety
- Comply with legal obligations (GDPR, CCPA, etc.)
- Prevent fraud and abuse
- Enforce our Terms of Service
- Respond to legal requests from law enforcement

---

## 3. How We Share Your Information

We do NOT sell your personal information. We share data only in the following circumstances:

### A. With Third-Party Service Providers
We use the following services to operate MattressAI:

| Service | Purpose | Data Shared | Privacy Policy |
|---------|---------|-------------|----------------|
| **OpenAI** | AI processing, embeddings | Product descriptions, chat messages (no PII) | [OpenAI Privacy](https://openai.com/privacy) |
| **Pinecone** | Vector database | Product embeddings, metadata (no PII) | [Pinecone Privacy](https://www.pinecone.io/privacy) |
| **SendGrid** | Email alerts | Merchant email, lead email (if consented) | [SendGrid Privacy](https://sendgrid.com/policies/privacy) |
| **Twilio** | SMS alerts | Merchant phone, lead phone (if consented) | [Twilio Privacy](https://www.twilio.com/legal/privacy) |
| **Vercel** | Application hosting | All app data | [Vercel Privacy](https://vercel.com/legal/privacy-policy) |
| **Shopify** | E-commerce platform | Store data, customer tokens | [Shopify Privacy](https://www.shopify.com/legal/privacy) |

**Data Processing Agreements:** We have agreements with these providers to protect your data.

### B. With Merchants (Store Owners)
If you are a customer and submit a lead capture form with consent:
- Your name, email, phone, and ZIP code are shared with the merchant
- The merchant can view your conversation history and intent score
- The merchant is responsible for handling your data per their privacy policy

### C. For Legal Reasons
We may disclose information if required by:
- Court order or subpoena
- Legal process or investigation
- Protection of rights, safety, or property
- Compliance with applicable laws

### D. Business Transfers
If MattressAI is acquired or merged, your information may transfer to the new entity. We will notify you via email before this occurs.

---

## 4. Your Rights and Choices

### A. If You Are a Merchant
You have the right to:
- **Access:** Request a copy of your data
- **Delete:** Uninstall the app to delete all data (or request manual deletion)
- **Update:** Modify your settings, prompt configurations, and alert preferences
- **Export:** Export leads, analytics, and session data via the admin dashboard
- **Opt-Out:** Disable specific features (alerts, analytics, A/B testing)

**To exercise these rights:** Email us at [INSERT SUPPORT EMAIL]

### B. If You Are a Customer
You have the right to:
- **Access:** Request a copy of your data from the merchant or us
- **Delete:** Request deletion of your data (GDPR "Right to be Forgotten")
- **Object:** Opt out of data collection by not using the chat widget
- **Withdraw Consent:** Contact the merchant to withdraw lead capture consent

**To exercise these rights:**
1. Contact the merchant directly (check their privacy policy)
2. Or email us at [INSERT SUPPORT EMAIL] with your details

**GDPR Compliance:** We comply with GDPR for EU residents. We respond to data requests within 30 days.

**CCPA Compliance:** We comply with CCPA for California residents. We do not sell personal information.

---

## 5. Data Retention

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| **Chat Sessions** | 90 days | Analytics, support |
| **Leads (with consent)** | Until merchant deletes | Lead management |
| **Leads (without consent)** | Immediate deletion | Compliance |
| **Analytics (aggregated)** | Indefinitely | Product improvement |
| **Product Profiles** | Until merchant uninstalls | Recommendations |
| **Index Jobs** | 1 year | Cost tracking, auditing |
| **Error Logs** | 30 days | Debugging, support |

**Automatic Deletion:** After 90 days, chat sessions without consented leads are automatically anonymized.

**Merchant Request:** Merchants can delete specific leads or sessions at any time via the admin dashboard.

---

## 6. Security Measures

We take security seriously and implement industry-standard practices:

### Technical Measures
- **Encryption:** All data transmitted via HTTPS/TLS
- **Database Security:** Encrypted connections, access controls
- **Authentication:** JWT tokens, OAuth 2.0, HMAC verification
- **API Security:** Rate limiting, input validation, SQL injection protection
- **Monitoring:** 24/7 uptime monitoring, error tracking (Sentry)

### Organizational Measures
- **Access Control:** Least-privilege principle for team members
- **Auditing:** All data access logged and monitored
- **Incident Response:** Security breach notification within 72 hours (GDPR requirement)

**No system is 100% secure.** While we use best practices, we cannot guarantee absolute security.

---

## 7. Cookies and Tracking

### A. Cookies We Use
| Cookie | Purpose | Duration | Required |
|--------|---------|----------|----------|
| `session_id` | Track chat sessions | Session | Yes |
| `variant_id` | A/B testing assignment | 30 days | No |
| `click_id` | Attribution tracking | 14 days | No |

### B. Third-Party Cookies
Our service providers (OpenAI, Pinecone, etc.) may set cookies. Please review their privacy policies.

### C. Your Choices
- **Disable Cookies:** Use browser settings (may break functionality)
- **Opt-Out of A/B Testing:** Not currently available (feature in development)
- **Opt-Out of Analytics:** Close the chat widget or avoid interacting with it

---

## 8. Children's Privacy

MattressAI is not intended for children under 13 (or 16 in the EU). We do not knowingly collect data from children. If we discover we have collected data from a child, we will delete it immediately.

**Parents:** If you believe your child provided information to us, email [INSERT SUPPORT EMAIL].

---

## 9. International Data Transfers

MattressAI is operated from **[INSERT COUNTRY]**. If you access the App from outside this country, your data may be transferred to, stored, and processed in:
- **United States** (OpenAI, Pinecone, SendGrid, Twilio, Vercel)
- **Other countries** where our service providers operate

We ensure adequate protection through:
- Standard Contractual Clauses (EU-approved)
- Data Processing Agreements with providers
- GDPR-compliant safeguards

---

## 10. Changes to This Privacy Policy

We may update this Privacy Policy periodically to reflect:
- Changes in our practices
- Legal or regulatory requirements
- New features or services

**Notification:**
- **Minor Changes:** Posted on this page
- **Material Changes:** Email notification to merchants

**Your Continued Use:** Continuing to use MattressAI after changes constitutes acceptance.

---

## 11. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or your data:

**Email:** [INSERT SUPPORT EMAIL]  
**Support Page:** [INSERT SUPPORT URL]  
**Mailing Address:**
```
[INSERT BUSINESS NAME]
[INSERT STREET ADDRESS]
[INSERT CITY, STATE, ZIP]
[INSERT COUNTRY]
```

**Response Time:** We respond to inquiries within 48 hours (business days).

---

## 12. Legal Information

### A. Data Controller
For GDPR purposes, the data controller is:
- **Merchants:** For customer data collected via the widget
- **MattressAI:** For merchant account data and aggregate analytics

### B. Data Protection Officer (If Applicable)
If required by law, contact our DPO at: [INSERT DPO EMAIL]

### C. Supervisory Authority
EU residents can file complaints with their local data protection authority. [List of authorities](https://edpb.europa.eu/about-edpb/board/members_en)

---

## 13. Specific Jurisdictions

### A. California Residents (CCPA)
California residents have additional rights under CCPA:
- **Right to Know:** What data we collect and how we use it
- **Right to Delete:** Request deletion of your data
- **Right to Opt-Out:** We do not sell data, so no opt-out needed
- **Non-Discrimination:** We won't discriminate for exercising your rights

**Contact:** [INSERT SUPPORT EMAIL] with "CCPA Request" in subject

### B. European Residents (GDPR)
EU/EEA residents have rights under GDPR:
- **Right to Access:** Get a copy of your data
- **Right to Rectification:** Correct inaccurate data
- **Right to Erasure:** Delete your data ("Right to be Forgotten")
- **Right to Restriction:** Limit processing of your data
- **Right to Data Portability:** Receive data in portable format
- **Right to Object:** Object to certain processing activities

**Contact:** [INSERT SUPPORT EMAIL] with "GDPR Request" in subject

### C. Other Jurisdictions
If you are in a jurisdiction with specific privacy laws (Brazil LGPD, Australia Privacy Act, etc.), contact us for information about your rights.

---

## Appendix: Data Flow Diagram

```
Customer → Storefront Widget → MattressAI Backend → OpenAI (AI processing)
                                                  → Pinecone (vector storage)
                                                  → SendGrid (email alerts)
                                                  → Twilio (SMS alerts)
                                                  → Shopify (customer creation)

Merchant → Admin Dashboard → MattressAI Backend → Database (PostgreSQL)
```

---

## Acknowledgments

This privacy policy was created to comply with:
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Shopify App Store Requirements
- Best practices for SaaS applications

---

**END OF PRIVACY POLICY**

---

## Instructions for Merchants

**Before publishing this privacy policy:**

1. **Replace ALL placeholders:**
   - `[INSERT DATE]` → Current date
   - `[INSERT SUPPORT EMAIL]` → Your support email
   - `[INSERT SUPPORT URL]` → Your support page URL
   - `[INSERT COUNTRY]` → Your country of operation
   - `[INSERT BUSINESS NAME]` → Your legal business name
   - `[INSERT STREET ADDRESS]` → Your business address
   - `[INSERT CITY, STATE, ZIP]` → Your location
   - `[INSERT DPO EMAIL]` → Your DPO email (if applicable)

2. **Review and customize:**
   - Add any additional services you use
   - Adjust retention periods if different
   - Add jurisdiction-specific sections if needed
   - Review with a lawyer (recommended for production apps)

3. **Host publicly:**
   - Option A: Create a static site (GitHub Pages, Vercel)
   - Option B: Add to your existing website
   - Option C: Use a dedicated privacy policy hosting service

4. **Update Shopify App listing:**
   - Add the URL to your app listing
   - Update `shopify.app.toml` with the URL

5. **Keep it updated:**
   - Review annually
   - Update when you add new features or services
   - Notify merchants of material changes

---

**Need help?** Contact a privacy lawyer or use a professional service like:
- [TermsFeed](https://www.termsfeed.com/)
- [Iubenda](https://www.iubenda.com/)
- [Privacy Policies](https://www.privacypolicies.com/)

