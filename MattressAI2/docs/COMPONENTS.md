# MattressAI Component Documentation

## UI Components

### Button
A versatile button component with multiple variants and sizes.

```typescript
import Button from './components/ui/Button';

<Button
  variant="primary" // 'primary' | 'secondary' | 'ghost' | 'gradient'
  size="md" // 'sm' | 'md' | 'lg'
  icon={Icon} // Lucide icon component
  iconPosition="left" // 'left' | 'right'
>
  Click me
</Button>
```

### Form Field
A form input component with built-in validation and masking support.

```typescript
import FormField from './components/ui/FormField';

<FormField
  name="email"
  label="Email Address"
  description="Enter your business email"
  tooltip="We'll use this for important notifications"
  type="email"
  autoSave
/>
```

### Toast
A notification component for displaying feedback.

```typescript
import { useToastStore } from './stores/toastStore';

const { addToast } = useToastStore();

addToast('success', 'Operation completed successfully');
addToast('error', 'An error occurred');
addToast('info', 'Please note this information');
```

## Layout Components

### Sidebar
Main navigation component with collapsible functionality.

```typescript
import Sidebar from './components/layout/Sidebar';

<Sidebar
  items={[
    {
      section: 'Dashboard',
      items: [
        { icon: Home, label: 'Home', href: '/' },
        { icon: Users, label: 'Sessions', href: '/sessions' }
      ]
    }
  ]}
/>
```

### Header
Top navigation bar with user controls and breadcrumbs.

```typescript
import Header from './components/layout/Header';

<Header
  breadcrumbItems={[
    { label: 'Home', href: '/' },
    { label: 'Settings' }
  ]}
/>
```

## Feature Components

### Sessions Table
Displays and manages session data with sorting and filtering.

```typescript
import SessionsTable from './components/sessions/SessionsTable';

<SessionsTable
  columns={[
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'customerName', header: 'Customer Name' }
  ]}
/>
```

### Brand Toggle
Toggle component for enabling/disabling brands.

```typescript
import BrandToggle from './components/brands/BrandToggle';

<BrandToggle
  name="Brand Name"
  enabled={true}
  onChange={(enabled) => console.log('Brand toggled:', enabled)}
/>
```

## Hooks

### useAutosave
Hook for implementing autosave functionality.

```typescript
import { useAutosave } from './hooks/useAutosave';

const { save } = useAutosave({
  onSave: async (data) => {
    await api.save(data);
  },
  debounceMs: 1000
});
```

### useCache
Hook for caching data with TTL support.

```typescript
import { useCache } from './hooks/useCache';

const { data, updateCache, clearCache } = useCache({
  key: 'cache-key',
  ttl: 5 * 60 * 1000 // 5 minutes
});
```

## Stores

### Auth Store
Manages authentication state using Zustand.

```typescript
import { useAuthStore } from './stores/authStore';

const { user, login, logout } = useAuthStore();

// Login
await login(email, password);

// Logout
await logout();
```

### Toast Store
Manages toast notifications.

```typescript
import { useToastStore } from './stores/toastStore';

const { addToast, removeToast } = useToastStore();

// Show toast
addToast('success', 'Operation successful');

// Remove specific toast
removeToast('toast-id');
```

## Utilities

### API Client
Axios-based API client with caching and retry logic.

```typescript
import { apiClient } from './services/api/client';

// Make API request
const data = await apiClient.request({
  method: 'GET',
  url: '/endpoint',
  params: { page: 1 }
});

// Clear cache
apiClient.clearCache();
```

### Auth Utilities
Helper functions for authentication and authorization.

```typescript
import { getAuthHeaders, hasPermission } from './utils/auth';

// Get auth headers
const headers = getAuthHeaders();

// Check permissions
const canAccess = hasPermission('admin');
```