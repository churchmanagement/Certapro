# CetaProjectsManager

A comprehensive mobile-first Progressive Web App (PWA) for managing project proposals with role-based workflows.

## Features

- 📱 **Cross-Platform PWA** - Works on iOS, Android, tablets, and desktop
- 🔐 **Role-Based Access** - Separate admin and user workflows
- 📋 **Project Proposals** - Submit projects with file attachments
- ✅ **Approval Workflow** - Users accept projects, admins assign them
- 🔔 **Multi-Channel Notifications** - Push, SMS, email, and in-app notifications
- ⏰ **Automated Reminders** - 2-day reminders for pending approvals
- 📊 **Admin Analytics** - Dashboard with project and user insights
- 🔒 **Secure** - JWT authentication, OAuth support, and data encryption

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** + shadcn/ui
- **Zustand** for state management
- **React Query** for data fetching and polling
- **Firebase Cloud Messaging** for push notifications

### Backend
- **Node.js** with Express and TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT + Passport.js** for authentication
- **AWS S3** for file storage
- **Twilio** for SMS notifications
- **NodeMailer** for email notifications
- **node-cron** for scheduled tasks

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- npm >= 9.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CetraProApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Docker services**
   ```bash
   npm run docker:up
   ```

4. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your credentials

   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   # Edit frontend/.env.local with your credentials
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start development servers**
   ```bash
   npm run dev
   ```

   The app will be available at:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Project Structure

```
CetraProApp/
├── backend/              # Express API server
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Utility functions
│   │   └── validators/  # Request validators
│   └── tests/           # Backend tests
├── frontend/            # Next.js PWA
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── app/         # Next.js app router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Libraries and utilities
│   │   └── store/       # Zustand state stores
│   └── tests/           # Frontend tests
├── docs/                # Documentation
└── docker-compose.yml   # Docker services
```

## Third-Party Services Required

Before deploying to production, you'll need to set up:

1. **Google OAuth** - For authentication
2. **Firebase** - For push notifications
3. **AWS S3** - For file storage
4. **Twilio** - For SMS notifications (credentials provided)
5. **Email Service** - SendGrid, AWS SES, or similar
6. **PostgreSQL** - Production database (Supabase, Railway, etc.)

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Database Management
```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Documentation

- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [PWA Limitations](./docs/PWA_LIMITATIONS.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.
