# Project Management API Guide

## Overview

The Project Service is now fully implemented with comprehensive CRUD operations, acceptance logic, and assignment workflows.

## API Endpoints

### Authentication Required
All project endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Project Management

#### 1. Create Project (Admin Only)
```
POST /api/projects
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Website Redesign Project",
  "description": "Complete redesign of company website with modern UI/UX",
  "proposedAmount": 50000,
  "requiredApprovals": 2
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "project": {
      "id": "uuid",
      "title": "Website Redesign Project",
      "status": "PENDING",
      "currentApprovals": 0,
      "createdBy": { ... }
    }
  }
}
```

#### 2. Get All Projects
```
GET /api/projects?status=PENDING&includeDeleted=false
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "projects": [...],
    "count": 5
  }
}

Query Parameters:
- status: PENDING | APPROVED | ASSIGNED | DELETED
- createdById: UUID (filter by creator)
- assignedToId: UUID (filter by assignee)
- includeDeleted: boolean (default: false)
```

#### 3. Get Project by ID
```
GET /api/projects/:projectId
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "project": {
      "id": "uuid",
      "title": "...",
      "description": "...",
      "proposedAmount": 50000,
      "status": "PENDING",
      "currentApprovals": 1,
      "requiredApprovals": 2,
      "createdBy": { ... },
      "assignedTo": { ... },
      "attachments": [...],
      "acceptances": [...]
    }
  }
}
```

#### 4. Update Project
```
PUT /api/projects/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Project Title",
  "proposedAmount": 60000
}

Response: 200 OK
{
  "status": "success",
  "data": {
    "project": { ... }
  }
}

Notes:
- Only creator or admin can update
- Cannot update deleted projects
```

#### 5. Delete Project (Soft Delete)
```
DELETE /api/projects/:projectId
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "message": "Project deleted successfully"
}

Notes:
- Soft delete (sets deletedAt and status = DELETED)
- Only creator or admin can delete
```

### Project Acceptance

#### 6. Accept Project
```
POST /api/projects/:projectId/accept
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "notes": "I can complete this project by next month"
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "acceptance": {
      "id": "uuid",
      "projectId": "uuid",
      "userId": "uuid",
      "user": { ... },
      "acceptedAt": "2026-02-12T..."
    }
  },
  "message": "Project accepted successfully"
}

Notes:
- User cannot accept same project twice
- Only works for PENDING projects
- Increments currentApprovals
- Auto-changes status to APPROVED when requiredApprovals reached
```

#### 7. Get Project Acceptances
```
GET /api/projects/:projectId/acceptances
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "acceptances": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "acceptedAt": "2026-02-12T...",
        "notes": "..."
      }
    ],
    "count": 2
  }
}
```

### Project Assignment

#### 8. Assign Project (Admin Only)
```
POST /api/projects/:projectId/assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "assignedToId": "user-uuid"
}

Response: 200 OK
{
  "status": "success",
  "data": {
    "project": {
      "id": "uuid",
      "status": "ASSIGNED",
      "assignedTo": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  },
  "message": "Project assigned successfully"
}

Notes:
- Only admins can assign
- Changes status to ASSIGNED
- Assigned user must exist and be active
```

### User-Specific Views

#### 9. Get Pending Projects (My View)
```
GET /api/projects/pending/me
Authorization: Bearer <user_token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "projects": [
      // Projects user hasn't accepted yet
    ],
    "count": 3
  }
}

Notes:
- Returns PENDING projects user hasn't accepted
- Used for user dashboard
```

#### 10. Get My Assigned Projects
```
GET /api/projects/assigned/me
Authorization: Bearer <user_token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "projects": [
      // Projects assigned to me
    ],
    "count": 2
  }
}
```

#### 11. Get My Created Projects
```
GET /api/projects/created/me
Authorization: Bearer <user_token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "projects": [
      // Projects I created
    ],
    "count": 5
  }
}
```

### Statistics

#### 12. Get Project Statistics (Admin Only)
```
GET /api/projects/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "stats": {
      "total": 10,
      "byStatus": {
        "pending": 3,
        "approved": 2,
        "assigned": 4,
        "deleted": 1
      }
    }
  }
}
```

## Project Status Flow

```
PENDING → APPROVED → ASSIGNED
   ↓
DELETED (soft delete)
```

1. **PENDING**: Initial state when project is created
   - Users can accept the project
   - When `currentApprovals >= requiredApprovals`, auto-transitions to APPROVED

2. **APPROVED**: Enough users have accepted
   - Admin can assign to a user
   - Assignment transitions to ASSIGNED

3. **ASSIGNED**: Project given to specific user
   - Final state for active projects

4. **DELETED**: Soft deleted
   - No further actions allowed
   - Still in database with `deletedAt` timestamp

## Testing Workflow

### 1. Setup
```bash
# Start services
npm run docker:up
npm run dev:backend

# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cetraproapp.com","password":"admin123"}'

# Save the accessToken
```

### 2. Create a Project (Admin)
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "Mobile App Development",
    "description": "Develop a cross-platform mobile application",
    "proposedAmount": 75000,
    "requiredApprovals": 2
  }'
```

### 3. Login as Users and Accept
```bash
# Login as user1
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@cetraproapp.com","password":"user123"}'

# Accept project
curl -X POST http://localhost:3001/api/projects/<project_id>/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user1_token>" \
  -d '{"notes":"I am interested in this project"}'

# Repeat with user2
```

### 4. Verify Status Changed to APPROVED
```bash
curl -X GET http://localhost:3001/api/projects/<project_id> \
  -H "Authorization: Bearer <token>"

# Check: "status": "APPROVED", "currentApprovals": 2
```

### 5. Assign Project (Admin)
```bash
curl -X POST http://localhost:3001/api/projects/<project_id>/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"assignedToId":"<user1_id>"}'

# Check: "status": "ASSIGNED"
```

### 6. Check User's Assigned Projects
```bash
curl -X GET http://localhost:3001/api/projects/assigned/me \
  -H "Authorization: Bearer <user1_token>"
```

## Error Handling

All endpoints return consistent error format:
```json
{
  "status": "error",
  "message": "Error description"
}
```

Common error codes:
- `400` - Validation error (bad request)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (project doesn't exist)
- `409` - Conflict (already accepted, already deleted)
- `500` - Internal server error

## Validation Rules

### Create/Update Project
- `title`: 3-200 characters, required
- `description`: min 10 characters, required
- `proposedAmount`: positive number, required
- `requiredApprovals`: 1-10, optional (default: 2)

### Accept Project
- `notes`: max 500 characters, optional

### Assign Project
- `assignedToId`: valid UUID, required, user must exist and be active

## Next Steps

1. **Notification Integration**: Trigger notifications on:
   - Project created → notify all users
   - Project accepted → notify admin
   - Project approved → notify admin
   - Project assigned → notify assigned user

2. **Reminder System**: Cron job to send reminders for projects pending > 2 days

3. **File Attachments**: Link attachment service with project creation

4. **Frontend Integration**: Build UI for all workflows
