# Apartment Listing API

A modern RESTful API for managing real estate apartment listings, built with Fastify, TypeScript, and Prisma ORM.

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5.x (High-performance web framework)
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **API Documentation**: Swagger/OpenAPI (Fastify Swagger)
- **Development**: tsx (TypeScript execution)

## Project Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma          # Database schema definitions
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migration files
├── src/
│   ├── server.ts              # Application entry point
│   ├── lib/
│   │   ├── fastify.ts         # Fastify instance configuration
│   │   ├── auth.ts            # JWT authentication middleware
│   │   └── swagger-schemas.ts # Swagger schema definitions
│   ├── routes/                # API endpoint definitions
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── users.ts           # User management
│   │   ├── cities.ts          # City management
│   │   ├── projects.ts        # Project management
│   │   ├── apartments.ts      # Apartment listings
│   │   ├── apartment-images.ts
│   │   ├── apartment-amenities.ts
│   │   ├── messages.ts        # Messaging system
│   │   ├── watchlists.ts      # User favorites
│   │   ├── reviews.ts         # Property reviews
│   │   ├── visits.ts          # Visit scheduling
│   │   └── health.ts          # Health check
│   └── types/
│       ├── index.ts           # Zod validation schemas
│       └── fastify.d.ts       # Fastify type extensions
├── scripts/
│   └── clear-db.ts            # Database cleanup utility
├── public/                    # Static file serving
├── Dockerfile                 # Docker container definition
├── package.json
└── tsconfig.json
```

## Database Schema

The application uses a relational PostgreSQL database with the following entity structure. This diagram was generated usign earer.io by the Eraser AI.

![ERD Diagram](./Eraser-Erd.png "ERD Diagram")

### Core Models

Refer to `prisma/schema.prisma` for the complete database schema. The schema includes:

**User Management**

- `User`: User accounts with roles (ADMIN, USER, AGENT)

**Geographic & Project Hierarchy**

- `City`: Geographic locations
- `Project`: Real estate projects within cities
- `Apartment`: Individual units within projects

**Property Details**

- `ApartmentImage`: Property images with position ordering
- `ApartmentAmenity`: Property features and amenities

**User Interactions**

- `Conversation`: Message threads between users about properties
- `Message`: Individual messages within conversations
- `Watchlist`: User-saved favorite properties
- `Review`: User reviews and ratings for properties
- `Visit`: Scheduled property visit appointments

### Key Relationships

- Users can list multiple apartments (one-to-many)
- Apartments belong to projects, projects belong to cities (hierarchical)
- Conversations involve two users and one apartment
- All user interactions (messages, reviews, visits, watchlists) are linked to both users and apartments

See `prisma/schema.prisma` and the ERD diagram for complete relationship details and constraints.

## API Overview

The API follows RESTful principles with consistent response formats and comprehensive CRUD operations.

### Base URL

```
http://localhost:4000/api
```

### Interactive Documentation

Swagger UI is available at:

```
http://localhost:4000/docs
```

### Authentication

Most endpoints require JWT authentication. After login or registration:

1. Obtain JWT token from `/api/auth/login` or `/api/auth/register`
2. Include in subsequent requests:
   ```
   Authorization: Bearer <your-token>
   ```

### Response Format

All endpoints return standardized JSON responses:

```json
{
  "success": true|false,
  "data": {},
  "error": "error message (if success=false)",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Pagination

List endpoints support pagination via query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

## API Endpoints

Comprehensive documentation can be found here after running the project [http://localhost:4000/docs](http://localhost:4000/docs)

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Authenticate user, receive JWT
- `GET /api/auth/me` - Get current user profile (authenticated)
- `POST /api/auth/logout` - Logout (token invalidation)

### Users

- `GET /api/users` - List users (with filters: role, isVerified, search)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Cities & Projects

- `GET /api/cities` - List cities (filters: country, search)
- `GET /api/cities/:id` - Get city with projects
- `POST /api/cities` - Create city
- `PUT /api/cities/:id` - Update city
- `DELETE /api/cities/:id` - Delete city (if no projects exist)
- `GET /api/projects` - List projects (filters: cityId, search)
- `GET /api/projects/:id` - Get project with apartments
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (if no apartments exist)

### Apartments

- `GET /api/apartments` - List apartments with comprehensive filters:
  - `projectId`, `cityId`, `listerId`
  - `status` (ACTIVE, INACTIVE, SOLD)
  - `minPrice`, `maxPrice`, `minArea`, `maxArea`
  - `bedrooms`, `bathrooms`
  - `search` (unit name/description)
- `GET /api/apartments/:id` - Get apartment details (includes images, amenities, reviews)
- `GET /api/apartments/:id/related` - Get related apartments (smart matching)
- `POST /api/apartments` - Create apartment listing
- `PUT /api/apartments/:id` - Update apartment
- `DELETE /api/apartments/:id` - Delete apartment

### Property Media & Features

- `GET /api/apartment-images/:apartmentId` - List apartment images
- `POST /api/apartment-images` - Add image
- `PUT /api/apartment-images/:id` - Update image
- `DELETE /api/apartment-images/:id` - Delete image
- `GET /api/apartment-amenities/:apartmentId` - List amenities
- `POST /api/apartment-amenities` - Add amenity
- `PUT /api/apartment-amenities/:id` - Update amenity
- `DELETE /api/apartment-amenities/:id` - Delete amenity

### Messaging

- `GET /api/messages` - List messages (filters: apartmentId, senderId, receiverId, isRead)
- `GET /api/messages/:id` - Get message details
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Update message (mark as read)
- `DELETE /api/messages/:id` - Delete message

### User Interactions

- `GET /api/watchlists` - List user watchlists (filter: userId)
- `POST /api/watchlists` - Add apartment to watchlist
- `DELETE /api/watchlists/:userId/:apartmentId` - Remove from watchlist
- `GET /api/reviews` - List reviews (filters: apartmentId, userId, minRating, maxRating)
- `GET /api/reviews/:id` - Get review details
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/visits` - List visits (filters: apartmentId, userId, confirmed, dateFrom, dateTo)
- `GET /api/visits/:id` - Get visit details
- `POST /api/visits` - Schedule visit
- `PUT /api/visits/:id` - Update visit (confirm/reschedule)
- `DELETE /api/visits/:id` - Cancel visit

### Health

- `GET /api/health` - Service health check and database connectivity

For detailed request/response schemas, refer to `API_Documentation.md` or the Swagger UI at `/docs`.

## Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   # Create .env file
   DATABASE_URL="postgresql://user:password@localhost:5432/apartment_listing"
   JWT_SECRET="your-secret-key"
   PORT=4000
   HOST=localhost
   ```

3. Database setup:

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Seed database
   npm run db:seed
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data
- `npm run db:clear` - Clear all database data
- `npm run db:reset` - Clear and reseed database

## Docker Deployment

Build and run using Docker:

```bash
docker build -t apartment-api .
docker run -p 4000:4000 --env-file .env apartment-api
```

Or use Docker Compose (from project root):

```bash
docker compose up -d
```

## Features

- JWT-based authentication with role-based access control (RBAC)
- Comprehensive input validation using Zod schemas
- Automatic API documentation with Swagger/OpenAPI
- Database migrations and seeding
- Pagination and filtering on all list endpoints
- Related apartments algorithm (smart matching by project, city, size, price)
- Referential integrity and cascading deletes
- Business logic validation (e.g., users cannot review own properties)
- CORS enabled for cross-origin requests
- Static file serving support
- Health check endpoint for monitoring
- Docker containerization

## Security Considerations

- Passwords hashed using bcryptjs (12 rounds)
- JWT tokens expire after 7 days
- Authorization middleware protects sensitive endpoints
- Role-based access control for admin operations
- Input validation on all endpoints
- SQL injection protection via Prisma ORM parameterized queries

## TODO

### High Priority

1. **Centralized Validation Layer**

   - Create dedicated validation service
   - Consolidate all Zod schemas into organized modules
   - Implement request validation middleware
   - Add response validation for type safety

2. **Data Transfer Objects (DTOs) and Mappers**

   - Implement DTO layer to decouple internal models from API responses
   - Create mapper functions to transform Prisma models to DTOs
   - Remove direct exposure of database UUIDs in responses
   - Use opaque identifiers or hashids for public-facing IDs
   - Implement consistent data transformation patterns

3. **Authentication Enhancements**

   - Implement token refresh mechanism
   - Add token blacklist/revocation (Redis-based)
   - Implement rate limiting on auth endpoints
   - Add password reset functionality
   - Email verification workflow

### Medium Priority

4. **Error Handling**

   - Create centralized error handling middleware
   - Implement custom error classes
   - Standardize error response formats
   - Add error logging and monitoring

5. **Testing**

   - Unit tests for business logic
   - Integration tests for API endpoints
   - Database transaction rollback for tests
   - Mock authentication for test suites

6. **Performance**

   - Implement Redis caching for frequently accessed data
   - Add database query optimization
   - Implement connection pooling
   - Add response compression

7. **API Improvements**

   - Implement file upload for images (S3/CloudStorage)
   - Add real-time messaging via WebSockets
   - Implement notification system
   - Add search with Elasticsearch or full-text search

### Low Priority

8. **Documentation**

   - Add JSDoc comments to all functions
   - Create API usage examples
   - Document deployment procedures
   - Add architecture decision records (ADRs)

9. **DevOps**

   - CI/CD pipeline setup
   - Automated database backups
   - Monitoring and alerting (Prometheus/Grafana)
   - Logging aggregation (ELK stack)

10. **Code Quality**

    - Enable strict TypeScript mode
    - Implement ESLint/Prettier
    - Add pre-commit hooks
    - Code coverage reporting

---

Tarek Ragab - Nawy Listing Assesment
