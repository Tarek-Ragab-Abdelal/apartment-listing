# Apartment Listing Web Application

A modern, responsive web application for browsing and managing real estate apartment listings, built with Next.js, React, and TypeScript.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x
- **UI Library**: React 18.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Radix UI (Headless component library)
- **Component Library**: shadcn/ui (Customizable components)
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Date Handling**: date-fns
- **Theme**: next-themes (Dark mode support)

## Project Structure

```
apps/web/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home page (apartment listings)
│   ├── not-found.tsx           # 404 page
│   ├── apartment/
│   │   └── [id]/
│   │       └── page.tsx        # Apartment detail page
│   ├── conversation/
│   │   └── [id]/
│   │       └── page.tsx        # Conversation detail page
│   ├── login/
│   │   └── page.tsx            # Login/registration page
│   ├── messages/
│   │   └── page.tsx            # Messages inbox
│   ├── sell/
│   │   └── new/
│   │       └── page.tsx        # Create new listing
│   └── watchlist/
│       └── page.tsx            # User's saved apartments
├── src/
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── layout/             # Layout components (Header, Footer, etc.)
│   │   ├── apartment-list/     # Apartment list components
│   │   ├── apartment-detail/   # Apartment detail components
│   │   ├── ApartmentCard.tsx
│   │   ├── ApartmentFilters.tsx
│   │   ├── Header.tsx
│   │   ├── NavLink.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Providers.tsx       # App providers wrapper
│   ├── page-components/        # Page-level components
│   │   ├── ApartmentList.tsx
│   │   ├── ApartmentDetail.tsx
│   │   ├── ConversationDetail.tsx
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   ├── Messages.tsx
│   │   ├── NewListing.tsx
│   │   ├── NotFound.tsx
│   │   └── Watchlist.tsx
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useApartmentList.ts
│   │   └── usePrefetchRoutes.ts
│   ├── services/               # API service layer
│   │   └── api.ts              # API client with typed endpoints
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   └── index.css               # Global styles and Tailwind imports
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── postcss.config.js           # PostCSS configuration
└── package.json
```

## Architecture Overview

### App Router Structure

The application uses Next.js 14 App Router with file-based routing:

- **Server Components**: Default for all pages, enabling server-side rendering
- **Client Components**: Used for interactive features (marked with `'use client'`)
- **Dynamic Routes**: `[id]` segments for apartment and conversation details
- **Layouts**: Nested layouts for consistent structure across pages

### Component Architecture

**Three-tier Component System:**

1. **Base UI Components** (`src/components/ui/`)

   - Primitive components from shadcn/ui built on Radix UI
   - Fully customizable, accessible, and theme-aware
   - Examples: Button, Input, Dialog, Card, Select, etc.

2. **Feature Components** (`src/components/`)

   - Composed from base UI components
   - Domain-specific logic (ApartmentCard, ApartmentFilters, Header)
   - Reusable across multiple pages

3. **Page Components** (`src/page-components/`)

   - Top-level components for entire pages
   - Orchestrate feature components and data fetching
   - Mapped one-to-one with app routes

### State Management

- **Global State**: React Context API (AuthContext)
- **Server State**: TanStack Query for caching, synchronization, and optimistic updates
- **Form State**: React Hook Form with Zod validation
- **Local State**: React hooks (useState, useReducer)

### API Integration

The `src/services/api.ts` module provides a typed API client with organized endpoints:

- `authApi`: Authentication (login, register, logout, profile)
- `apartmentApi`: Apartment CRUD and search
- `citiesApi`: City data
- `projectsApi`: Project data
- `watchlistApi`: User favorites
- `messagesApi`: Conversation-based messaging

All API calls include automatic JWT token injection from local/session storage.

## Key Features

### User Features

- Browse apartment listings with advanced filtering
- Search by location, price, size, bedrooms, bathrooms
- View detailed apartment information with image galleries
- Save favorite apartments to watchlist
- Message property listers directly
- Schedule property visits
- Review and rate properties
- User authentication with JWT
- Responsive design for mobile, tablet, and desktop

### Technical Features

- Server-side rendering (SSR) for SEO optimization
- Client-side navigation with prefetching
- Optimistic UI updates for better UX
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Dark mode support
- Accessibility features (ARIA labels, keyboard navigation)
- Form validation with instant feedback
- Error boundaries and fallback UI
- Protected routes with authentication guards

## Pages

### Public Pages

- `/` - Home page with apartment listings and filters
- `/apartment/[id]` - Apartment detail page with full information
- `/login` - Authentication page (login/register)

### Protected Pages (Require Authentication)

- `/messages` - User's message inbox with conversations
- `/conversation/[id]` - Conversation detail with message history
- `/watchlist` - User's saved favorite apartments
- `/sell/new` - Create new apartment listing

## Development

### Prerequisites

- Node.js 20+
- Running API server (see `apps/api` documentation)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

   Application will be available at `http://localhost:3000`

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks
- `npm run analyze` - Analyze bundle size with webpack bundle analyzer
- `npm run analyze:server` - Analyze server bundle
- `npm run analyze:browser` - Analyze browser bundle

## Styling

### Tailwind CSS

The application uses utility-first CSS with Tailwind. Key features:

- Custom color palette defined in `tailwind.config.ts`
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Dark mode support via class strategy
- Custom animations and keyframes
- Container queries for component-level responsiveness

### Design System

- **Typography**: System font stack with fallbacks
- **Colors**: HSL-based color system with CSS variables for theming
- **Spacing**: Consistent spacing scale (0.25rem increments)
- **Radius**: Configurable border radius variables
- **Shadows**: Subtle elevation system

### Component Customization

All shadcn/ui components can be customized via:

- `components.json` - Component configuration
- `src/components/ui/` - Direct component file editing
- Tailwind classes - Runtime styling

## Authentication Flow

1. User submits credentials via login form
2. `AuthContext.login()` calls `authApi.login()`
3. On success, JWT token stored in localStorage/sessionStorage
4. User object cached in React context
5. Token automatically included in subsequent API requests
6. Protected routes check authentication state via `ProtectedRoute` component
7. Unauthenticated users redirected to `/login`

## Data Fetching Patterns

### Server Components (Default)

```typescript
// Fetch data on the server
async function ApartmentPage({ params }: { params: { id: string } }) {
  const apartment = await apartmentApi.getById(params.id);
  return <ApartmentDetail data={apartment} />;
}
```

### Client Components with React Query

```typescript
// Fetch data on the client with caching
const { data, isLoading } = useQuery({
  queryKey: ["apartments", filters],
  queryFn: () => apartmentApi.getAll(filters),
});
```

### Optimistic Updates

```typescript
// Update UI immediately, rollback on error
const mutation = useMutation({
  mutationFn: watchlistApi.add,
  onMutate: async () => {
    // Optimistically update UI
  },
  onError: () => {
    // Rollback on error
  },
});
```

## Performance Optimizations

- **Code Splitting**: Automatic route-based splitting by Next.js
- **Image Optimization**: WebP/AVIF formats with responsive sizes
- **Bundle Analysis**: Custom webpack configuration for chunk optimization
- **Prefetching**: Link prefetching for faster navigation
- **Memoization**: React.memo, useMemo, useCallback for expensive operations
- **Virtual Scrolling**: For long lists (if implemented)
- **Lazy Loading**: Dynamic imports for heavy components
- **Compression**: Gzip/Brotli compression enabled

## Docker Deployment

Build and run using Docker:

```bash
docker build -t apartment-web .
docker run -p 3000:3000 --env-file .env apartment-web
```

Or use Docker Compose (from project root):

```bash
docker compose up -d
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

# Optional
NEXT_PUBLIC_APP_NAME=Nawy Apartments
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance (WCAG AA)
- Alt text for images

## TODO

### High Priority

1. **API Response Type Safety**

   - Replace direct Prisma model usage in frontend types
   - Create dedicated API response DTOs matching backend
   - Remove exposure of internal database IDs
   - Implement proper type guards for runtime validation

2. **Form Validation Enhancement**

   - Centralize Zod schemas shared with backend
   - Implement reusable form field components
   - Add async validation for unique constraints
   - Improve error message UX

3. **State Management Improvements**

   - Implement proper cache invalidation strategies
   - Add optimistic update patterns for all mutations
   - Configure React Query devtools for development
   - Add request deduplication

### Medium Priority

4. **User Experience**

   - Implement skeleton loading states for all async content
   - Add toast notifications for user actions
   - Implement infinite scroll for apartment listings
   - Add image gallery with lightbox
   - Implement advanced search with saved filters
   - Add sort options (price, date, relevance)

5. **Real-time Features**

   - WebSocket integration for real-time messaging
   - Live notification system
   - Online/offline status indicators
   - Typing indicators in conversations

6. **Performance**

   - Implement virtual scrolling for large lists
   - Add service worker for offline support
   - Optimize image loading with blur placeholders
   - Implement route-based code splitting
   - Add request/response compression

7. **Testing**

   - Unit tests for utility functions and hooks
   - Integration tests for critical user flows
   - E2E tests with Playwright or Cypress
   - Visual regression testing
   - Accessibility testing automation

### Low Priority

8. **Features**

   - User profile management page
   - Email verification workflow
   - Password reset functionality
   - Two-factor authentication
   - Property comparison tool
   - Map view with clustering
   - Advanced analytics dashboard (for agents/admins)
   - Export listings to PDF
   - Share listings on social media

9. **Developer Experience**

   - Storybook for component documentation
   - Component usage examples
   - API mocking for development
   - Hot module replacement improvements
   - Better error boundaries with recovery actions

10. **SEO & Analytics**

    - Meta tags optimization
    - Open Graph tags for social sharing
    - Structured data (JSON-LD) for rich snippets
    - Sitemap generation
    - Google Analytics integration
    - Performance monitoring (Core Web Vitals)

11. **Internationalization**

    - Multi-language support (i18n)
    - RTL layout support
    - Currency and date formatting
    - Localized content

12. **Security**

    - Content Security Policy (CSP) headers
    - Rate limiting on client side
    - XSS protection enhancements
    - Secure cookie configuration
    - HTTPS enforcement

---

Tarek Ragab - Nawy Listing Assesment
