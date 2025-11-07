# CommUnity Platform - Development Setup

## Prerequisites

- **Node.js** 20 LTS or higher
- **npm** 10 or higher
- **Docker Desktop** (for PostgreSQL and MinIO)

## Quick Start

### First Time Setup (5 minutes)

```bash
# 1. Clone and install
npm install

# 2. Start Docker services, run migrations, seed database
npm run setup

# 3. Start all development servers (backend + frontend)
npm run dev
```

That's it! The setup script will:
- ✅ Start PostgreSQL and MinIO containers
- ✅ Wait for services to be healthy
- ✅ Run database migrations
- ✅ Seed test data

## Development Workflow

### Starting the Development Environment

```bash
# Start everything (containers + servers)
npm run dev
```

This will:
1. Start Docker containers (PostgreSQL, MinIO)
2. Wait for services to be ready
3. Run any pending migrations
4. Start backend API (http://localhost:3001)
5. Start frontend (http://localhost:3000)

### Stopping the Development Environment

Press `Ctrl+C` to stop the dev servers.

**Note:** Docker containers keep running in the background for faster restarts.

```bash
# To stop Docker containers
npm run services:stop

# To restart Docker containers
npm run services:restart
```

## Available Scripts

### Development
```bash
npm run dev              # Start all dev servers
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend
```

### Docker Services
```bash
npm run services:start   # Start Docker containers
npm run services:stop    # Stop Docker containers
npm run services:restart # Restart Docker containers
npm run services:logs    # View container logs
npm run services:status  # Check container status
npm run services:clean   # Remove containers and volumes (⚠️ deletes data)
```

### Database
```bash
npm run db:migrate       # Run new migrations
npm run db:seed          # Populate test data
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:reset         # Fresh database (⚠️ deletes all data)
```

### Testing
```bash
npm run test             # Run all tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
npm run test:e2e         # End-to-end tests
```

### Building
```bash
npm run build            # Build all packages
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
```

### Code Quality
```bash
npm run lint             # Lint all packages
npm run format           # Format all packages
npm run type-check       # TypeScript type checking
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | N/A |
| Backend API | http://localhost:3001 | N/A |
| PostgreSQL | localhost:5432 | postgres/postgres |
| MinIO Console | http://localhost:9001 | minioadmin/minioadmin |
| MinIO API | http://localhost:9000 | minioadmin/minioadmin |
| Prisma Studio | http://localhost:5555 | Run: `npm run db:studio` |
| pgAdmin (optional) | http://localhost:5050 | admin@community.local/admin |

## Project Structure

```
community/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── auth/        # Authentication (JWT, OAuth)
│   │   ├── integrations/ # Stripe, Amazon API
│   │   ├── models/      # Data models
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── tests/
│   │   ├── contract/    # API contract tests
│   │   ├── integration/ # Integration tests
│   │   └── unit/        # Unit tests
│   └── prisma/          # Database schema & migrations
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Next.js pages
│   │   ├── services/    # API client
│   │   └── hooks/       # Custom hooks
│   └── tests/
│       ├── e2e/         # Playwright E2E tests
│       ├── integration/ # Component integration
│       └── unit/        # Component unit tests
├── shared/              # Shared TypeScript types
│   └── types/
└── docker-compose.yml   # Development services
```

## Environment Variables

Backend environment variables are in `backend/.env`. Key variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/community_dev"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
AWS_ENDPOINT="http://localhost:9000"  # MinIO
```

See `backend/.env.example` for all available variables.

## Database Management

### Viewing Data
```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

### Making Schema Changes

1. Edit `backend/prisma/schema.prisma`
2. Create migration:
   ```bash
   cd backend
   npx prisma migrate dev --name your_migration_name
   ```
3. Migration is automatically applied

### Resetting Database
```bash
npm run db:reset
# ⚠️ This deletes all data and re-seeds
```

## Troubleshooting

### "Port 5432 already in use"
```bash
# Check what's using the port
lsof -i :5432

# Stop existing PostgreSQL
brew services stop postgresql  # If installed via Homebrew
# OR
npm run services:stop
```

### "Database connection failed"
```bash
# Check Docker containers are running
npm run services:status

# View logs
npm run services:logs

# Restart services
npm run services:restart
```

### "Fresh start needed"
```bash
# Nuclear option: clean everything and restart
npm run clean
npm install
npm run setup
npm run dev
```

### Docker not running
```bash
# Ensure Docker Desktop is running
open -a Docker  # macOS

# Check Docker is responding
docker ps
```

## Next Steps

1. **Review the Spec**: See `specs/001-lets-build-a/spec.md`
2. **Check the Plan**: See `specs/001-lets-build-a/plan.md`
3. **Implementation Tasks**: See `specs/001-lets-build-a/tasks.md`
4. **Start Coding**: Backend entry point is `backend/src/index.ts`

## Production Deployment

This Docker Compose setup is **for development only**. For production:

- **PostgreSQL**: Use managed service (Railway, Render, Supabase, AWS RDS)
- **S3 Storage**: Use real AWS S3 or Cloudflare R2
- **Containers**: Deploy to Railway, Render, Fly.io, or AWS ECS

See deployment documentation (coming soon).
