# Quick Start Guide - CetaProjectsManager

## Prerequisites
- Node.js >= 18.0.0
- Docker and Docker Compose
- npm >= 9.0.0

## Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

## Step 2: Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env
```

Edit `backend/.env` and update these **REQUIRED** variables:

```env
# Generate secure secrets (use openssl or similar)
JWT_SECRET=your-generated-secret-min-32-chars
JWT_REFRESH_SECRET=your-generated-refresh-secret-min-32-chars

# Database (already set for local Docker)
DATABASE_URL=postgresql://cetraproapp:cetraproapp_dev_password@localhost:5432/cetraproapp
```

**Optional** - Add third-party credentials (can be added later):
- Google OAuth (for social login)
- Firebase (for push notifications)
- AWS S3 (for file uploads)
- SendGrid (for email notifications)

## Step 3: Start Database

```bash
# Start PostgreSQL and Redis with Docker
npm run docker:up

# Verify containers are running
docker ps
```

## Step 4: Initialize Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with test data
npm run db:seed
```

You should see:
```
✅ Admin user created: admin@cetraproapp.com
✅ Test users created: [user1@cetraproapp.com, user2@cetraproapp.com, user3@cetraproapp.com]
✅ Sample project created: Sample Project - Website Redesign
```

## Step 5: Start Backend Server

```bash
# From backend directory
npm run dev

# Or from root directory
npm run dev:backend
```

You should see:
```
🚀 Server running on port 3001
📝 Environment: development
✅ Database connected successfully
```

## Step 6: Test the API

### Health Check
```bash
curl http://localhost:3001/health
```

### Register a New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User",
    "phone": "+1234567890"
  }'
```

### Login with Seeded Admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cetraproapp.com",
    "password": "admin123"
  }'
```

Save the `accessToken` from the response!

### Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Test Credentials

### Admin Account
- Email: `admin@cetraproapp.com`
- Password: `admin123`

### User Accounts
- Email: `user1@cetraproapp.com` / Password: `user123`
- Email: `user2@cetraproapp.com` / Password: `user123`
- Email: `user3@cetraproapp.com` / Password: `user123`

## Database Management

### Open Prisma Studio (Visual Database Browser)
```bash
cd backend
npm run db:studio
```
Access at: http://localhost:5555

### Reset Database
```bash
cd backend
npx prisma migrate reset
npm run db:seed
```

### Create New Migration
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps

# Restart Docker containers
npm run docker:down
npm run docker:up

# Check logs
docker logs cetraproapp-postgres
```

### Port Already in Use
```bash
# Kill process on port 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change PORT in .env
```

### Prisma Client Issues
```bash
cd backend
npx prisma generate
```

## Next Steps

1. **Complete User Management** - Create user CRUD endpoints
2. **Add File Uploads** - Integrate AWS S3 for attachments
3. **Build Project Management** - Project submission and acceptance
4. **Implement Notifications** - Multi-channel notification system
5. **Create Frontend** - Next.js PWA application

See `IMPLEMENTATION_STATUS.md` for detailed progress tracking.

## Useful Commands

```bash
# View logs
docker logs -f cetraproapp-postgres

# Access PostgreSQL shell
docker exec -it cetraproapp-postgres psql -U cetraproapp -d cetraproapp

# Stop all services
npm run docker:down

# Run tests (when implemented)
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `FIREBASE_PROJECT_ID` | No | Firebase project for push notifications |
| `AWS_S3_BUCKET` | No | S3 bucket for file uploads |
| `TWILIO_ACCOUNT_SID` | No | Twilio account (already provided) |
| `EMAIL_HOST` | No | SMTP host for emails |

## Support

For issues or questions:
1. Check `IMPLEMENTATION_STATUS.md` for current progress
2. Review `README.md` for architecture details
3. Check backend logs: `backend/logs/combined.log`
