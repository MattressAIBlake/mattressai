# My App Starter

A SaaS platform that:
1. Logs users in with X (Twitter) OAuth
2. Fetches their bookmarks
3. Calls OpenAI to propose an app idea and generate Cursor prompts
4. Shows only 50% of the output until Stripe Checkout succeeds

## Features

- X (Twitter) OAuth authentication
- Bookmarks fetching from Twitter API
- AI-generated app ideas based on user bookmarks
- Payment integration with Stripe
- Preview/paid content gating system

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- NextAuth.js for authentication
- Prisma ORM with SQLite
- OpenAI API
- Stripe for payments

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the required values
3. Install dependencies:
   ```
   pnpm install
   ```
4. Set up the database:
   ```
   pnpm prisma migrate dev
   ```
5. Run the development server:
   ```
   pnpm dev
   ```

## Environment Variables

Create a `.env.local` file with the following:

```
# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Twitter/X OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# Database
DATABASE_URL="file:./dev.db"

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## Development

1. Get Twitter API credentials from the X Developer Portal
2. Set up Stripe account and create webhook endpoint
3. Set up an OpenAI account and get API key

## Deployment

The project is ready to be deployed on Vercel or any other hosting platform that supports Next.js applications. 