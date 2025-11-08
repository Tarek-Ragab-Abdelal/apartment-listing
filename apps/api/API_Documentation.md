# Apartment Listing API - Complete CRUD Operations

This document outlines all the available API endpoints for the Apartment Listing application based on the Prisma schema.

## Table of Contents

1. [Health Check](#health-check)
2. [User Management](#user-management)
3. [City Management](#city-management)
4. [Project Management](#project-management)
5. [Apartment Management](#apartment-management)
6. [Apartment Images](#apartment-images)
7. [Apartment Amenities](#apartment-amenities)
8. [Messages](#messages)
9. [Watchlists](#watchlists)
10. [Reviews](#reviews)
11. [Visits](#visits)

---

## Health Check

### GET /api/health

**Description:** Check API health and database connectivity
**Response:** Health status with timestamp

---

## User Management

### GET /api/users

**Description:** Get all users with optional filtering and pagination**Query Parameters:**

- `role` (optional): Filter by user role (ADMIN, USER)
- `isVerified` (optional): Filter by verification status (boolean)
- `search` (optional): Search by name or email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### GET /api/users/:id

**Description:** Get user by ID
**Parameters:** `id` (UUID)

### POST /api/users

**Description:** Create new user
**Body:**

```json
{
  "email": "string (required)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)",
  "role": "ADMIN|USER(optional, default: USER)",
  "phone": "string (optional)",
  "avatarUrl": "string (optional)"
}
```

### PUT /api/users/:id

**Description:** Update user by ID
**Parameters:** `id` (UUID)
**Body:** Same as POST but all fields are optional

### DELETE /api/users/:id

**Description:** Delete user by ID
**Parameters:** `id` (UUID)

---

## City Management

### GET /api/cities

**Description:** Get all cities with optional filtering and pagination**Query Parameters:**

- `country` (optional): Filter by country
- `search` (optional): Search by name or country
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### GET /api/cities/:id

**Description:** Get city by ID with associated projects
**Parameters:** `id` (UUID)

### POST /api/cities

**Description:** Create new city
**Body:**

```json
{
  "name": "string (required)",
  "country": "string (required)"
}
```

### PUT /api/cities/:id

**Description:** Update city by ID
**Parameters:** `id` (UUID)
**Body:** Same as POST but all fields are optional

### DELETE /api/cities/:id

**Description:** Delete city by ID (only if no associated projects)
**Parameters:** `id` (UUID)

---

## Project Management

### GET /api/projects

**Description:** Get all projects with optional filtering and pagination**Query Parameters:**

- `cityId` (optional): Filter by city ID (UUID)
- `search` (optional): Search by name or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### GET /api/projects/:id

**Description:** Get project by ID with city and apartments
**Parameters:** `id` (UUID)

### POST /api/projects

**Description:** Create new project
**Body:**

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "cityId": "UUID (required)",
  "address": "string (optional)",
  "latitude": "number (optional)",
  "longitude": "number (optional)"
}
```

### PUT /api/projects/:id

**Description:** Update project by ID
**Parameters:** `id` (UUID)
**Body:** Same as POST but all fields are optional

### DELETE /api/projects/:id

**Description:** Delete project by ID (only if no associated apartments)
**Parameters:** `id` (UUID)

---

## Apartment Management

### GET /api/apartments

**Description:** Get all apartments with comprehensive filtering and pagination**Query Parameters:**

- `projectId` (optional): Filter by project ID (UUID)
- `cityId` (optional): Filter by city ID (UUID)
- `listerId` (optional): Filter by lister ID (UUID)
- `status` (optional): Filter by status (ACTIVE, INACTIVE, SOLD)
- `minPrice` (optional): Minimum price in EGP
- `maxPrice` (optional): Maximum price in EGP
- `minArea` (optional): Minimum area in sqm
- `maxArea` (optional): Maximum area in sqm
- `bedrooms` (optional): Number of bedrooms
- `bathrooms` (optional): Number of bathrooms
- `search` (optional): Search by unit name or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### GET /api/apartments/:id

**Description:** Get apartment by ID with full details including project, lister, images, amenities, reviews
**Parameters:** `id` (UUID)

### GET /api/apartments/:id/related

**Description:** Get related apartments (limit 3) based on same project, city, size, price range
**Parameters:** `id` (UUID)

### POST /api/apartments

**Description:** Create new apartment
**Body:**

```json
{
  "projectId": "UUID (required)",
  "unitName": "string (required)",
  "unitNumber": "string (optional)",
  "bedrooms": "number (optional)",
  "bathrooms": "number (optional)",
  "areaSqm": "number (optional)",
  "priceEgp": "number (optional)",
  "address": "string (optional)",
  "latitude": "number (optional)",
  "longitude": "number (optional)",
  "description": "string (optional)",
  "listerId": "UUID (required)",
  "status": "ACTIVE|INACTIVE|SOLD (optional, default: ACTIVE)"
}
```

### PUT /api/apartments/:id

**Description:** Update apartment by ID
**Parameters:** `id` (UUID)
**Body:** Same as POST but all fields are optional

### DELETE /api/apartments/:id

**Description:** Delete apartment by ID
**Parameters:** `id` (UUID)

---

## Apartment Images

### GET /api/apartment-images/:apartmentId

**Description:** Get all images for an apartment
**Parameters:** `apartmentId` (UUID)

### POST /api/apartment-images

**Description:** Add image to apartment
**Body:**

```json
{
  "apartmentId": "UUID (required)",
  "imageUrl": "string URL (required)",
  "position": "number (optional)"
}
```

### PUT /api/apartment-images/:id

**Description:** Update apartment image
**Parameters:** `id` (UUID)
**Body:** Same as POST but all fields are optional

### DELETE /api/apartment-images/:id

**Description:** Delete apartment image
**Parameters:** `id` (UUID)

---

## Apartment Amenities

### GET /api/apartment-amenities/:apartmentId

**Description:** Get all amenities for an apartment
**Parameters:** `apartmentId` (UUID)

### POST /api/apartment-amenities

**Description:** Add amenity to apartment
**Body:**

```json
{
  "apartmentId": "UUID (required)",
  "amenity": "string (required)"
}
```

### PUT /api/apartment-amenities/:id

**Description:** Update apartment amenity
**Parameters:** `id` (UUID)
**Body:**

```json
{
  "amenity": "string (optional)"
}
```

### DELETE /api/apartment-amenities/:id

**Description:** Delete apartment amenity
**Parameters:** `id` (UUID)

---

## Messages

### GET /api/messages

**Description:** Get messages with filtering and pagination**Query Parameters:**

- `apartmentId` (optional): Filter by apartment ID (UUID)
- `senderId` (optional): Filter by sender ID (UUID)
- `receiverId` (optional): Filter by receiver ID (UUID)
- `isRead` (optional): Filter by read status (boolean)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### GET /api/messages/:id

**Description:** Get message by ID with sender, receiver, and apartment details
**Parameters:** `id` (UUID)

### POST /api/messages

**Description:** Send new message
**Body:**

```json
{
  "apartmentId": "UUID (required)",
  "senderId": "UUID (required)",
  "receiverId": "UUID (required)",
  "content": "string (required)"
}
```

### PUT /api/messages/:id

**Description:** Update message (mainly for marking as read)
**Parameters:** `id` (UUID)
**Body:**

```json
{
  "content": "string (optional)",
  "isRead": "boolean (optional)"
}
```

### DELETE /api/messages/:id

**Description:** Delete message
**Parameters:** `id` (UUID)

---

## Watchlists

### GET /api/watchlists

**Description:** Get watchlists with filtering and pagination**Query Parameters:**

- `userId` (optional): Filter by user ID (UUID)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### POST /api/watchlists

**Description:** Add apartment to user's watchlist
**Body:**

```json
{
  "userId": "UUID (required)",
  "apartmentId": "UUID (required)"
}
```

### DELETE /api/watchlists/:userId/:apartmentId

**Description:** Remove apartment from user's watchlist
**Parameters:** `userId` (UUID), `apartmentId` (UUID)

---

## Reviews

### GET /api/reviews

**Description:** Get reviews with filtering and pagination**Query Parameters:**

- `apartmentId` (optional): Filter by apartment ID (UUID)
- `userId` (optional): Filter by user ID (UUID)
- `minRating` (optional): Minimum rating (1-5)
- `maxRating` (optional): Maximum rating (1-5)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### GET /api/reviews/:id

**Description:** Get review by ID with user and apartment details
**Parameters:** `id` (UUID)

### POST /api/reviews

**Description:** Create new review
**Body:**

```json
{
  "apartmentId": "UUID (required)",
  "userId": "UUID (required)",
  "rating": "number 1-5 (required)",
  "comment": "string (optional)"
}
```

### PUT /api/reviews/:id

**Description:** Update review
**Parameters:** `id` (UUID)
**Body:**

```json
{
  "rating": "number 1-5 (optional)",
  "comment": "string (optional)"
}
```

### DELETE /api/reviews/:id

**Description:** Delete review
**Parameters:** `id` (UUID)

---

## Visits

### GET /api/visits

**Description:** Get visits with filtering and pagination**Query Parameters:**

- `apartmentId` (optional): Filter by apartment ID (UUID)
- `userId` (optional): Filter by user ID (UUID)
- `confirmed` (optional): Filter by confirmation status (boolean)
- `dateFrom` (optional): Filter visits from this date (ISO 8601)
- `dateTo` (optional): Filter visits until this date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### GET /api/visits/:id

**Description:** Get visit by ID with user and apartment details
**Parameters:** `id` (UUID)

### POST /api/visits

**Description:** Schedule new visit
**Body:**

```json
{
  "apartmentId": "UUID (required)",
  "userId": "UUID (required)",
  "scheduledAt": "ISO 8601 datetime (required)"
}
```

### PUT /api/visits/:id

**Description:** Update visit (mainly for confirming or rescheduling)
**Parameters:** `id` (UUID)
**Body:**

```json
{
  "scheduledAt": "ISO 8601 datetime (optional)",
  "confirmed": "boolean (optional)"
}
```

### DELETE /api/visits/:id

**Description:** Cancel/delete visit
**Parameters:** `id` (UUID)

---

## Key Features

### Pagination

All list endpoints support pagination with:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Response Format

All endpoints return responses in the format:

```json
{
  "success": boolean,
  "data": any,
  "error": string (only if success is false),
  "message": string (for delete operations),
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

### Special Features

1. **Related Apartments Algorithm**: Uses complex scoring based on same project (score: 4), same city (score: 3), similar size ±20% (score: 2), similar price ±30% (score: 1)
2. **Data Validation**: All inputs are validated using Zod schemas
3. **Relationship Constraints**: Prevents deletion of entities with dependencies
4. **Business Logic**: Includes validation like preventing users from reviewing their own apartments
5. **Time Validation**: Visit scheduling includes conflict detection and future date validation

### API Documentation

The API includes Swagger documentation available at `/docs` when the server is running.

### Error Handling

- Validation errors return 400 status with detailed error messages
- Not found errors return 404 status
- Business logic violations return 400 status with descriptive messages
- Internal server errors return 500 status
