# CetaProjectsManager - Frontend

Mobile-first Progressive Web App built with Next.js 15, React 18, and TypeScript.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your configuration
```

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase (for push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Linting

```bash
# Run ESLint
npm run lint

# Type checking
npm run type-check
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Admin dashboard
│   ├── projects/          # Project pages
│   └── notifications/     # Notification pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── providers.tsx     # Context providers
│   └── ...               # Feature components
├── lib/                   # Utility functions
│   ├── api-client.ts     # Axios instance
│   └── utils.ts          # Helper functions
├── store/                 # Zustand stores
│   └── auth-store.ts     # Auth state management
├── hooks/                 # Custom React hooks
│   └── use-toast.ts      # Toast notifications
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── icons/            # App icons
└── types/                # TypeScript types
```

## Features

### Progressive Web App (PWA)

- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Service worker caching
- **Push Notifications**: Firebase Cloud Messaging
- **App-like Experience**: Full-screen, standalone mode

### State Management

**Zustand** for global state:
- Auth state (user, tokens)
- Persistent storage (localStorage)
- Simple API, no boilerplate

**React Query** for server state:
- Automatic caching and revalidation
- 30-second polling for real-time updates
- Optimistic updates
- Automatic retry on failure

### Authentication

- JWT-based authentication
- Automatic token refresh
- Protected routes
- Role-based access control (ADMIN/USER)

### API Integration

- Axios instance with interceptors
- Automatic token injection
- Token refresh on 401
- Error handling

### UI Components

shadcn/ui components:
- Button, Card, Toast
- Form inputs
- Dialogs, Dropdowns
- Tabs, Badges, Avatars
- Fully customizable with Tailwind

### Responsive Design

- Mobile-first approach
- Touch-optimized interactions
- Safe area insets for notch devices
- Responsive layouts

## Development Guidelines

### Component Structure

```tsx
'use client' // For client components

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'

export function MyComponent() {
  const [state, setState] = useState()
  const { user } = useAuthStore()

  return (
    <div>
      <Button onClick={() => {}}>
        Click me
      </Button>
    </div>
  )
}
```

### API Calls with React Query

```tsx
'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'

export function ProjectList() {
  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get('/api/projects')
      return res.data.data.projects
    },
  })

  // Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return apiClient.post('/api/projects', data)
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  if (isLoading) return <div>Loading...</div>

  return <div>{/* Render data */}</div>
}
```

### State Management

```tsx
// Using Zustand store
import { useAuthStore } from '@/store/auth-store'

export function UserProfile() {
  const { user, setAuth, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/auth/login')
  }

  return <div>{user?.name}</div>
}
```

### Styling

```tsx
import { cn } from '@/lib/utils'

export function MyComponent({ className }) {
  return (
    <div className={cn(
      'base-classes',
      'responsive:md:classes',
      className // Allow override
    )}>
      Content
    </div>
  )
}
```

## PWA Configuration

### Install Prompt

The app will prompt users to install on mobile devices after:
- 2+ visits
- 30+ seconds engagement
- HTTPS enabled

### Push Notifications

1. Request permission on login
2. Store FCM token in backend
3. Receive notifications even when app closed
4. Handle notification clicks to deep link

### Service Worker

- Caches static assets
- Network-first strategy for API calls
- Offline fallback page

## Testing

### Manual Testing

```bash
# Test on mobile device
# 1. Connect to same network
# 2. Use local IP: http://192.168.x.x:3000
# 3. Test PWA installation
# 4. Test push notifications
```

### Lighthouse Audit

```bash
# Production build
npm run build
npm start

# Open DevTools > Lighthouse
# Run PWA audit
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- All Firebase variables

### Build Settings

- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## Troubleshooting

### Hydration Errors

```tsx
// Use suppressHydrationWarning for dynamic content
<html suppressHydrationWarning>
```

### Service Worker Not Updating

```bash
# Clear cache
# 1. DevTools > Application > Clear storage
# 2. Hard refresh (Ctrl+Shift+R)
```

### API CORS Issues

Ensure backend `FRONTEND_URL` matches your domain.

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## Next Steps

1. Implement authentication pages
2. Build project list and detail pages
3. Add notification center
4. Implement admin dashboard
5. Add file upload UI
6. Configure Firebase for push notifications
7. Test PWA installation
8. Deploy to production

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
