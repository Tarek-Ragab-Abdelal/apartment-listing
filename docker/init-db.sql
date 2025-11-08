-- ========================================
-- Nawy Apartment Listing Database Initialization
-- ========================================
-- This script initializes the database with proper user and permissions

-- The database 'apartments' is already created by POSTGRES_DB env variable
-- The user 'nawy' is already created by POSTGRES_USER env variable

-- Grant all privileges to nawy user on apartments database
GRANT ALL PRIVILEGES ON DATABASE apartments TO nawy;

-- Connect to the apartments database
\c apartments

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO nawy;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nawy;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nawy;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO nawy;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO nawy;

-- Enable UUID extension (required by Prisma schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verification message
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
    RAISE NOTICE 'Database: apartments';
    RAISE NOTICE 'User: nawy';
    RAISE NOTICE 'All privileges granted';
END $$;
