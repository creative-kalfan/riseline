# CareerOS Authentication Architecture

## Overview

This document describes the complete authentication infrastructure for CareerOS. The architecture is designed to prepare the application for backend integration without implementing business logic or connecting to the backend.

## Architecture

### Folder Structure

```
src/auth/
├── auth.types.ts              # Type definitions for auth models
├── auth.constants.ts          # Auth-related constants
├── auth.config.ts             # Auth configuration
├── auth.service.ts            # API service placeholders
├── AuthContext.tsx             # React context for auth state
├── AuthProvider.tsx            # Auth state provider component
├── useAuth.ts                  # Custom hook for auth
├── ProtectedRoute.tsx          # Route guard for authenticated users
├── GuestRoute.tsx              # Route guard for unauthenticated users
├── storage.ts                  # Storage abstraction layer
├── http-interceptor.ts         # HTTP interceptor placeholders
├── components/
│   ├── AuthLoadingSpinner.tsx
│   ├── PermissionDeniedScreen.tsx
│   ├── UnauthorizedScreen.tsx
│   └── SessionExpiredDialog.tsx
```

## Authentication Flow

### 1. Initialization

```
App Start
  └─> AuthProvider mounts
      └─> Check storage for existing tokens
          ├─> Tokens found: Validate and restore session
          └─> No tokens: Set status to unauthenticated
```

### 2. Login Flow

```
User submits login form
  └─> useAuth.login() called
      └─> AuthProvider.login() executes
          ├─> Call authService.login()
          ├─> Store tokens in storage
          ├─> Update auth state
          └─> Set status to authenticated
```

### 3. Token Refresh Flow

```
API request returns 401
  └─> http-interceptor.handleUnauthorized()
      ├─> Check for refresh token
      ├─> Call authService.refreshToken()
      ├─> Update stored tokens
      ├─> Retry original request
      └─> On failure: Redirect to login
```

### 4. Logout Flow

```
User clicks logout
  └─> useAuth.logout() called
      └─> AuthProvider.logout() executes
          ├─> Call authService.logout()
          ├─> Clear storage
          ├─> Reset auth state
          └─> Set status to unauthenticated
```

## Session Model

### User

```typescript
type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin" | "moderator";
  permissions: Permission[];
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Tokens

```typescript
type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until expiry
  refreshExpiresIn: number; // Seconds until refresh token expiry
};
```

### Session

```typescript
type Session = {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
};
```

### Authentication Status

```typescript
type AuthStatus =
  | "idle" // Initial state
  | "loading" // Operation in progress
  | "authenticated" // User is logged in
  | "unauthenticated" // User is not logged in
  | "error"; // Error occurred
```

## Token Lifecycle

### Access Token

- **Storage**: localStorage (configurable)
- **Lifetime**: Short-lived (typically 15-60 minutes)
- **Usage**: Attached to API requests via Authorization header
- **Refresh**: Automatically refreshed before expiry

### Refresh Token

- **Storage**: localStorage (configurable)
- **Lifetime**: Long-lived (typically 7-30 days)
- **Usage**: Used to obtain new access tokens
- **Rotation**: Can be rotated on each refresh (backend-dependent)

### Token Refresh Strategy

1. **Proactive Refresh**: Check token expiry before API calls
2. **Reactive Refresh**: Handle 401 responses and retry
3. **Buffer Time**: Refresh 5 minutes before expiry
4. **Concurrent Requests**: Prevent multiple refresh calls

## Storage Layer

### Abstraction

The storage layer provides a unified interface for different storage mechanisms:

```typescript
interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

### Implementations

1. **LocalStorageAdapter**: Persistent across browser sessions
2. **SessionStorageAdapter**: Cleared when browser closes
3. **MemoryStorageAdapter**: In-memory only (for SSR/testing)

### Usage

```typescript
import { getStorage, setStorage } from "@/auth/storage";

// Use default storage
const storage = getStorage();
storage.setItem("key", "value");

// Replace with custom storage (e.g., for SSR)
setStorage(new SessionStorageAdapter());
```

## Route Protection

### ProtectedRoute

Wraps routes that require authentication:

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// With permissions
<ProtectedRoute requiredPermissions={["dashboard:read"]}>
  <AdminPage />
</ProtectedRoute>
```

**Behavior:**

- Shows loading spinner while initializing
- Redirects to login if not authenticated
- Shows permission denied screen if lacking permissions
- Renders children if authenticated and authorized

### GuestRoute

Wraps routes for unauthenticated users only:

```typescript
<GuestRoute>
  <LoginPage />
</GuestRoute>

// Custom redirect
<GuestRoute redirectTo="/dashboard">
  <RegisterPage />
</GuestRoute>
```

**Behavior:**

- Shows loading spinner while initializing
- Redirects to dashboard if already authenticated
- Renders children if not authenticated

## HTTP Interception

### Request Interception

```typescript
import { attachAuthToken } from "@/auth/http-interceptor";

const headers = await attachAuthToken({
  "Content-Type": "application/json",
});
// Returns: { "Content-Type": "application/json", "Authorization": "Bearer <token>" }
```

### Response Interception

```typescript
import { handleUnauthorized } from "@/auth/http-interceptor";

const response = await handleUnauthorized(async () => {
  return await fetch("/api/protected");
});
// Handles 401, refreshes token, retries request
```

### Retry Logic

```typescript
import { retryRequest } from "@/auth/http-interceptor";

const data = await retryRequest(() => fetchData(), { maxRetries: 3, retryDelay: 1000 });
// Exponential backoff: 1s, 2s, 4s
```

## Authentication Components

### AuthLoadingSpinner

Full-page loading indicator shown during auth initialization:

```typescript
<AuthLoadingSpinner />
```

### UnauthorizedScreen

Shown when user tries to access protected route without login:

```typescript
<UnauthorizedScreen />
```

### PermissionDeniedScreen

Shown when user lacks required permissions:

```typescript
<PermissionDeniedScreen requiredPermissions={["admin:access"]} />
```

### SessionExpiredDialog

Modal dialog shown when session expires:

```typescript
<SessionExpiredDialog isOpen={showDialog} onClose={handleClose} />
```

## Configuration

### Auth Config

```typescript
import { authConfig } from "@/auth/auth.config";

// Storage
authConfig.storage.type; // "localStorage" | "sessionStorage" | "memory"

// Tokens
authConfig.tokens.refreshBuffer; // 5 minutes

// Session
authConfig.session.inactivityTimeout; // 30 minutes

// Routes
authConfig.routes.login; // "/login"

// Endpoints
authConfig.endpoints.login; // "/auth/login"

// Features
authConfig.features.enableEmailVerification; // true
```

### Environment Variables

```typescript
// src/config/env.ts
export const env = {
  VITE_API_BASE_URL: getEnv("VITE_API_BASE_URL", "http://localhost:8000"),
} as const;
```

## Usage Examples

### Basic Usage

```typescript
import { useAuth } from "@/auth/useAuth";

function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Redirect to dashboard
    } catch (error) {
      // Error is already set in context
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p>{error.message}</p>}
      <button disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Protected Route

```typescript
import { ProtectedRoute } from "@/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Route path="/dashboard" component={() => (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )} />
      </Router>
    </AuthProvider>
  );
}
```

### Checking Permissions

```typescript
import { useAuth } from "@/auth/useAuth";

function AdminPanel() {
  const { user } = useAuth();

  const hasAdminAccess = user?.permissions.includes("admin:access");

  if (!hasAdminAccess) {
    return <PermissionDeniedScreen />;
  }

  return <AdminDashboard />;
}
```

### Manual Token Management

```typescript
import { attachAuthToken, handleUnauthorized } from "@/auth/http-interceptor";

async function apiCall() {
  const headers = await attachAuthToken({
    "Content-Type": "application/json",
  });

  const response = await handleUnauthorized(async () => {
    return fetch("/api/protected", { headers });
  });

  return response?.json();
}
```

## Future Backend Integration

### Step 1: Implement API Service

Replace TODO placeholders in `auth.service.ts`:

```typescript
export const authService = {
  login: async (data: LoginRequest) => {
    const response = await request<ApiResponse<{ user: User; tokens: Tokens; session: Session }>>({
      method: "POST",
      path: "/auth/login",
      body: data,
    });
    return response.data;
  },
  // ... other methods
};
```

### Step 2: Connect AuthProvider

Update `AuthProvider.tsx` to use the service:

```typescript
import { authService } from "./auth.service";

const login = useCallback(async (email: string, password: string) => {
  const response = await authService.login({ email, password });
  // Store and update state
}, []);
```

### Step 3: Add to Application

Wrap app with AuthProvider in root route:

```typescript
// src/routes/__root.tsx
import { AuthProvider } from "@/auth/AuthProvider";

function RootComponent() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryProvider>
  );
}
```

### Step 4: Configure Routes

Add auth routes and protection:

```typescript
<Route path="/login" component={() => (
  <GuestRoute>
    <LoginPage />
  </GuestRoute>
)} />

<Route path="/dashboard" component={() => (
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
)} />
```

### Step 5: Implement Token Refresh

Update `http-interceptor.ts`:

```typescript
async function refreshAccessToken(refreshToken: string): Promise<Tokens> {
  const response = await authService.refreshToken({ refreshToken });
  return response.tokens;
}
```

## Best Practices

### Security

- Never store sensitive data in localStorage without encryption
- Use HTTPS in production
- Implement CSRF protection
- Validate tokens on backend
- Rotate refresh tokens regularly

### Performance

- Use `useMemo` for expensive computations
- Implement optimistic updates for login/logout
- Cache user permissions
- Lazy load auth components

### Error Handling

- Always handle network errors
- Provide user-friendly error messages
- Log errors for debugging
- Implement proper error boundaries

### Type Safety

- Use TypeScript for all auth logic
- Export types for reuse
- Avoid `any` types
- Document all public APIs

## Notes

- **No backend connection**: All API calls are TODO placeholders
- **No business logic**: Only infrastructure is implemented
- **Production-ready**: Type-safe, error-handled, follows best practices
- **Flexible**: Easy to customize and extend
- **Testable**: Modular design allows easy testing

## Next Steps

1. Backend team provides authentication API
2. Implement API service methods
3. Connect AuthProvider to service
4. Add AuthProvider to application root
5. Configure routes with guards
6. Implement token refresh logic
7. Add error boundaries
8. Test authentication flows
9. Add unit and integration tests
10. Deploy and monitor
