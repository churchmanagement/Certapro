# Quick Start Guide

## Prerequisites

Before starting, make sure you have:

- ✅ **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- ✅ **npm** >= 9.0.0 (comes with Node.js)
- ✅ **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- ✅ **Git** (already installed ✓)

## Quick Start (Automated)

### Step 1: Setup Environment

Double-click or run:
```bash
SETUP_ENV.bat
```

This will:
- Create `backend/.env` from template
- Create `frontend/.env.local` with defaults
- Prompt you to set JWT secrets

### Step 2: Generate JWT Secrets

Open `backend/.env` and replace the JWT secrets:

**PowerShell method**:
```powershell
# Generate a random 32-character string
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Run this **twice** to get two different secrets for:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### Step 3: Start Development

Double-click or run:
```bash
START_DEV.bat
```

This will:
1. Check Node.js installation
2. Start Docker (PostgreSQL + Redis)
3. Install all dependencies (root, backend, frontend)
4. Start both backend and frontend servers

**URLs**:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Prisma Studio: http://localhost:5555 (run `cd backend && npx prisma studio`)

## Manual Start (Step by Step)

If you prefer manual setup:

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Setup Environment

```bash
# Backend
copy backend\.env.example backend\.env
# Edit backend/.env and set JWT secrets

# Frontend
echo NEXT_PUBLIC_API_URL=http://localhost:3001 > frontend\.env.local
echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> frontend\.env.local
```

### 3. Start Docker

```bash
npm run docker:up
```

### 4. Initialize Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed

cd ..
```

### 5. Start Development Servers

```bash
# Start both (recommended)
npm run dev

# OR start individually:
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
```

## Test Accounts (After Seeding)

**Admin**:
- Email: `admin@cetraproapp.com`
- Password: `admin123`

**Users**:
- Email: `user1@cetraproapp.com` / Password: `user123`
- Email: `user2@cetraproapp.com` / Password: `user123`
- Email: `user3@cetraproapp.com` / Password: `user123`

## Verify Installation

### Check Backend
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.45,
  "environment": "development"
}
```

### Check Frontend

Open browser: http://localhost:3000

You should see the CetaProjects home page.

## Common Issues

### Issue: Port Already in Use

**Error**: `Port 3001 is already in use`

**Solution**:
```bash
# Windows - Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=3002
```

### Issue: Database Connection Failed

**Error**: `Error: P1001: Can't reach database server`

**Solution**:
```bash
# Check Docker is running
docker ps

# Restart Docker containers
npm run docker:down
npm run docker:up

# Check database logs
docker logs cetraproapp-postgres
```

### Issue: Prisma Client Error

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
cd backend
npx prisma generate
cd ..
```

### Issue: Module Not Found

**Error**: `Cannot find module 'next'` or similar

**Solution**:
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..
```

## Development Workflow

### Making Changes

1. **Edit code** in your IDE (VS Code recommended)
2. **Backend auto-reloads** (ts-node-dev)
3. **Frontend auto-reloads** (Next.js Fast Refresh)
4. **Check logs** in terminal

### Database Changes

```bash
cd backend

# Create migration
npx prisma migrate dev --name your_migration_name

# View database
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

## Useful Commands

```bash
# View logs
docker logs cetraproapp-postgres
docker logs cetraproapp-redis

# Stop all services
npm run docker:down
Ctrl+C  # Stop dev servers

# Build for production
npm run build

# Lint code
npm run lint

# Access PostgreSQL
docker exec -it cetraproapp-postgres psql -U cetraproapp -d cetraproapp
```

## Next Steps

Now that your environment is set up:

1. ✅ **Explore the app** - Open http://localhost:3000
2. ✅ **Test the API** - Use provided test scripts
3. ✅ **Read documentation** - Check `README.md`, `CLAUDE.md`
4. ✅ **Start developing** - Build auth pages, project pages, etc.

## Getting Help

- **Documentation**: See `README.md` in root and `frontend/README.md`
- **API Docs**: See `PROJECT_API_GUIDE.md`
- **Implementation Details**: See various `*_SUMMARY.md` files
- **Backend Guide**: See `backend/` folder
- **Frontend Guide**: See `frontend/README.md`

## Pro Tips

1. **Use Prisma Studio** for visual database browsing:
   ```bash
   cd backend && npx prisma studio
   ```

2. **Enable hot reload** by keeping terminal open

3. **Use browser DevTools** (F12) to debug frontend

4. **Check backend logs** for API errors

5. **Install VS Code extensions**:
   - ESLint
   - Prettier
   - Prisma
   - Tailwind CSS IntelliSense

Happy coding! 🚀
