# Key Facts

This file stores project configuration, constants, and frequently-needed **non-sensitive** information.

## ⚠️ Security Warning

**NEVER store passwords, API keys, or sensitive credentials in this file.** This file is committed to version control.

**❌ Never store:** Passwords, API keys, tokens, service account keys, private keys, secrets
**✅ Safe to store:** Hostnames, ports, project IDs, URLs, service account emails, environment names

---

## Project Information

- **Project Name**: MemeStore
- **Repository**: FiveGuays/memes

## API Configuration

- **OpenAPI Spec:** `ai-specs/specs/api-spec.yaml`
- **Frontend types:** `frontend/lib/api/types.ts` (auto-generated from OpenAPI)
- **Generate types:** `cd frontend && npm run generate:api`
- **Backend base URL:** http://localhost:3000/api

## Local Development

| Service | Command | Port |
|---------|---------|------|
| Backend | `cd backend && npm run dev` | 3000 |
| Frontend | `cd frontend && npm run dev` | 3001 |

## Frontend Reusable Components

### Auth Components (`frontend/components/auth/`)
- `RegisterForm` - Registration form with password strength indicator
- `LoginForm` - Login form with role-based redirect (TARGET→/, others→/dashboard)
- `PasswordStrength` - Visual password requirements checklist
- `UserMenu` - Auth-aware dropdown: Login/Register links (unauth) or user initial + email + role badge + logout (auth)
- `ProtectedRoute` - Route guard with role-based access and returnTo redirect

### UI Primitives (`frontend/components/ui/`)
- `Button`, `Input`, `Label`, `Card`, `Alert` (shadcn/ui)

### Validations (`frontend/lib/validations/auth.ts`)
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password policy check (12+ chars, uppercase, lowercase, number)
- `validatePasswordMatch(password, confirm)` - Confirm password match

### Services (`frontend/lib/services/`)
- `authService` - login, register, logout, refresh, forgotPassword, resetPassword

### Stores (`frontend/stores/`)
- `authStore` (Zustand) - user, tokens, isAuthenticated, loading, error states

## Backend Reusable Components

### Domain Entities (`backend/src/domain/entities/`)
- `User` - User entity with auth fields

### Domain Errors (`backend/src/domain/errors/`)
- `AuthError` - ValidationError, AuthenticationError, NotFoundError, ConflictError, ForbiddenError

### Services (`backend/src/application/services/`)
- `authService` - register, login, logout, refresh, password reset
- `tokenService` - JWT generation, verification, refresh token rotation

### Validators (`backend/src/application/validators/`)
- `authValidator` - validateRegisterInput, validateLoginInput, validateRefreshInput, etc.

### Middleware (`backend/src/presentation/middleware/`)
- `authMiddleware` - JWT verification, request user injection
- `requireRole` - Role-based access control

