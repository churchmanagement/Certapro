# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CetaProjectsManager is a mobile-first PWA for managing project proposals with role-based workflows. Admins submit projects with attachments, users accept them, and multi-channel notifications ensure delivery (push, SMS, email, in-app).

**Current Status:** Backend ~50% complete, Frontend not started. Core auth, user management, and notification services implemented. Project management and notification orchestration pending.

**Tech Stack:**
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis
- **Frontend:** (Planned) Next.js 15, React 18, TypeScript, Tailwind, shadcn/ui
- **Notifications:** Firebase (push), Twilio (SMS), NodeMailer (email)
- **Storage:** AWS S3 for file uploads
- **Auth:** JWT (15m access, 7d refresh), bcrypt, RBAC

## Development Commands

```bash
# Start Docker services (PostgreSQL + Redis)
npm run docker:up
npm run docker:down

# Development servers
npm run dev              # Start both backend and frontend
npm run dev:backend      # Backend only (port 3001)
npm run dev:frontend     # Frontend only (port 3000)

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed with test data
cd backend && npx prisma studio  # Open database GUI (port 5555)
cd backend && npx prisma generate  # Regenerate Prisma client after schema changes

# Build and test
npm run build            # Build all workspaces
npm run lint             # Lint all workspaces
npm run test             # Run tests (when implemented)

# Database migrations (from backend directory)
npx prisma migrate dev --name migration_name  # Create new migration
npx prisma migrate reset                      # Reset database
```

## Architecture

### Backend Structure (Layered Architecture)

```
Routes → Controllers → Services → Prisma → Database
         ↓             ↓
    Validators    Business Logic
```

**Pattern:**
- **Routes** (`routes/*.routes.ts`): Define endpoints, apply validators/middleware
- **Controllers** (`controllers/*.controller.ts`): Handle HTTP request/response, call services
- **Services** (`services/*.service.ts`): Business logic, database operations, external API calls
- **Validators** (`validators/*.validator.ts`): express-validator schemas
- **Middleware** (`middleware/*.middleware.ts`): Auth, RBAC, error handling, file uploads
- **Utils** (`utils/*.ts`): Pure functions (JWT, hashing, logging, errors)

**Error Handling:**
- Custom error classes: `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`
- All inherit from `AppError` with `statusCode` and `isOperational` properties
- Centralized error middleware in `middleware/error.middleware.ts`
- Services throw errors, controllers catch and pass to error middleware

**Service Layer Pattern:**
- Services export classes with methods (not plain functions)
- Use dependency injection pattern (though not yet using DI container)
- Services return plain data, controllers format API responses
- All async operations use try-catch in controllers

### Database (Prisma Schema)

**Key Models:**
- `User` - JWT auth, RBAC (ADMIN/USER), soft deletes (`isActive`), FCM tokens
- `Project` - Proposals with status flow: PENDING → APPROVED → ASSIGNED → DELETED
- `ProjectAttachment` - S3 file metadata with cascade delete
- `ProjectAcceptance` - Many-to-many User↔Project with unique constraint
- `Notification` - Multi-channel delivery tracking
- `NotificationDelivery` - Per-channel status (PUSH/SMS/EMAIL)
- `AppInvitation` - SMS/email invites with token tracking
- `AuditLog` - Comprehensive activity logging

**Important Patterns:**
- Soft deletes: Set `isActive: false` for users, `deletedAt` for projects
- Cascading deletes: Attachments and acceptances cascade with projects
- JSONB fields: `notificationPreferences`, `channels`, `metadata`
- Indexes on: foreign keys, status enums, timestamps, search fields

### Configuration (`backend/src/config/index.ts`)

- All config centralized in `config` object
- Validates required env vars on startup (`validateConfig()`)
- Graceful degradation: Optional services (Firebase, AWS, Twilio) can be missing in dev
- Secrets loaded via dotenv from `backend/.env`

### Logging (`backend/src/utils/logger.ts`)

Winston logger with file + console transports. Use throughout codebase:
- `logger.info()` - General info
- `logger.error()` - Errors (includes stack traces)
- `logger.http()` - HTTP requests (auto-logged by middleware)
- `logger.warn()` - Warnings

## Key Workflows

### Authentication Flow

1. Register: `POST /api/auth/register` → Hash password → Create user → Return tokens
2. Login: `POST /api/auth/login` → Verify password → Update `lastLoginAt` → Return tokens
3. Refresh: `POST /api/auth/refresh` → Verify refresh token → Issue new token pair
4. Protected routes use `authenticate` middleware (extracts JWT from `Authorization: Bearer`)
5. Role checks use `requireRole(['ADMIN'])` middleware

**JWT Payload:**
```typescript
{ userId: string, email: string, role: UserRole }
```

### User Management

- CRUD operations in `services/user.service.ts`
- Admin-only endpoints: create/update/delete users, list all users
- Users can update self via `PATCH /api/users/me`
- Soft deletes: Set `isActive: false`, keep in database
- Invitations: `POST /api/users/invite` sends SMS/email with app install link

### File Upload Flow (AWS S3)

1. Client uploads to `POST /api/attachments`
2. `multer` middleware validates file (size, type)
3. `storage.service.ts` uploads to S3 with generated filename
4. Metadata saved to `ProjectAttachment` table
5. Returns S3 URL for download
6. Delete: Remove from S3 and database

**File Validation:**
- Max size: 10MB (configurable via `MAX_FILE_SIZE`)
- Allowed types: Configured via `ALLOWED_FILE_TYPES` env var
- Middleware: `middleware/upload.middleware.ts`

### Notification System (Not Yet Fully Implemented)

**Architecture:**
1. Create `Notification` record with channels array
2. Orchestrator sends to all channels in parallel
3. Create `NotificationDelivery` record per channel with status
4. Retry logic for failed deliveries
5. Mark `Notification.status = SENT` when all channels succeed

**Services:**
- `sms.service.ts` - Twilio integration
- `email.service.ts` - NodeMailer with HTML templates
- `push.service.ts` - Firebase Cloud Messaging

**Notification Types:**
- `PROJECT_SUBMITTED` - New project available for acceptance
- `PROJECT_ASSIGNED` - Project assigned to you
- `PROJECT_ACCEPTED` - User accepted your project (to admin)
- `REMINDER` - 2-day reminder for pending approvals
- `PROJECT_DELETED` - Project was deleted
- `PROJECT_DECLINED` - Project assigned to someone else

## Testing

**Test Credentials (seeded data):**
- Admin: `admin@cetraproapp.com` / `admin123`
- Users: `user1@cetraproapp.com` / `user123` (also user2, user3)

**Manual API Testing:**
1. Start services: `npm run docker:up && npm run dev:backend`
2. Login to get access token
3. Use token in `Authorization: Bearer <token>` header
4. See `API_TESTING.md` for full endpoint documentation

## Important Conventions

### API Response Format

```typescript
// Success
{ status: 'success', data: { ... } }

// Error
{ status: 'error', message: 'Error description' }
```

### Database Operations

- Always use Prisma client via `import prisma from '../config/database'`
- Use `select` to exclude sensitive fields (e.g., `passwordHash`)
- Use transactions for multi-model operations
- After schema changes: Run `npx prisma generate` then `npx prisma migrate dev`

### Security

- Never log or return `passwordHash` fields
- Rate limiting: 100 requests per 15 minutes (configurable)
- CORS restricted to `FRONTEND_URL`
- Helmet.js for security headers
- Bcrypt rounds: 10 (balance of security and performance)
- JWT expiry: Access 15m, Refresh 7d

### File Paths

- Always use absolute paths for file references
- Line numbers format: `file_path:line_number`

## Third-Party Service Setup

**Required for production:**
- **Google OAuth** - Get client ID/secret from Google Console
- **Firebase** - Project credentials for push notifications
- **AWS S3** - Bucket and IAM credentials for file storage
- **Twilio** - Account SID and auth token (already provided: SID=AC86659d0b54792586f257d54b7f301274)
- **Email Provider** - SMTP credentials (SendGrid, AWS SES, etc.)

**Environment Variables:**
Copy `backend/.env.example` to `backend/.env` and fill required values:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Min 32 chars, cryptographically random
- `JWT_REFRESH_SECRET` - Min 32 chars, different from JWT_SECRET

## Project Service (Implemented)

Full CRUD operations with business logic:
- **Create/Update/Delete**: Admin or creator can manage projects
- **Acceptance Flow**: Users accept projects → increments `currentApprovals` → auto-transitions to APPROVED when threshold reached
- **Assignment**: Admins assign APPROVED projects to users → status becomes ASSIGNED
- **Status Flow**: PENDING → APPROVED → ASSIGNED (with DELETED for soft deletes)
- **User Views**: Pending projects, assigned projects, created projects
- **Permissions**: Role-based (admins create/assign, users accept)

See `PROJECT_API_GUIDE.md` for complete API documentation.

## Notification Orchestration (Implemented)

Full multi-channel notification system:
- **Auto-triggers**: Project created, accepted, approved, assigned, declined, deleted
- **Channels**: Push (FCM), SMS (Twilio), Email (NodeMailer), In-app (Database)
- **User Preferences**: Per-channel control via `notificationPreferences` JSONB
- **Delivery Tracking**: Per-channel status (SUCCESS/FAILED) with error logging
- **Non-blocking**: All notifications sent asynchronously, don't block API responses
- **Graceful Degradation**: System works even if external services unavailable
- **API Endpoints**: Get notifications, mark as read, mark all read, cleanup (admin)

Integration points:
- `notificationService.notifyProjectSubmitted()` - After project created
- `notificationService.notifyProjectAccepted()` - After user accepts
- `notificationService.notifyProjectApproved()` - When approval threshold reached
- `notificationService.notifyProjectAssigned()` - After admin assigns
- `notificationService.notifyProjectDeclined()` - Notify rejected users
- `notificationService.notifyProjectDeleted()` - After project deleted
- `notificationService.sendProjectReminder()` - For cron job (not yet scheduled)

See `NOTIFICATION_SYSTEM.md` for complete documentation.

## Reminder Cron Job (Implemented)

Automated reminder system for pending projects:
- **Schedule**: Configurable via `REMINDER_CRON_SCHEDULE` (default: daily at 9 AM)
- **Threshold**: Configurable days before reminder (default: 2 days)
- **Smart Targeting**: Only notifies users who haven't accepted
- **Re-reminders**: Can remind again if project still pending
- **Multi-channel**: Uses notification orchestrator (push, SMS, email, in-app)
- **Admin Control**: 3 endpoints (stats, projects, trigger)
- **Graceful**: Starts with server, stops on shutdown
- **Tracked**: Updates `project.reminderSentAt` timestamp

See `REMINDER_SYSTEM.md` for complete documentation.

## Frontend Setup (Implemented)

Complete Next.js 15 foundation:
- **Framework**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand (global) + React Query (server state, 30s polling)
- **API**: Axios client with auto token refresh
- **PWA**: next-pwa configured, manifest ready
- **Components**: Button, Card, Toast, Toaster
- **Auth Store**: Persistent auth state with tokens
- **Responsive**: Mobile-first, safe area insets

See `FRONTEND_SETUP_SUMMARY.md` and `frontend/README.md` for details.

## Known Issues

- Frontend feature pages not built (auth, projects, dashboard pending)
- OAuth routes commented out (needs Passport.js configuration)
- Test suite not written (Jest configured but no tests)
- FCM token cleanup not automated (logged but requires manual removal)
- Reminder digest mode not implemented (individual notifications per project)
- App icons not generated (manifest references missing files)

## Next Implementation Priorities

1. **Auth Pages** - Login and register UI
2. **Project Pages** - List, detail, acceptance workflow UI
3. **Admin Dashboard** - Project creation, user management, analytics
4. **Notification Center** - Notification list and management UI
5. **API Tests** - Jest integration tests for all endpoints
