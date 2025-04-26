#!/bin/bash

# Create cleaned up .env file
cat > .env.clean << 'EOF'
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL=file:./dev.db

# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDpkzXcOSY1r9qMrxRCc2_1Fh197wTOg7I"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="my-app-starter-49bef.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="my-app-starter-49bef"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="my-app-starter-49bef.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="702592725291"
NEXT_PUBLIC_FIREBASE_APP_ID="1:702592725291:web:14ef22d8ec696265fd956e"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-GRP9TFC7L6"

# Firebase Admin Config
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@my-app-starter-49bef.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="AIzaSyDpkzXcOSY1r9qMrxRCc2_1Fh197wTOg7I"

# OpenAI and Stripe keys
OPENAI_API_KEY=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
STRIPE_SECRET_KEY=sk_test_51RFgVdC6IQsMlzDwJH8TTcGsUrzajSROObr7rMCvxB1JpqDQDfNi0YUQSsReaPIXNJo0XxiFPZzPqyOyXMab1YO200wJZ0FvWN
STRIPE_AUTH_SECRET="get_stripe_auth_secret_from_dashboard"

# Twitter OAuth
TWITTER_CLIENT_ID=UHE0ZU5abEhzWmF0bkh5bUgtQmw6MTpjaQ
TWITTER_CLIENT_SECRET=KyxddOZxb5wmWZ5Vzr5ADSpHRjKSxIwj6FA8LjA3F7s9jR9k-L

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_strong_random_secret_here
NEXTAUTH_DEBUG=true

# Stripe Webhook and Public Key
STRIPE_WEBHOOK_SECRET=sk_test_51RFgVdC6IQsMlzDwJH8TTcGsUrzajSROObr7rMCvxB1JpqDQDfNi0YUQSsReaPIXNJo0XxiFPZzPqyOyXMab1YO200wJZ0FvWN
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RFgVdC6IQsMlzDwBKswShdiFZoNse0BVndFfdjoRn9vSLfMg7zeiPd9gH7JQMbqg4wpqbU42ZDgt30FlaHj5T9000VdZzamvs
EOF

# Replace the old .env file with the cleaned version
mv .env.clean .env

echo "Environment file has been cleaned up successfully!"
