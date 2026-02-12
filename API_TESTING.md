# API Testing Guide - CetaProjectsManager

## Base URL
```
Development: http://localhost:3001
Production: https://your-production-url.com
```

## Authentication Flow

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 1. Authentication Endpoints

### 1.1 Register New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "USER",
      "isActive": true,
      "createdAt": "2026-02-10T..."
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### 1.2 Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cetraproapp.com",
    "password": "admin123"
  }'
```

**Response:** Same as register

### 1.3 Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "tokens": {
      "accessToken": "new-access-token",
      "refreshToken": "new-refresh-token"
    }
  }
}
```

### 1.4 Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@cetraproapp.com",
      "name": "Admin User",
      "phone": "+1234567890",
      "role": "ADMIN",
      "isActive": true,
      "notificationPreferences": {
        "push": true,
        "sms": true,
        "email": true,
        "inApp": true
      },
      "createdAt": "2026-02-10T...",
      "lastLoginAt": "2026-02-10T..."
    }
  }
}
```

### 1.5 Update Password
```bash
curl -X PUT http://localhost:3001/api/auth/password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newpassword123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Password updated successfully"
  }
}
```

### 1.6 Logout
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "optional-fcm-token-to-clear"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## 2. User Management Endpoints (Admin Only)

### 2.1 Get All Users
```bash
curl -X GET "http://localhost:3001/api/users?includeInactive=false" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user1@cetraproapp.com",
        "name": "John Doe",
        "phone": "+1234567891",
        "role": "USER",
        "isActive": true,
        "createdAt": "2026-02-10T...",
        "lastLoginAt": "2026-02-10T...",
        "_count": {
          "projectAcceptances": 5,
          "assignedProjects": 2
        }
      }
    ],
    "count": 4
  }
}
```

### 2.2 Get User By ID
```bash
curl -X GET http://localhost:3001/api/users/USER_UUID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### 2.3 Create User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User",
    "phone": "+1234567890",
    "role": "USER",
    "notes": "Optional notes about this user"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "New User",
      "phone": "+1234567890",
      "role": "USER",
      "isActive": true,
      "createdAt": "2026-02-10T..."
    }
  }
}
```

### 2.4 Update User
```bash
curl -X PUT http://localhost:3001/api/users/USER_UUID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "+9876543210",
    "notes": "Updated notes",
    "isActive": true
  }'
```

### 2.5 Delete User (Soft Delete)
```bash
curl -X DELETE http://localhost:3001/api/users/USER_UUID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "User deactivated successfully"
  }
}
```

### 2.6 Activate User
```bash
curl -X POST http://localhost:3001/api/users/USER_UUID/activate \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "User activated successfully"
  }
}
```

### 2.7 Get Users By Role
```bash
# Get all active users
curl -X GET "http://localhost:3001/api/users/by-role?role=USER&activeOnly=true" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"

# Get all admins (including inactive)
curl -X GET "http://localhost:3001/api/users/by-role?role=ADMIN&activeOnly=false" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user1@cetraproapp.com",
        "name": "John Doe",
        "phone": "+1234567890",
        "isActive": true
      }
    ],
    "count": 3
  }
}
```

---

## 3. User Profile Endpoints (Any Authenticated User)

### 3.1 Update FCM Token
```bash
curl -X PUT http://localhost:3001/api/users/fcm-token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "firebase-cloud-messaging-token-here"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "FCM token updated successfully"
  }
}
```

### 3.2 Update Notification Preferences
```bash
curl -X PUT http://localhost:3001/api/users/notification-preferences \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "push": true,
    "sms": false,
    "email": true,
    "inApp": true
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Notification preferences updated successfully"
  }
}
```

---

## 4. Invitation Endpoints (Admin Only)

### 4.1 Send Invitations
```bash
# Send email invitations
curl -X POST http://localhost:3001/api/users/invitations/send \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "user1@example.com",
      "user2@example.com"
    ],
    "phones": [
      "+1234567890",
      "+9876543210"
    ]
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Invitations processed",
    "invitations": [
      {
        "type": "email",
        "recipient": "user1@example.com",
        "sent": true,
        "token": "uuid"
      },
      {
        "type": "email",
        "recipient": "user2@example.com",
        "sent": true,
        "token": "uuid"
      },
      {
        "type": "sms",
        "recipient": "+1234567890",
        "sent": true,
        "token": "uuid"
      },
      {
        "type": "sms",
        "recipient": "+9876543210",
        "sent": true,
        "token": "uuid"
      }
    ]
  }
}
```

### 4.2 Get Sent Invitations
```bash
curl -X GET http://localhost:3001/api/users/invitations \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "invitations": [
      {
        "id": "uuid",
        "adminId": "admin-uuid",
        "invitedEmail": "user1@example.com",
        "invitedPhone": null,
        "inviteToken": "token-uuid",
        "sentVia": "email",
        "status": "OPENED",
        "createdAt": "2026-02-10T...",
        "openedAt": "2026-02-10T...",
        "installedAt": null
      }
    ],
    "count": 5
  }
}
```

---

## 5. Health Check

### 5.1 Health Endpoint
```bash
curl -X GET http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T12:00:00.000Z",
  "uptime": 12345.678,
  "environment": "development"
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

### Common Error Codes

- **400 Bad Request**: Validation error
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (e.g., email exists)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

---

## Testing Workflow

### Complete Authentication Flow Test

```bash
# 1. Register a new user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}')

# 2. Extract access token (requires jq)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.tokens.accessToken')

# 3. Get current user
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Update notification preferences
curl -X PUT http://localhost:3001/api/users/notification-preferences \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"push":true,"sms":true,"email":true,"inApp":true}'
```

### Admin Workflow Test

```bash
# 1. Login as admin
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cetraproapp.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.tokens.accessToken')

# 2. Get all users
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Create a new user
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@example.com",
    "password":"user123",
    "name":"New User",
    "role":"USER"
  }'

# 4. Send invitations
curl -X POST http://localhost:3001/api/users/invitations/send \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emails":["invite1@example.com","invite2@example.com"]}'
```

---

## Postman Collection

Save this as `CetaProjectsManager.postman_collection.json`:

```json
{
  "info": {
    "name": "CetaProjectsManager API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"test123\",\n  \"name\": \"Test User\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/login",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@cetraproapp.com\",\n  \"password\": \"admin123\"\n}"
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/auth/me",
            "header": [{"key": "Authorization", "value": "Bearer {{accessToken}}"}]
          }
        }
      ]
    }
  ]
}
```

---

## Testing Tips

1. **Use Environment Variables**: Store your tokens in environment variables
2. **Test in Order**: Follow the authentication flow before testing protected endpoints
3. **Check Logs**: Monitor `backend/logs/combined.log` for debugging
4. **Use Prisma Studio**: Verify database changes at http://localhost:5555
5. **Test Error Cases**: Try invalid tokens, missing fields, etc.

---

## Next API Endpoints (To Be Implemented)

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/accept` - Accept project
- `POST /api/projects/:id/assign` - Assign project

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Attachments
- `POST /api/attachments/upload` - Upload file
- `GET /api/attachments/:id/download` - Download file
- `DELETE /api/attachments/:id` - Delete file

### Analytics (Admin)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/reports/projects` - Project reports
- `GET /api/admin/reports/users` - User reports
