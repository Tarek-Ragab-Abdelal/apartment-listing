# Nawy Apartment Listing

A full-stack apartment listing platform with real-time messaging, advanced search, and property management features.

## Technologies

- **Backend:** Node.js, TypeScript, Fastify, Prisma ORM
- **Database:** PostgreSQL
- **Frontend:** Next.js, React, TailwindCSS, shadcn/ui
- **Containerization:** Docker, Docker Compose

## Quick Start

1. Clone the environment configuration:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up -d --build
```

This command will start the following services:

- **PostgreSQL Database** (port 5433) - Primary data store with automated initialization
- **Backend API** (port 4000) - Fastify REST API with Prisma ORM and Swagger documentation
- **Frontend Web** (port 3000) - Next.js application with server-side rendering
- **Prisma Studio** (port 5555) - Database management interface

3. Access the application:

- Frontend: http://localhost:3000
- API Documentation: http://localhost:4000/docs
- Prisma Studio: http://localhost:5555

## User Roles

The application supports two user roles:

- **Admin** - Can add new listings, browse and filter listings, and (Future Work: edit existing listings)
- **User** - Can add apartments to watchlist, contact sellers, and browse listings

## Testing

### Database Seed

Database is seeded while launching the app using [Faker.js](https://fakerjs.dev/) that creates

- 945 Apartment including their amentities, images, cities, projects
- 15 Users are created, detailed below

### Credentials

These users are created for testing while seeding the database with some data.

**Admin Account:**

- Email: `tarek@nawy.com`
- Password: `12345678`

Other admin accounts are created having the same password are `agent1@nawy.com` , `agent2@nawy.com` , ... , `agent5@nawy.com`

**User Account:**

- Email: `user1@nawy.com`
- Password: `12345678`

Other normal user accounts are created having the same password are `user1@nawy.com` , `user2@nawy.com` , ... , `user10@nawy.com`

## Project Structure

```
apps/
  api/          Backend API with Fastify and Prisma
  web/          Frontend Next.js application
docker/         Database initialization scripts
```

## Development

For detailed API documentation and deployment instructions, see:

- [apps/api/README.md](./apps/api/README.md)
- [apps/web/README.md](./apps/web/README.md)
