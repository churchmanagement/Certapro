# Quick Reference - CetaProjectsManager

## 🚀 Quick Start

### Start Development Environment
```bash
# 1. Start Docker
npm run docker:up

# 2. Start Backend
cd backend
npm run dev

# 3. In browser
http://localhost:3001/health
```

---

## 🔑 Test Credentials

```
Admin:  admin@cetraproapp.com  / admin123
User 1: user1@cetraproapp.com  / user123
User 2: user2@cetraproapp.com  / user123
User 3: user3@cetraproapp.com  / user123
```

---

## 🧪 Run Tests

```powershell
# Test Authentication
powershell -ExecutionPolicy Bypass -File test-auth.ps1

# Test File Upload
powershell -ExecutionPolicy Bypass -File test-file-upload.ps1
```

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
```bash
POST   /register          # Register new user
POST   /login             # Login
POST   /refresh           # Refresh token
GET    /me                # Get current user
PUT    /password          # Update password
POST   /logout            # Logout
```

### Users (`/api/users`)
```bash
GET    /                  # List users (admin)
GET    /:userId           # Get user (admin)
POST   /                  # Create user (admin)
PUT    /:userId           # Update user (admin)
DELETE /:userId           # Delete user (admin)
POST   /:userId/activate  # Activate user (admin)
GET    /by-role           # Get by role (admin)
PUT    /fcm-token         # Update FCM token
PUT    /notification-preferences  # Update preferences
POST   /invitations/send  # Send invites (admin)
GET    /invitations       # List invites (admin)
```

### File Uploads (`/api/attachments`)
```bash
POST   /upload            # Upload single file
POST   /upload-multiple   # Upload multiple files
GET    /:id/download      # Get download URL
GET    /:id               # Get attachment info
GET    /                  # List attachments
DELETE /:id               # Delete attachment
```

---

## 🗄️ Database

```bash
# Prisma Studio (Visual DB Browser)
cd backend
npm run db:studio
# Then open: http://localhost:5555

# Reset Database
npx prisma migrate reset

# New Migration
npx prisma migrate dev --name migration_name

# Seed Database
npm run db:seed
```

---

## 📁 Project Structure

```
CetraProApp/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities
│   │   └── validators/   # Request validation
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── .env              # Environment variables
├── docs/                 # Documentation
├── test-*.ps1            # Test scripts
└── *.md                  # Documentation files
```

---

## 📝 Quick Examples

### Login & Get Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cetraproapp.com","password":"admin123"}'
```

### Create User (Admin)
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"pass123","name":"New User","role":"USER"}'
```

### Upload File
```bash
curl -X POST http://localhost:3001/api/attachments/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### Database connection error
```bash
# Restart Docker
npm run docker:down
npm run docker:up
```

### Prisma errors
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## 📚 Documentation Files

- **README.md** - Project overview
- **QUICK_START.md** - Detailed setup guide
- **QUICK_REFERENCE.md** - This file
- **TEST_AUTH.md** - Authentication testing
- **TEST_FILE_UPLOAD.md** - File upload testing
- **API_TESTING.md** - Complete API documentation
- **IMPLEMENTATION_STATUS.md** - Progress tracking
- **NEXT_STEPS.md** - Implementation guide
- **PROJECT_SUMMARY.md** - Complete summary

---

## ✅ Current Status

**Implemented (50% of backend):**
- ✅ Authentication system (7 endpoints)
- ✅ User management (11 endpoints)
- ✅ File upload system (6 endpoints)
- ✅ Multi-channel notifications (SMS, Email, Push)

**Coming Next:**
- ⏳ Project management backend
- ⏳ Notification orchestration
- ⏳ Scheduled reminders
- ⏳ Frontend (Next.js)

---

## 🔧 Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Optional (for full functionality)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
GOOGLE_CLIENT_ID=...
FIREBASE_PROJECT_ID=...
```

---

## 📊 Database Models

- **User** - User accounts & profiles
- **Project** - Project proposals
- **ProjectAttachment** - File attachments
- **ProjectAcceptance** - User acceptances
- **Notification** - Notification records
- **NotificationDelivery** - Delivery tracking
- **AppInvitation** - App invites
- **AuditLog** - Activity logs

---

## 💡 Useful Commands

```bash
# View logs
tail -f backend/logs/combined.log

# Docker logs
docker logs cetraproapp-postgres

# Check Docker status
docker ps

# Access PostgreSQL
docker exec -it cetraproapp-postgres psql -U cetraproapp -d cetraproapp
```

---

**Updated:** 2026-02-10
**Version:** 0.5.0 (Backend 50% complete)
