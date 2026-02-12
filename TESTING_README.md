# 🧪 Testing Authentication - Quick Guide

## ⚡ Fastest Way to Test

### Option 1: Automated Batch Files (Windows)

1. **Run setup** (first time only):
   ```
   Double-click: START_TESTING.bat
   ```
   This will:
   - Install dependencies
   - Start Docker
   - Initialize database
   - Seed test data

2. **Start the server**:
   ```
   cd backend
   npm run dev
   ```

3. **Run tests** (in a new terminal):
   ```
   Double-click: RUN_TESTS.bat
   ```

### Option 2: PowerShell Script

1. **Setup and start server** (follow Option 1, steps 1-2)

2. **Run automated tests**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File test-auth.ps1
   ```

### Option 3: Manual Testing

1. **Setup** (first time only):
   ```bash
   npm install
   cd backend
   npm install
   npm run docker:up
   npx prisma generate
   npx prisma migrate dev --name init
   npm run db:seed
   ```

2. **Start server**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Test endpoints manually** - See `TEST_AUTH.md` for detailed curl commands

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ **Node.js >= 18.0.0** - [Download](https://nodejs.org/)
- ✅ **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- ✅ **Git Bash or PowerShell** (for running commands)

Check your versions:
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
docker --version
```

---

## 🎯 What Gets Tested

The automated test script (`test-auth.ps1`) runs **13 comprehensive tests**:

### ✅ Positive Tests (8 tests)
1. Health Check - Server is running
2. User Registration - Create new account
3. Admin Login - Authenticate as admin
4. Get Current User - Retrieve user profile
5. Token Refresh - Get new access token
6. Get All Users - Admin list users
7. Create User - Admin creates user
8. Update Preferences - User updates settings
9. Logout - Clear session

### ❌ Error Handling Tests (4 tests)
10. Invalid Email - Reject malformed email
11. Wrong Password - Reject incorrect credentials
12. Missing Token - Reject unauthenticated requests
13. Non-Admin Access - Block unauthorized access

---

## 📊 Expected Results

### Success Output:
```
🧪 Testing CetaProjectsManager Authentication API
=================================================

✅ Test 1: Health Check
Status: ok
Environment: development

✅ Test 2: Register New User
✓ User registered successfully!
  Email: testuser_20260210123456@example.com
  Role: USER

✅ Test 3: Login as Admin
✓ Admin login successful!
  Email: admin@cetraproapp.com
  Role: ADMIN

... [all 13 tests pass] ...

=================================================
🎉 All Authentication Tests Passed!
=================================================

📊 Test Summary:
  ✅ Health check
  ✅ User registration
  ✅ Admin login
  ✅ Get current user
  ✅ Token refresh
  ✅ Get all users (admin)
  ✅ Create user (admin)
  ✅ Update preferences
  ✅ Error handling (4 tests)
  ✅ Logout

✨ Authentication system is working perfectly!
```

---

## 🐛 Troubleshooting

### Problem: "Server not responding"
**Solution:**
```bash
# Make sure server is running
cd backend
npm run dev

# Check if port 3001 is available
netstat -ano | findstr :3001
```

### Problem: "Database connection refused"
**Solution:**
```bash
# Check Docker is running
docker ps

# Restart Docker containers
npm run docker:down
npm run docker:up

# Wait 10 seconds for PostgreSQL to start
```

### Problem: "Admin login failed"
**Solution:**
```bash
# Make sure database is seeded
cd backend
npm run db:seed
```

### Problem: "Prisma Client not found"
**Solution:**
```bash
cd backend
npx prisma generate
```

### Problem: "Port 3001 already in use"
**Solution:**
1. Open `backend/.env`
2. Change `PORT=3001` to `PORT=3002`
3. Update test URLs in scripts to use port 3002
4. Restart server

### Problem: "curl not recognized"
**Solution:**
- Use PowerShell instead of Command Prompt
- Or use the automated test script: `test-auth.ps1`
- Or install Git Bash

---

## 🔍 Visual Database Inspection

After testing, you can view the database visually:

```bash
cd backend
npm run db:studio
```

Open: http://localhost:5555

You can see:
- **users** table - All registered users (admin, users, test accounts)
- **projects** table - Sample project
- **audit_logs** table - Login/register events

---

## 🎓 Understanding the Tests

### Test Flow:

```
1. Health Check
   ↓
2. Register New User → Receive Tokens
   ↓
3. Login as Admin → Receive Admin Tokens
   ↓
4. Get Current User (with token) → User Profile
   ↓
5. Refresh Token → New Tokens
   ↓
6. Admin: Get All Users → User List
   ↓
7. Admin: Create User → New User Created
   ↓
8. Update Preferences → Preferences Updated
   ↓
9. Test Error Cases → All Rejected Correctly
   ↓
10. Logout → Session Cleared
```

### Test Credentials:

**Pre-seeded accounts:**
- **Admin:** admin@cetraproapp.com / admin123
- **User 1:** user1@cetraproapp.com / user123
- **User 2:** user2@cetraproapp.com / user123
- **User 3:** user3@cetraproapp.com / user123

**Created during tests:**
- **Test User:** testuser_[timestamp]@example.com / test123
- **Created User:** created_[timestamp]@example.com / user123

---

## 📝 Manual Testing Examples

### Example 1: Register and Login

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"mytest@example.com\",\"password\":\"pass123\",\"name\":\"My Test\"}"

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"mytest@example.com\",\"password\":\"pass123\"}"

# Save the accessToken from response!
```

### Example 2: Admin Operations

```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@cetraproapp.com\",\"password\":\"admin123\"}"

# Get all users (replace YOUR_TOKEN)
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📖 Detailed Documentation

- **TEST_AUTH.md** - Complete manual testing guide with all curl commands
- **API_TESTING.md** - Full API documentation with examples
- **QUICK_START.md** - Setup guide for the entire project
- **NEXT_STEPS.md** - What to implement next

---

## ✅ Success Checklist

After running tests, verify:

- [ ] All 13 automated tests pass
- [ ] Can register new users
- [ ] Can login with correct credentials
- [ ] Tokens are generated and work
- [ ] Admin can access admin endpoints
- [ ] Regular users cannot access admin endpoints
- [ ] Invalid credentials are rejected
- [ ] Invalid tokens are rejected
- [ ] Can view users in Prisma Studio
- [ ] Server logs show no errors

---

## 🚀 Next Steps After Testing

Once authentication works:

1. ✅ **Test complete** - Authentication system verified
2. 🔧 **Implement File Upload** - AWS S3 integration
3. 🔧 **Build Project Management** - Core business logic
4. 🔧 **Create Notification System** - Multi-channel notifications
5. 🔧 **Start Frontend** - Next.js + React

See `NEXT_STEPS.md` for detailed implementation guide.

---

## 📞 Need Help?

If tests fail:
1. Check `backend/logs/combined.log` for errors
2. Verify Docker containers: `docker ps`
3. Check database in Prisma Studio: `npm run db:studio`
4. Review error messages in test output
5. Ensure all prerequisites are installed

---

## 🎉 Success!

If all tests pass, you've successfully:
- ✅ Set up the development environment
- ✅ Initialized the database
- ✅ Verified authentication endpoints
- ✅ Tested user management
- ✅ Validated error handling
- ✅ Confirmed RBAC is working

**The backend foundation is solid and ready for the next phase!**
