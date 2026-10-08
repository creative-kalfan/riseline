# CareerOS Frontend API Documentation

## Overview

This document describes the frontend API integration infrastructure for CareerOS. The architecture is designed to prepare the application for backend integration without modifying the UI or replacing mock data.

## Folder Structure

```
src/
├── api/                          # API layer - service methods and configuration
│   ├── client.ts                 # Global API client instance
│   ├── config.ts                 # API configuration (base URL, headers, timeout)
│   ├── index.ts                  # Barrel exports for all API modules
│   ├── auth.ts                   # Authentication API methods
│   ├── resume.ts                 # Resume management API methods
│   ├── ats.ts                    # ATS analysis API methods
│   ├── jobs.ts                   # Job search and management API methods
│   ├── recommendations.ts        # Recommendations API methods
│   ├── applications.ts           # Job applications API methods
│   ├── dashboard.ts              # Dashboard statistics API methods
│   ├── notifications.ts          # Notifications API methods
│   └── copilot.ts                # AI Copilot API methods
│
├── config/
│   └── env.ts                    # Environment variable management
│
├── types/
│   └── api/
│       ├── index.ts              # Barrel exports for API types
│       ├── ApiResponse.ts        # Generic API response wrapper
│       ├── ApiError.ts           # API error type definition
│       └── Pagination.ts         # Pagination types and params
│
├── providers/
│   └── query-provider.tsx        # TanStack Query provider wrapper
│
├── hooks/
│   └── api/
│       └── index.ts              # Feature-specific API hooks (future)
│
├── utils/
│   ├── api-error.ts              # API error handling utilities
│   └── request.ts                # Core HTTP request function
│
└── constants/
    ├── api.ts                    # API endpoint constants
    └── routes.ts                 # Application route constants
```

## API Layer

### Architecture

The API layer follows a service-oriented architecture where each domain (auth, resume, jobs, etc.) has its own module with typed methods.

### Core Components

#### 1. API Client (`src/api/client.ts`)

Global client instance that holds the QueryClient reference.

```typescript
import { apiClient } from "@/api/client";

// Set QueryClient after app initialization
apiClient.setQueryClient(queryClient);
```

#### 2. API Configuration (`src/api/config.ts`)

Centralized configuration for all API requests.

```typescript
import { apiConfig } from "@/api/config";

// Configuration includes:
// - baseUrl: From environment variable VITE_API_BASE_URL
// - timeout: 30 seconds
// - defaultHeaders: Content-Type: application/json
```

#### 3. Request Utility (`src/utils/request.ts`)

Core HTTP request function with:

- Automatic JSON serialization
- Timeout handling via AbortController
- Standardized error handling
- Type-safe responses

```typescript
import { request } from "@/utils/request";

// Usage in API modules
const data = await request<ResponseType>({
  method: "GET",
  path: "/endpoint",
});
```

#### 4. Error Handling (`src/utils/api-error.ts`)

Standardized error handling with:

- `ApiClientError` class for API errors
- Type guards for error checking
- Helper functions for error message extraction

```typescript
import { ApiClientError, isApiError, getErrorMessage } from "@/utils/api-error";

try {
  await someApiCall();
} catch (error) {
  if (isApiError(error)) {
    console.error(error.statusCode, error.code);
  }
  console.error(getErrorMessage(error));
}
```

### API Modules

Each API module exports:

- **Type definitions**: Request/response types
- **Service object**: Object with typed methods
- **TODO implementations**: Placeholder methods ready for backend integration

#### Example: Auth API

```typescript
import { authApi } from "@/api/auth";

// Types
type LoginRequest = { email: string; password: string };
type LoginResponse = { accessToken: string; refreshToken: string; user: User };

// Usage
const response = await authApi.login({ email, password });
```

#### Available API Modules

- **auth.ts**: Login, logout, token refresh, current user
- **resume.ts**: CRUD operations for resumes
- **ats.ts**: ATS analysis and history
- **jobs.ts**: Job search, save, unsave operations
- **recommendations.ts**: Personalized recommendations
- **applications.ts**: Job application tracking
- **dashboard.ts**: Statistics and activity feeds
- **notifications.ts**: Notification management
- **copilot.ts**: AI assistant messaging

## Query Layer

### TanStack Query Configuration

The QueryProvider (`src/providers/query-provider.tsx`) configures:

```typescript
{
  queries: {
    retry: 1,                    // Retry failed queries once
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes cache
  },
  mutations: {
    retry: 1,                    // Retry failed mutations once
  },
}
```

### Integration

The QueryProvider wraps the application in `src/routes/__root.tsx`:

```typescript
function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  );
}
```

## Shared Types

### ApiResponse<T>

Generic wrapper for successful API responses:

```typescript
type ApiResponse<T> = {
  data: T;
  message?: string;
  status: "success" | "error";
};
```

### ApiError

Standardized error structure:

```typescript
type ApiError = {
  message: string;
  code?: string;
  statusCode: number;
  details?: Record<string, unknown>;
};
```

### Pagination

Types for paginated responses:

```typescript
type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
```

## Constants

### API Endpoints (`src/constants/api.ts`)

Centralized endpoint definitions:

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    // ...
  },
  RESUME: {
    LIST: "/resumes",
    GET: (id: string) => `/resumes/${id}`,
    // ...
  },
  // ... other endpoints
};
```

### HTTP Status Codes

```typescript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
```

### Application Routes (`src/constants/routes.ts`)

Type-safe route constants:

```typescript
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  RESUME: {
    LIST: "/resume",
    EDITOR: "/resume/:id",
    NEW: "/resume/new",
  },
  // ... other routes
};
```

## Environment Variables

### Configuration (`src/config/env.ts`)

Safe environment variable access with defaults:

```typescript
export const env = {
  VITE_API_BASE_URL: getEnv("VITE_API_BASE_URL", "http://localhost:8000"),
} as const;
```

### Usage

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://api.careeros.com/api
```

## Future Integration Flow

### Step 1: Implement API Methods

Replace TODO implementations in API modules:

```typescript
// src/api/auth.ts
export const authApi: AuthApi = {
  login: async (data: LoginRequest) => {
    return request<ApiResponse<LoginResponse>>({
      method: "POST",
      path: API_ENDPOINTS.AUTH.LOGIN,
      body: data,
    });
  },
  // ... other methods
};
```

### Step 2: Create Feature Hooks

Add React Query hooks in `src/hooks/api/`:

```typescript
// src/hooks/api/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
    // ... options
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUser,
    // ... options
  });
}
```

### Step 3: Integrate with Components

Use hooks in components:

```typescript
import { useLogin } from "@/hooks/api/useAuth";

function LoginForm() {
  const login = useLogin();

  const handleSubmit = async (data: LoginRequest) => {
    try {
      const response = await login.mutateAsync(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
}
```

### Step 4: Add Authentication

Implement authentication flow:

- Store tokens in secure storage
- Add request interceptors for auth headers
- Handle token refresh
- Implement logout

### Step 5: Connect to Backend

- Update `VITE_API_BASE_URL` in `.env`
- Test API connectivity
- Handle CORS configuration
- Implement error boundaries

## Best Practices

### Type Safety

- All API methods are fully typed
- Use exported types for request/response data
- Leverage TypeScript for compile-time checks

### Error Handling

- Always use try-catch with API calls
- Use `isApiError()` to check error types
- Display user-friendly error messages

### Query Optimization

- Use appropriate `staleTime` for different data types
- Implement optimistic updates for mutations
- Use query invalidation after mutations

### Performance

- Enable `gcTime` to cache data
- Use `refetchOnWindowFocus: false` to prevent unnecessary requests
- Implement pagination for large datasets

## Notes

- **No UI changes**: This infrastructure does not modify any existing UI components
- **No mock replacement**: Mock data remains in place until backend is ready
- **No business logic**: Only integration infrastructure is added
- **Production ready**: Type-safe, error-handled, and follows best practices

## Next Steps

1. Backend team provides API endpoints
2. Implement API methods in each module
3. Create feature-specific hooks
4. Replace mock data with real API calls
5. Add authentication flow
6. Test integration thoroughly
