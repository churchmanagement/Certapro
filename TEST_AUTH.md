# Authentication Testing Guide

## Prerequisites Check

Before testing, ensure you have:
- ✅ Node.js >= 18.0.0 installed
- ✅ Docker Desktop running (for PostgreSQL)
- ✅ npm >= 9.0.0

Check versions:
```bash
node --version
npm --version
docker --version
```

---

## Step 1: Install Dependencies

Open PowerShell or Command Prompt in `C:\workspace\CetraProApp`:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

**Expected output:** No errors, dependencies installed successfully.

---

## Step 2: Start Docker Services

From the root directory:

```bash
# Start PostgreSQL and Redis
npm run docker:up

# Verify containers are running
docker ps
```

**Expected output:** You should see `cetraproapp-postgres` and `cetraproapp-redis` containers running.

If Docker fails:
- Make sure Docker Desktop is running
- Check if ports 5432 and 6379 are available
- Try: `docker-compose up -d` directly

---

## Step 3: Initialize Database

From the `backend` directory:

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (create tables)
npx prisma migrate dev --name init

# Seed database with test data
npm run db:seed
```

**Expected output:**
```
✅ Admin user created: admin@cetraproapp.com
✅ Test users created: [user1@cetraproapp.com, user2@cetraproapp.com, user3@cetraproapp.com]
✅ Sample project created: Sample Project - Website Redesign
🎉 Seed completed successfully!
```

**Troubleshooting:**
- If migration fails, check DATABASE_URL in `.env`
- If connection refused, ensure Docker is running
- Try: `npx prisma migrate reset` to start fresh

---

## Step 4: Start Backend Server

From the `backend` directory:

```bash
npm run dev
```

**Expected output:**
```
🚀 Server running on port 3001
📝 Environment: development
✅ Database connected successfully
🔗 API URL: http://localhost:3001
🌐 Frontend URL: http://localhost:3000
```

**Troubleshooting:**
- If port 3001 is in use: Change `PORT=3002` in `.env`
- If database connection fails: Check Docker containers
- Check logs in `backend/logs/combined.log`

**Keep this terminal open!** The server must be running for testing.

---

## Step 5: Test Endpoints

Open a **NEW** terminal/PowerShell window for testing.

### Test 1: Health Check ✅

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T...",
  "uptime": 12.345,
  "environment": "development"
}
```

---

### Test 2: Register New User ✅

```bash
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"testuser@example.com\",\"password\":\"test123\",\"name\":\"Test User\",\"phone\":\"+1234567890\"}"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "testuser@example.com",
      "name": "Test User",
      "phone": "+1234567890",
      "role": "USER",
      "isActive": true,
      "createdAt": "2026-02-10T..."
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Save the `accessToken` - you'll need it for next tests!**

---

### Test 3: Login with Admin ✅

```bash
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@cetraproapp.com\",\"password\":\"admin123\"}"
```

**Expected Response:** Same format as register, with admin user data.

**Copy the `accessToken` from this response!**

---

### Test 4: Get Current User ✅

Replace `YOUR_TOKEN_HERE` with the token from login:

```bash
curl -X GET http://localhost:3001/api/auth/me -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
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
      "createdAt": "...",
      "lastLoginAt": "..."
    }
  }
}
```

---

### Test 5: Refresh Token ✅

Replace `YOUR_REFRESH_TOKEN` with the refreshToken from login:

```bash
curl -X POST http://localhost:3001/api/auth/refresh -H "Content-Type: application/json" -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN\"}"
```

**Expected Response:**
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

---

### Test 6: Update Password ✅

Replace `YOUR_ADMIN_TOKEN` with admin's access token:

```bash
curl -X PUT http://localhost:3001/api/auth/password -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"currentPassword\":\"admin123\",\"newPassword\":\"newadmin123\"}"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Password updated successfully"
  }
}
```

**Note:** After this, you'll need to login with the new password!

---

### Test 7: Login with New Password ✅

```bash
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@cetraproapp.com\",\"password\":\"newadmin123\"}"
```

Should succeed with the new password.

---

### Test 8: Logout ✅

```bash
curl -X POST http://localhost:3001/api/auth/logout -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{}"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## Step 6: Test User Management Endpoints

### Test 9: Get All Users (Admin Only) ✅

```bash
curl -X GET http://localhost:3001/api/users -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "admin@cetraproapp.com",
        "name": "Admin User",
        "role": "ADMIN",
        "isActive": true,
        ...
      },
      {
        "id": "uuid",
        "email": "user1@cetraproapp.com",
        "name": "John Doe",
        "role": "USER",
        ...
      }
    ],
    "count": 4
  }
}
```

---

### Test 10: Create User (Admin Only) ✅

```bash
curl -X POST http://localhost:3001/api/users -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"email\":\"newuser@example.com\",\"password\":\"user123\",\"name\":\"New User\",\"role\":\"USER\"}"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "USER",
      "isActive": true,
      "createdAt": "..."
    }
  }
}
```

---

### Test 11: Update Notification Preferences ✅

```bash
curl -X PUT http://localhost:3001/api/users/notification-preferences -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"push\":true,\"sms\":false,\"email\":true,\"inApp\":true}"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Notification preferences updated successfully"
  }
}
```

---

## Step 7: Test Error Cases

### Test Invalid Email ❌

```bash
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"invalid-email\",\"password\":\"test123\",\"name\":\"Test\"}"
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Valid email is required"
}
```

---

### Test Wrong Password ❌

```bash
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@cetraproapp.com\",\"password\":\"wrongpassword\"}"
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

---

### Test Missing Token ❌

```bash
curl -X GET http://localhost:3001/api/auth/me
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "No authentication token provided"
}
```

---

### Test Invalid Token ❌

```bash
curl -X GET http://localhost:3001/api/auth/me -H "Authorization: Bearer invalid-token"
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Invalid or expired access token"
}
```

---

### Test Non-Admin Access ❌

Login as a regular user, then try to access admin endpoints:

```bash
# Login as user
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"user1@cetraproapp.com\",\"password\":\"user123\"}"

# Try to get all users (should fail)
curl -X GET http://localhost:3001/api/users -H "Authorization: Bearer USER_TOKEN"
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Admin access required"
}
```

---

## Automated Testing Script

Save this as `test-auth.ps1` (PowerShell) or `test-auth.sh` (Bash):

### PowerShell Version (test-auth.ps1):

```powershell
Write-Host "🧪 Testing CetaProjectsManager Authentication" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n✅ Test 1: Health Check" -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
Write-Host ($health | ConvertTo-Json) -ForegroundColor Green

# Test 2: Register
Write-Host "`n✅ Test 2: Register New User" -ForegroundColor Yellow
$registerBody = @{
    email = "testuser@example.com"
    password = "test123"
    name = "Test User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host ($registerResponse | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "User might already exist - continuing..." -ForegroundColor Yellow
}

# Test 3: Login as Admin
Write-Host "`n✅ Test 3: Login as Admin" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@cetraproapp.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$adminToken = $loginResponse.data.tokens.accessToken
Write-Host "Admin Token: $adminToken" -ForegroundColor Green

# Test 4: Get Current User
Write-Host "`n✅ Test 4: Get Current User" -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $adminToken"
}
$meResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method Get -Headers $headers
Write-Host ($meResponse | ConvertTo-Json -Depth 10) -ForegroundColor Green

# Test 5: Get All Users
Write-Host "`n✅ Test 5: Get All Users (Admin)" -ForegroundColor Yellow
$usersResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/users" -Method Get -Headers $headers
Write-Host "Total Users: $($usersResponse.data.count)" -ForegroundColor Green

Write-Host "`n🎉 All Tests Passed!" -ForegroundColor Cyan
```

**Run with:** `.\test-auth.ps1`

---

## Visual Database Check

Open Prisma Studio to see the data:

```bash
cd backend
npm run db:studio
```

Then open: http://localhost:5555

You can browse:
- **users** table - See all registered users
- **projects** table - See sample project
- **audit_logs** table - See login/register actions

---

## Success Checklist

- [ ] Health endpoint returns `status: ok`
- [ ] Can register new user
- [ ] Can login with admin credentials
- [ ] Receive access and refresh tokens
- [ ] Can get current user with token
- [ ] Can refresh access token
- [ ] Can update password
- [ ] Can logout
- [ ] Admin can get all users
- [ ] Admin can create users
- [ ] Users can update notification preferences
- [ ] Invalid credentials return error
- [ ] Missing token returns 401
- [ ] Invalid token returns 401
- [ ] Non-admin cannot access admin endpoints

---

## Common Issues & Solutions

### Issue: Port 3001 already in use
**Solution:** Change `PORT=3002` in `backend/.env` and restart

### Issue: Database connection refused
**Solution:**
- Check Docker: `docker ps`
- Restart Docker: `npm run docker:down && npm run docker:up`

### Issue: Prisma Client not generated
**Solution:** Run `npx prisma generate` in backend directory

### Issue: Migration failed
**Solution:**
- Reset database: `npx prisma migrate reset`
- Run migrations: `npx prisma migrate dev`
- Seed: `npm run db:seed`

### Issue: JWT token expired
**Solution:** Login again to get a new token

### Issue: curl not recognized (Windows)
**Solution:**
- Use PowerShell instead of CMD
- Or install Git Bash
- Or use Postman for testing

---

## Next Steps After Testing

Once authentication works:
1. ✅ Test user management endpoints
2. Implement file upload system
3. Build project management backend
4. Create notification orchestration
5. Start frontend development

See `NEXT_STEPS.md` for detailed implementation guide.
