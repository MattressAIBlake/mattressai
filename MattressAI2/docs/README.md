# MattressAI Documentation

Welcome to the MattressAI documentation. This guide will help you understand, set up, and use the MattressAI platform effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Architecture](#architecture)
4. [API Reference](#api-reference)
5. [Component Documentation](#component-documentation)
6. [Deployment Guide](#deployment-guide)
7. [User Guide](#user-guide)

## Getting Started

MattressAI is a comprehensive platform designed for mattress retailers to leverage AI-powered customer interactions. The platform consists of:

- Lead generation system
- Customer interaction management
- Brand management
- Analytics dashboard
- Settings configuration

### Key Features

- AI-powered chat assistants (Lite & Plus versions)
- Session management and analytics
- Brand integration and synchronization
- Customizable assistant configuration
- Multi-tier subscription system

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm 7.0.0 or higher
- Firebase account for authentication

### Setup Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mattressai.git
cd mattressai
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update the following variables in `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm run dev
```

## Architecture

### Tech Stack

- **Frontend Framework**: React with TypeScript
- **State Management**: 
  - Zustand for client state
  - React Query for server state
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **API Client**: Axios with custom configuration
- **Form Handling**: React Hook Form with Zod validation

### Project Structure

```
src/
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── layout/       # Layout components
│   ├── ui/           # Reusable UI components
│   └── [feature]/    # Feature-specific components
├── hooks/            # Custom React hooks
├── services/         # API services
├── stores/           # Zustand stores
├── utils/            # Utility functions
└── providers/        # React context providers
```

## API Reference

### Authentication

```typescript
// Login
POST /auth/login
Body: { email: string, password: string }

// Reset Password
POST /auth/reset-password
Body: { email: string }
```

### Sessions

```typescript
// Get Sessions
GET /sessions
Query: { 
  page?: number, 
  limit?: number, 
  search?: string,
  verified?: boolean,
  startDate?: string,
  endDate?: string 
}

// Get Single Session
GET /sessions/:id

// Update Session
PATCH /sessions/:id
Body: Partial<Session>

// Delete Session
DELETE /sessions/:id
```

### Brands

```typescript
// Get Brands
GET /brands

// Update Brand
PATCH /brands/:id
Body: Partial<Brand>

// Sync Brands
POST /brands/sync
```

### Settings

```typescript
// Get Assistant Settings
GET /settings/assistant

// Update Assistant Settings
PATCH /settings/assistant
Body: Partial<AssistantSettings>

// Get Contact Details
GET /settings/contact

// Update Contact Details
PATCH /settings/contact
Body: Partial<ContactDetails>
```

## Component Documentation

### Core Components

#### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}
```

#### Form Field
```typescript
interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  tooltip?: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'password';
  mask?: string;
  multiline?: boolean;
  rows?: number;
  autoSave?: boolean;
}
```

### Feature Components

#### Sessions Table
```typescript
interface Session {
  id: string;
  date: string;
  customerName: string;
  contactNumber: string;
  assistant: 'lite' | 'plus';
  verified: boolean;
  time: string;
}
```

#### Brand Toggle
```typescript
interface Brand {
  id: string;
  name: string;
  enabled: boolean;
}
```

## Deployment Guide

### Production Build

1. Create production build:
```bash
npm run build
```

2. Test the production build locally:
```bash
npm run preview
```

### Deployment Steps

1. Configure deployment environment variables
2. Set up Firebase hosting
3. Deploy the application:
```bash
firebase deploy
```

### Post-Deployment Checklist

- [ ] Verify authentication flows
- [ ] Test API integrations
- [ ] Check performance metrics
- [ ] Monitor error reporting
- [ ] Validate SEO elements

## User Guide

### Getting Started

1. **Login**: Access the platform using your credentials
2. **Dashboard**: View recent sessions and quick actions
3. **Sessions**: Manage and review customer interactions
4. **Settings**: Configure assistant behavior and preferences

### Assistant Configuration

1. Navigate to Settings > Assistant Configuration
2. Configure:
   - Assistant name
   - Company description
   - Assistant persona
   - Greeting message

### Brand Management

1. Access the Merchant Brands page
2. Select up to 4 brands
3. Use the sync feature to update brand information

### Session Management

1. View sessions in the Sessions page
2. Use filters to find specific interactions
3. Export session data as needed
4. Review and manage customer interactions

### Subscription Management

1. Access the Membership page
2. View current subscription details
3. Upgrade or modify subscription as needed
4. Manage billing information