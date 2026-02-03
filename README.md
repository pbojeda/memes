# Meme Products E-commerce Platform

A modern print-on-demand e-commerce platform for selling products featuring trending memes.

## Business Purpose

This platform enables the rapid creation and sale of meme-branded products (t-shirts, hoodies, mugs, pillows, phone cases, trading cards) through a print-on-demand model with Printful integration. The key value propositions are:

- **Trending Content**: Products based on current viral memes
- **Zero Inventory Risk**: Print-on-demand production
- **Fast Time-to-Market**: AI-assisted content creation
- **Built-in Urgency**: Memes have short lifecycles, driving quick purchases

### Target Market
- Initial: Spain
- Expansion: Europe

### User Roles

| Role | Description |
|------|-------------|
| **Customer (TARGET)** | End users who browse and purchase products |
| **Manager (MANAGER)** | Staff who create/manage products and orders |
| **Admin (ADMIN)** | Full system access, user management |
| **Marketing (MARKETING)** | Campaign and promo code management |

---

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Validation**: Zod
- **Logging**: Pino + Pino-Pretty
- **HTTP Client**: Axios

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI + Radix UI
- **State Management**: Zustand
- **Server State**: TanStack Query
- **Forms**: React Hook Form + Zod

### Testing
- **Unit/Integration**: Jest
- **E2E**: Playwright

### Infrastructure
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

### External Services
- **Payments**: Stripe
- **Production**: Printful API
- **Email**: SendGrid / Resend
- **AI**: OpenAI API
- **Analytics**: Google Analytics 4
- **Monitoring**: Sentry

---

## Project Structure

```
meme-store/
├── .claude/                    # Claude Code configuration
│   ├── agents/                 # Custom AI agents
│   │   ├── production-code-validator.md
│   │   ├── code-review-specialist.md
│   │   ├── database-architect.md
│   │   ├── backend-developer.md
│   │   └── frontend-developer.md
│   └── skills/                 # Custom skills
│       ├── development-workflow/   # Task execution workflow
│       ├── bug-workflow/           # Bug resolution workflow
│       └── project-memory/         # Memory system templates
│
├── backend/                    # Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # Database migrations
│   │   └── seed.ts             # Seed data
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   │   ├── database.ts     # Prisma client setup
│   │   │   ├── env.ts          # Environment validation (Zod)
│   │   │   └── logger.ts       # Pino logger setup
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.schema.ts    # Zod schemas
│   │   │   │   └── auth.middleware.ts
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── promo-codes/
│   │   │   ├── newsletter/
│   │   │   ├── contact/
│   │   │   └── ai/
│   │   ├── integrations/       # External service clients
│   │   │   ├── stripe/
│   │   │   ├── printful/
│   │   │   ├── email/
│   │   │   └── openai/
│   │   ├── shared/             # Shared utilities
│   │   │   ├── errors/         # Custom error classes
│   │   │   ├── middleware/     # Global middleware
│   │   │   ├── utils/          # Utility functions
│   │   │   └── types/          # Shared TypeScript types
│   │   ├── app.ts              # Express app setup
│   │   └── server.ts           # Server entry point
│   ├── tests/                  # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── .env.example            # Environment template
│   ├── jest.config.js          # Jest configuration
│   ├── tsconfig.json           # TypeScript config
│   └── package.json
│
├── frontend/                   # Next.js Application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── (store)/        # Public store routes
│   │   │   │   ├── page.tsx              # Home
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx          # Catalog
│   │   │   │   │   └── [slug]/page.tsx   # Product detail
│   │   │   │   ├── cart/page.tsx
│   │   │   │   ├── checkout/page.tsx
│   │   │   │   └── order/[id]/page.tsx
│   │   │   ├── (auth)/         # Auth routes
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── forgot-password/page.tsx
│   │   │   ├── (account)/      # User account routes
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   └── addresses/page.tsx
│   │   │   ├── admin/          # Admin panel routes
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              # Dashboard
│   │   │   │   ├── products/
│   │   │   │   ├── orders/
│   │   │   │   ├── users/
│   │   │   │   └── promo-codes/
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── globals.css
│   │   ├── components/         # React components
│   │   │   ├── ui/             # Base UI components (Shadcn)
│   │   │   ├── layout/         # Layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── products/       # Product components
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   └── ProductFilters.tsx
│   │   │   ├── cart/           # Cart components
│   │   │   │   ├── CartDrawer.tsx
│   │   │   │   └── CartItem.tsx
│   │   │   ├── checkout/       # Checkout components
│   │   │   └── admin/          # Admin components
│   │   ├── lib/                # Utility functions
│   │   │   ├── api.ts          # Axios client
│   │   │   ├── utils.ts        # Helper functions
│   │   │   └── validators.ts   # Zod schemas
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCart.ts
│   │   │   └── useProducts.ts
│   │   ├── stores/             # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── cartStore.ts
│   │   │   └── uiStore.ts
│   │   ├── services/           # API service functions
│   │   │   ├── auth.service.ts
│   │   │   ├── products.service.ts
│   │   │   └── orders.service.ts
│   │   └── types/              # TypeScript types
│   │       ├── product.ts
│   │       ├── order.ts
│   │       └── user.ts
│   ├── public/                 # Static assets
│   ├── tests/                  # Test files
│   │   ├── unit/
│   │   └── e2e/
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── playwright.config.ts
│   └── package.json
│
├── docker/                     # Docker configuration
│   ├── docker-compose.yml      # Development services
│   ├── docker-compose.prod.yml # Production setup
│   └── Dockerfile.backend
│
├── docs/                       # Documentation
│   ├── project_notes/          # Project memory system
│   │   ├── current-task.md     # Current work in progress
│   │   ├── sprint-N-tracker.md # Sprint progress
│   │   ├── issues.md           # Work log
│   │   ├── bugs.md             # Bug log
│   │   ├── decisions.md        # ADRs
│   │   └── key_facts.md        # Project config
│   ├── ARQUITECTURA.md         # System architecture
│   ├── NEGOCIO.md              # Business requirements
│   ├── PLAN_DESARROLLO.md      # Development plan
│   └── use-cases.md            # Use cases
│
├── .github/                    # GitHub configuration
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       └── deploy.yml          # Deployment pipeline
│
├── .gitignore
├── .nvmrc                      # Node version
└── README.md
```

---

## Configuration Files

### Backend Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://memestore:memestore_secret@localhost:5432/memestore_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Printful
PRINTFUL_API_KEY="your-printful-api-key"

# Email (SendGrid)
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@memestore.com"

# OpenAI
OPENAI_API_KEY="sk-..."

# Sentry
SENTRY_DSN="https://..."

# Frontend URL (for CORS and emails)
FRONTEND_URL="http://localhost:3001"

# Logging
LOG_LEVEL=debug
```

### Frontend Environment Variables

Create `frontend/.env.local` from `frontend/.env.example`:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (use `nvm use` if .nvmrc exists)
- **npm** 10+
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone Repository

```bash
git clone <repository-url>
cd meme-store
```

### 2. Start Database Services (Docker)

```bash
# Start PostgreSQL and Redis containers
docker-compose -f docker/docker-compose.yml up -d

# Verify services are running
docker-compose -f docker/docker-compose.yml ps
```

This starts:
- **PostgreSQL** on port `5432` (user: `memestore`, password: `memestore_secret`, db: `memestore_dev`)
- **Redis** on port `6379`

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:dev

# Seed the database with initial data
npm run prisma:seed

# Start development server
npm run dev
```

Backend API will be available at `http://localhost:3000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3001`

### 5. Verify Setup

```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Check database connection
cd backend && npm run prisma:studio
# Opens Prisma Studio at http://localhost:5555
```

---

## Available Scripts

### Backend Scripts

```bash
# Development
npm run dev           # Start with hot reload (nodemon + ts-node)
npm run build         # Build TypeScript to dist/
npm run start         # Start production server

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate:dev # Create and apply migration
npm run prisma:migrate:deploy # Apply migrations (production)
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open Prisma Studio GUI

# Testing
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Linting
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors
npm run format        # Format with Prettier
```

### Frontend Scripts

```bash
# Development
npm run dev           # Start Next.js dev server
npm run build         # Build for production
npm run start         # Start production server

# Testing
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run Playwright with UI

# Linting
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors
npm run format        # Format with Prettier
```

---

## Database Management

### Running Migrations

```bash
# Development: Create migration from schema changes
npm run prisma:migrate:dev -- --name <migration_name>

# Production: Apply pending migrations
npm run prisma:migrate:deploy

# Reset database (development only)
npm run prisma:migrate:reset
```

### Viewing Data

```bash
# Open Prisma Studio (GUI)
npm run prisma:studio

# Or use psql directly
docker exec -it memestore-postgres psql -U memestore -d memestore_dev
```

### Seed Data

The seed script creates:
- Product types (t-shirt, hoodie, mug, pillow, phone-case, trading-card)
- Admin user (admin@memestore.com)
- Sample products for testing

```bash
npm run prisma:seed
```

---

## Testing

### Unit Tests (Jest)

```bash
# Backend
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# Frontend
cd frontend
npm test                    # Run all tests
npm run test:watch         # Watch mode
```

### E2E Tests (Playwright)

```bash
cd frontend

# Install Playwright browsers (first time)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/checkout.spec.ts
```

### Test Structure

```
backend/tests/
├── unit/                 # Unit tests for services
├── integration/          # API endpoint tests
└── fixtures/             # Test data factories

frontend/tests/
├── unit/                 # Component unit tests
└── e2e/                  # Playwright E2E tests
    ├── auth.spec.ts
    ├── products.spec.ts
    ├── cart.spec.ts
    └── checkout.spec.ts
```

---

## API Documentation

The API follows OpenAPI 3.0 specification. Full documentation is available in `docs/api/api-spec.yaml`.

### Key Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Register new user | - |
| POST | /auth/login | Login | - |
| POST | /auth/refresh | Refresh access token | - |
| GET | /products | List products | - |
| GET | /products/:slug | Get product detail | - |
| POST | /orders | Create order | Optional |
| GET | /orders/:id | Get order | Owner |
| POST | /promo-codes/validate | Validate promo code | - |

### Response Format

All responses follow this envelope format:

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## Deployment

### Development Workflow

1. Create feature branch from `develop`
2. Make changes and add tests
3. Run tests locally
4. Create Pull Request
5. CI runs tests automatically
6. Merge to `develop` after approval

### Production Deployment

```bash
# Backend
cd backend
npm run build
npm run prisma:migrate:deploy
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Docker Production

```bash
# Build and start all services
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose -f docker/docker-compose.yml ps

# Check PostgreSQL logs
docker-compose -f docker/docker-compose.yml logs postgres

# Reset database
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d
```

### Prisma Issues

```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset migrations (development only)
npm run prisma:migrate:reset

# Introspect existing database
npx prisma db pull
```

### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000
lsof -i :5432

# Kill process on port
kill -9 $(lsof -t -i:3000)
```

---

## Contributing

1. Follow the coding standards in `CLAUDE.md`
2. Use `development-workflow` skill for task execution
3. Use `bug-workflow` skill for bug resolution
4. Write tests for new functionality (TDD mandatory)
5. Validate code with `production-code-validator` before commits
6. Use conventional commits for commit messages
7. Keep PRs focused and small
8. Update documentation when needed
9. Document bugs in `docs/project_notes/bugs.md`
10. Document architectural decisions in `docs/project_notes/decisions.md`

---

## Related Documentation

- [Architecture](./docs/ARQUITECTURA.md) - System architecture with diagrams
- [Business Requirements](./docs/NEGOCIO.md) - Business context and requirements
- [Data Model](./ai-specs/specs/data-model.md) - Database schema documentation
- [API Specification](./ai-specs/specs/api-spec.yaml) - OpenAPI specification
- [Use Cases](./docs/use-cases.md) - Use Cases
- [Development Guide](./ai-specs/specs/development-guide.md) - Development Guide
- [Development Plan](./docs/PLAN_DESARROLLO.md) - Sprint-based development plan

---

## AI-Assisted Development

This project uses Claude Code with custom skills and agents to streamline development.

### Development Workflows

| Workflow | Purpose | Commands |
|----------|---------|----------|
| **development-workflow** | Task execution from sprint plan | `start task B0.1`, `next task`, `workflow status` |
| **bug-workflow** | Bug detection and resolution | `report bug`, `fix bug`, `hotfix needed` |

### Available Skills

| Skill | Description |
|-------|-------------|
| `/plan-backend-ticket` | Generate detailed backend task specification |
| `/plan-frontend-ticket` | Generate detailed frontend task specification |
| `/develop-backend` | Implement backend task with TDD |
| `/develop-frontend` | Implement frontend task with TDD |
| `/update-docs` | Update project documentation |

### Available Agents

| Agent | Purpose |
|-------|---------|
| `production-code-validator` | Validate code before production deployment |
| `code-review-specialist` | Thorough code review |
| `database-architect` | Schema design and query optimization |
| `backend-developer` | DDD patterns and service implementation |
| `frontend-developer` | React components and state management |

### Project Memory System

The project maintains institutional knowledge in `docs/project_notes/`:

| File | Purpose |
|------|---------|
| `current-task.md` | Current work in progress |
| `sprint-N-tracker.md` | Sprint progress tracking |
| `issues.md` | Work log with completed tasks |
| `bugs.md` | Bug log with solutions |
| `decisions.md` | Architectural Decision Records (ADRs) |
| `key_facts.md` | Project configuration and constants |

### Development Workflow Process

```
1. Validate Task      → Check dependencies and decisions
2. Create Branch      → feature/sprint{N}-{task-id}-{desc}
3. Generate Ticket    → /plan-backend-ticket or /plan-frontend-ticket
4. Develop (TDD)      → Write test → Implement → Refactor
5. Validate Code      → production-code-validator
6. Update Docs        → /update-docs (if applicable)
7. Commit             → Conventional commit format
8. PR & Merge         → Create PR, review, merge
```

### Bug Workflow Process

| Severity | Response | Process |
|----------|----------|---------|
| 🔴 Critical | Immediate | Hotfix → Deploy → Post-mortem |
| 🟠 High | Same day | Branch → Investigate → TDD Fix → PR |
| 🟡 Medium | This sprint | Triage → Fix → Document |
| 🟢 Low | Backlog | Quick fix when convenient |

For detailed workflow documentation, see:
- `.claude/skills/development-workflow/`
- `.claude/skills/bug-workflow/`

---

## License

Proprietary - All rights reserved

---

*Document version: 1.1*
*Last updated: February 2026*
