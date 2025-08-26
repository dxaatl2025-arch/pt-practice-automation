# PropertyPulse Backend API

A modern property management system built with Node.js, Express, and PostgreSQL using Prisma ORM.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd propertypulse-backend
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Set up PostgreSQL database**
```bash
# Create database
createdb propertypulse_rentals

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

4. **Seed the database**
```bash
npm run seed
```

5. **Start the server**
```bash
npm start          # Production
npm run dev        # Development with nodemon
```

## 🔧 Environment Variables

Create a `.env` file in the root directory with these variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/propertypulse_rentals
DB_TARGET=prisma

# Application Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Security Configuration
SECURITY_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_GENERAL=100
RATE_LIMIT_AUTH=10

# Optional: Backup Configuration
BACKUP_S3_BUCKET=propertypulse-backups
BACKUP_S3_REGION=us-east-1

# Optional: Error Tracking
SENTRY_DSN=your_sentry_dsn_here
```

### Environment Variable Descriptions

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `DB_TARGET` | Database target (`prisma` for PostgreSQL) | `prisma` | ✅ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `PORT` | Server port | `5000` | ❌ |
| `CLIENT_URL` | Frontend application URL | - | ❌ |
| `SECURITY_CORS_ORIGINS` | Allowed CORS origins (comma-separated) | - | ❌ |
| `RATE_LIMIT_GENERAL` | General API rate limit (requests/15min) | `100` | ❌ |
| `RATE_LIMIT_AUTH` | Auth API rate limit (requests/15min) | `10` | ❌ |

## 🗄️ Database Setup

### PostgreSQL Schema Migration

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name initial_migration

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Database Seeding

Seed the database with realistic test data:

```bash
# Run the seed script
npm run seed

# Or run directly
node scripts/seed-database.js
```

**Seeded Data Includes:**
- 1 Landlord user (`alex.landlord@seed.example.com` / `landlord123`)
- 1 Tenant user (`maria.tenant@seed.example.com` / `tenant123`)
- 1 Property linked to the landlord
- 1 Active lease linking property and tenant
- 3 Payment records (2 paid, 1 pending)
- 2 Maintenance tickets (1 open, 1 resolved)

## 🧪 Testing

### API Smoke Tests

Run comprehensive API tests to verify all endpoints:

```bash
# Run smoke tests
npm run test:smoke

# Or run directly
node scripts/api-smoke-tests.js
```

**Tests Include:**
- ✅ Health endpoint verification
- ✅ User CRUD operations
- ✅ Property CRUD operations
- ✅ Lease CRUD operations
- ✅ Payment CRUD operations
- ✅ Maintenance CRUD operations
- ✅ Data relationship verification
- ✅ Seeded data validation

### Manual Testing

Test individual endpoints:

```bash
# Health check
curl http://localhost:5000/health

# Get all users
curl http://localhost:5000/api/users

# Get all properties
curl http://localhost:5000/api/properties

# Get all leases
curl http://localhost:5000/api/leases

# Get all payments
curl http://localhost:5000/api/payments

# Get all maintenance tickets
curl http://localhost:5000/api/maintenance
```

## 📊 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Core Endpoints

#### Users
- `GET /api/users` - List all users with pagination
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/landlords` - Get users with LANDLORD role
- `GET /api/tenants` - Get users with TENANT role

#### Properties
- `GET /api/properties` - List all properties with filtering
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

#### Leases
- `GET /api/leases` - List all leases
- `GET /api/leases/:id` - Get lease by ID
- `POST /api/leases` - Create new lease
- `PUT /api/leases/:id` - Update lease
- `DELETE /api/leases/:id` - Delete lease

#### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

#### Maintenance
- `GET /api/maintenance` - List all maintenance tickets
- `GET /api/maintenance/:id` - Get ticket by ID
- `POST /api/maintenance` - Create new ticket
- `PUT /api/maintenance/:id` - Update ticket
- `DELETE /api/maintenance/:id` - Delete ticket

#### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- `GET /health/canary` - Canary deployment status

### Request/Response Examples

#### Create User
```bash
POST /api/users
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TENANT",
  "phone": "+1-555-123-4567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "cme7ywwoj0000u664ypgowylc",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TENANT",
    "phone": "+1-555-123-4567",
    "createdAt": "2025-08-14T04:16:24.771Z",
    "updatedAt": "2025-08-14T04:16:24.771Z"
  }
}
```

#### Create Property
```bash
POST /api/properties
Content-Type: application/json

{
  "title": "Modern Downtown Apartment",
  "description": "Beautiful 2-bedroom apartment in downtown",
  "propertyType": "APARTMENT",
  "addressStreet": "123 Main Street",
  "addressCity": "Atlanta",
  "addressState": "GA",
  "addressZip": "30309",
  "bedrooms": 2,
  "bathrooms": 2,
  "rentAmount": 2000,
  "landlordId": "cme7ywwoj0000u664ypgowylc"
}
```

### Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "type": "field",
      "msg": "Field is required",
      "path": "email",
      "location": "body"
    }
  ]
}
```

## 🏗️ Architecture

### Project Structure
```
server/
├── src/
│   ├── controllers/          # Business logic
│   ├── repositories/         # Data access layer
│   │   ├── prisma/          # PostgreSQL implementations
│   │   └── interfaces/      # Repository contracts
│   ├── routes/              # API route definitions
│   ├── middleware/          # Express middleware
│   ├── db/                  # Database configuration
│   └── utils/               # Utility functions
├── scripts/                 # Database and utility scripts
├── prisma/                  # Prisma schema and migrations
└── tests/                   # Test files
```

### Repository Pattern

The application uses the Repository Pattern for database abstraction:

```javascript
// Get repository via factory
const userRepo = repositoryFactory.getUserRepository();

// Use repository methods
const users = await userRepo.list({ filters, skip, limit });
const user = await userRepo.findById(id);
const newUser = await userRepo.create(userData);
```

### Database Switching

Switch between database implementations via environment variables:

```bash
# Use PostgreSQL (Prisma)
DB_TARGET=prisma npm start

# System automatically loads correct repositories
```

## 🔒 Security Features

- **CORS Protection**: Configurable allowed origins
- **Rate Limiting**: Endpoint-specific request limits
- **Input Sanitization**: XSS and injection protection
- **Security Headers**: Comprehensive HTTP security headers
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Express-validator for request validation

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm start               # Start production server

# Database
npm run seed            # Seed database with test data
npx prisma studio       # Open database browser
npx prisma migrate dev  # Create and apply migration

# Testing
npm run test:smoke      # Run API smoke tests
npm test               # Run all tests

# Utilities
npm run backup         # Create database backup
npm run health         # Check system health
```

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database URL
   - Set secure CORS origins
   - Configure rate limits

2. **Database Migration**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Security**
   - Enable rate limiting
   - Configure CORS for production domains
   - Set up error tracking (Sentry)

4. **Monitoring**
   - Health endpoints available at `/health`
   - Database performance monitoring
   - Error logging and alerting

### Docker Support (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow existing code patterns and naming conventions
2. Use camelCase for JavaScript, snake_case for database fields
3. Add tests for new endpoints
4. Update documentation for API changes
5. Ensure all smoke tests pass before submitting

## 📄 License

MIT License - see LICENSE file for details

---

**🎯 Ready for Phase 2 Development!**

The codebase is now in a clean, production-ready state with:
- ✅ Complete PostgreSQL migration
- ✅ Repository pattern implementation
- ✅ Comprehensive testing
- ✅ Security hardening
- ✅ Complete documentation