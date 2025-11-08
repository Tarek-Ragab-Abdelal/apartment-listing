#!/bin/bash

# ========================================
# Nawy Apartment Listing - Quick Start Script
# ========================================

set -e

echo "========================================"
echo "Nawy Apartment Listing - Quick Start"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not available"
    echo "Please install Docker Compose v2 or higher"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please review and update .env file with your configuration"
    echo ""
fi

echo "Starting Nawy Apartment Listing application..."
echo ""
echo "This will:"
echo "  1. Build Docker images"
echo "  2. Initialize PostgreSQL database"
echo "  3. Run database migrations"
echo "  4. Seed initial data"
echo "  5. Start API server with health checks"
echo "  6. Launch web application"
echo ""

# Start services
docker compose up --build

echo ""
echo "========================================"
echo "Application stopped"
echo "========================================"
