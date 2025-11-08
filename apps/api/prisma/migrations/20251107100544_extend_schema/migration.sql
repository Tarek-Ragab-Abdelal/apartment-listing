/*
  Migration: Extend schema with proper data handling
  This migration creates new tables and migrates existing apartment data.
*/

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'AGENT');

-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- First, create all new tables

-- CreateTable: users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: cities
CREATE TABLE "cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable: projects
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "city_id" UUID NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- Create a default admin user
INSERT INTO "users" ("email", "password_hash", "name", "role") 
VALUES ('admin@example.com', 'temp_password_hash', 'System Admin', 'ADMIN');

-- Create default cities from existing data
INSERT INTO "cities" ("name", "country")
SELECT DISTINCT "city", 'Egypt' FROM "apartments";

-- Create default projects from existing data
INSERT INTO "projects" ("name", "city_id")
SELECT DISTINCT 
    a."project", 
    c."id"
FROM "apartments" a
JOIN "cities" c ON c."name" = a."city";

-- Create backup of existing apartment data
CREATE TABLE "apartments_backup" AS SELECT * FROM "apartments";

-- Now migrate apartment data step by step
-- Step 1: Add new UUID id column (keep old id for now)
ALTER TABLE "apartments" ADD COLUMN "new_id" UUID DEFAULT gen_random_uuid();

-- Step 2: Add new columns with default values first
ALTER TABLE "apartments" 
ADD COLUMN "project_id" UUID,
ADD COLUMN "lister_id" UUID,
ADD COLUMN "unit_name" VARCHAR(150),
ADD COLUMN "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "price_egp" DECIMAL(14,2),
ADD COLUMN "status" "ApartmentStatus" DEFAULT 'ACTIVE',
ADD COLUMN "address" TEXT,
ADD COLUMN "area_sqm" DECIMAL(10,2),
ADD COLUMN "bathrooms" INTEGER,
ADD COLUMN "bedrooms" INTEGER,
ADD COLUMN "unit_number" VARCHAR(50),
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- Step 3: Populate new columns with existing data
-- Get the admin user ID
UPDATE "apartments" SET 
"lister_id" = (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1),
"unit_name" = "unitName",
"price_egp" = "priceEgp",
"created_at" = "createdAt",
"updated_at" = "updatedAt";

-- Map projects
UPDATE "apartments" SET 
"project_id" = (
    SELECT p."id" 
    FROM "projects" p 
    JOIN "cities" c ON c."id" = p."city_id" 
    WHERE p."name" = "apartments"."project" AND c."name" = "apartments"."city"
);

-- Step 4: Create apartment_images table and migrate image data
CREATE TABLE "apartment_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "position" INTEGER,

    CONSTRAINT "apartment_images_pkey" PRIMARY KEY ("id")
);

-- Migrate images from array to separate table
INSERT INTO "apartment_images" ("apartment_id", "image_url", "position")
SELECT 
    a."new_id",
    unnest(a."images") as image_url,
    ordinality as position
FROM "apartments" a, unnest(a."images") WITH ORDINALITY;

-- Step 5: Drop old columns
ALTER TABLE "apartments" 
DROP COLUMN "id",
DROP COLUMN "unitName", 
DROP COLUMN "project", 
DROP COLUMN "city", 
DROP COLUMN "priceEgp", 
DROP COLUMN "description", 
DROP COLUMN "images", 
DROP COLUMN "createdAt", 
DROP COLUMN "updatedAt";

-- Step 6: Rename new_id to id and set as primary key
ALTER TABLE "apartments" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_pkey" PRIMARY KEY ("id");

-- Add NOT NULL constraints after data is populated
ALTER TABLE "apartments" ALTER COLUMN "project_id" SET NOT NULL;
ALTER TABLE "apartments" ALTER COLUMN "lister_id" SET NOT NULL;
ALTER TABLE "apartments" ALTER COLUMN "unit_name" SET NOT NULL;
ALTER TABLE "apartments" ALTER COLUMN "updated_at" SET NOT NULL;

-- Create remaining tables
CREATE TABLE "apartment_amenities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" UUID NOT NULL,
    "amenity" VARCHAR(100) NOT NULL,

    CONSTRAINT "apartment_amenities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "watchlists" (
    "user_id" UUID NOT NULL,
    "apartment_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("user_id","apartment_id")
);

CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "visits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Add Foreign Key Constraints
ALTER TABLE "projects" ADD CONSTRAINT "projects_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "apartments" ADD CONSTRAINT "apartments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "apartments" ADD CONSTRAINT "apartments_lister_id_fkey" FOREIGN KEY ("lister_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "apartment_images" ADD CONSTRAINT "apartment_images_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "apartment_amenities" ADD CONSTRAINT "apartment_amenities_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "visits" ADD CONSTRAINT "visits_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Clean up
DROP TABLE "apartments_backup";
