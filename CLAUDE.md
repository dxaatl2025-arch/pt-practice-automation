# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PropertyPulse is an AI-powered property management SaaS platform connecting landlords and tenants. The system is built with a React frontend, Node.js/Express backend, and PostgreSQL database using Prisma ORM. The architecture follows a repository pattern with modular design.

## Architecture

### Structure
- **Frontend**: React application in `/client` directory
- **Backend**: Node.js/Express API server in `/server` directory
- **Database**: PostgreSQL with Prisma ORM (migrated from MongoDB)
- **Repository Pattern**: Abstracted data access with interfaces in `server/src/repositories/`

### Key Components
- **Authentication**: Firebase Auth integration
- **Database Layer**: Prisma-only implementation (MongoDB support deprecated)
- **Email Service**: SendGrid/Nodemailer integration
- **Payment Integration**: Stripe and Plaid support
- **PDF Generation**: PDFKit for documents
- **AI Features**: OpenAI integration for smart features
- **Applications Module**: Feature-flagged rental application system

### Database Schema
The Prisma schema includes:
- **Users**: Multi-role system (ADMIN, LANDLORD, TENANT, PROPERTY_MANAGER)
- **Properties**: Full property management with amenities, location data
- **Leases**: Lease agreements with payment tracking
- **Payments**: Rent payments with late fee support
- **MaintenanceTickets**: Issue tracking system
- **Applications**: Rental application processing

## Development Commands

### Root Level
```bash
npm run dev                 # Start both server and client concurrently
npm run client             # Start React frontend only
npm run server             # Start Express backend only
npm run build              # Build React frontend
npm run install-all        # Install all dependencies
npm run test:smoke         # Run smoke tests
npm run health             # Run health check script
npm run setup:complete     # Full health check and smoke test
```

### Server Commands
```bash
# Development
npm run dev                # Start with nodemon
npm run start              # Start production server

# Testing
npm test                   # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
npm run test:integration   # Integration tests
npm run test:unit          # Unit tests
npm run test:repositories  # Repository tests
npm run test:applications  # Applications module tests

# Database (Prisma)
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:reset       # Reset database

# Database Testing
npm run test:setup         # Reset and migrate test database
npm run test:db:reset      # Reset test database
npm run test:db:migrate    # Migrate test database
npm run test:db:studio     # Open test database studio

# Migration Scripts (MongoDB to PostgreSQL)
npm run migrate:all        # Run all migration scripts
npm run migrate:users      # Migrate users
npm run migrate:properties # Migrate properties
npm run migrate:leases     # Migrate leases
npm run migrate:payments   # Migrate payments
npm run migrate:tickets    # Migrate tickets
npm run migrate:verify     # Verify migration

# Production
npm run production:cutover # Production cutover verification
```

### Client Commands
```bash
npm start                  # Start development server
npm run build              # Build for production
npm test                   # Run React tests
```

## Environment Configuration

### Key Environment Variables
- `DB_TARGET=prisma` - Database target (PostgreSQL only)
- `DATABASE_URL` - PostgreSQL connection string
- `APPLICATIONS_E2E=true` - Enable applications module
- `MATCHING_PROFILES=true` - Enable profile matching
- `CANARY_MODE=enabled` - Enable canary deployment
- `NODE_ENV` - Environment (development/production)

## Testing

### Test Structure
- **Unit Tests**: `tests/unit/`
- **Integration Tests**: `tests/integration/`
- **Repository Tests**: `tests/repositories/`
- **Module Tests**: `src/modules/applications/__tests__/`

### Running Tests
Always use the npm scripts rather than direct Jest commands. The test setup includes proper database configuration for both development and test environments.

## Development Guidelines

### Repository Pattern
When working with data access:
- Use repository interfaces from `src/repositories/interfaces/`
- Prisma implementations are in `src/repositories/prisma/`
- Follow existing patterns for new repositories

### Feature Flags
- Applications module: controlled by `APPLICATIONS_E2E` environment variable
- Matching profiles: controlled by `MATCHING_PROFILES` environment variable

### Database Operations
- Always use Prisma for database operations
- MongoDB support has been removed
- Use proper transactions for multi-table operations
- Follow the established schema relationships

### API Development
- All API routes are in `src/routes/`
- Follow RESTful conventions
- Use middleware for authentication, rate limiting, and validation
- Implement proper error handling

### Security
- Rate limiting is implemented per endpoint type
- Helmet for security headers
- Input validation and sanitization
- Firebase Auth for authentication

## Important Notes

- The system has been migrated from MongoDB to PostgreSQL - avoid any MongoDB references
- Use the repository pattern for all data access
- Feature flags control module availability
- Always run tests before committing changes
- Use proper environment variables for configuration