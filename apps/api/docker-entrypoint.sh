#!/bin/sh

# ========================================
# Nawy Apartment Listing API - Entrypoint Script
# ========================================
# This script initializes the API service:
# 1. Waits for database to be ready
# 2. Runs database migrations
# 3. Seeds initial data
# 4. Validates health
# 5. Starts the API server

set -e

echo "[API] Starting Nawy Apartment Listing API initialization..."

# ========================================
# Function: Wait for database to be ready
# ========================================
wait_for_db() {
    echo "[API] Waiting for PostgreSQL database to be ready..."
    
    MAX_RETRIES=10
    RETRY_COUNT=0
    
    until echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "[API] Database not ready. Attempt $RETRY_COUNT of $MAX_RETRIES. Retrying in 2 seconds..."
        sleep 2
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "[API] ERROR: Database connection timeout after $MAX_RETRIES attempts"
        exit 1
    fi
    
    echo "[API] Database connection established successfully"
}

# ========================================
# Function: Run database migrations
# ========================================
run_migrations() {
    echo "[API] Running database migrations..."
    
    if npx prisma migrate deploy; then
        echo "[API] Database migrations completed successfully"
    else
        echo "[API] ERROR: Database migrations failed"
        exit 1
    fi
}

# ========================================
# Function: Seed database
# ========================================
seed_database() {
    echo "[API] Checking if database needs seeding..."
    
    # Check if database already has data by counting users
    RECORD_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | tail -n 1 | tr -d ' ' || echo "0"
SELECT COUNT(*) FROM "User";
EOF
)
    
    echo "[API] Found $RECORD_COUNT users in database"
    
    if [ "$RECORD_COUNT" = "0" ] || [ -z "$RECORD_COUNT" ]; then
        echo "[API] Database is empty. Seeding initial data..."
        
        if npm run db:seed; then
            echo "[API] Database seeded successfully"
        else
            echo "[API] ERROR: Database seeding failed"
            exit 1
        fi
    else
        echo "[API] Database already contains $RECORD_COUNT users. Skipping seed."
    fi
}

# ========================================
# Function: Validate API health
# ========================================
validate_health() {
    echo "[API] Starting API server in background for health validation..."
    
    # Start server in background
    node dist/server.js &
    SERVER_PID=$!
    
    echo "[API] Waiting for API server to be ready (PID: $SERVER_PID)..."
    
    MAX_RETRIES=10
    RETRY_COUNT=0
    
    sleep 5  # Initial wait for server startup
    
    until curl -f http://localhost:4000/api/health > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "[API] Health check attempt $RETRY_COUNT of $MAX_RETRIES..."
        sleep 2
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "[API] ERROR: API health check failed after $MAX_RETRIES attempts"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    echo "[API] Health check passed. API is responding correctly"
    
    # Stop background server
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
}

# ========================================
# Main execution flow
# ========================================

# Step 1: Wait for database
wait_for_db

# Step 2: Run migrations
run_migrations

# Step 3: Seed database (if needed)
seed_database

# Step 4: Validate health
validate_health

# Step 5: Start the server
echo "[API] Starting API server..."
echo "[API] Environment: $NODE_ENV"
echo "[API] Port: ${PORT:-4000}"
echo "[API] Nawy Apartment Listing API is ready"

exec node dist/server.js
