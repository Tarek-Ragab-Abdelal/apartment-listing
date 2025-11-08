# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# ========================================
# Stage 2: Builder
# ========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copy source code and configuration
COPY . .

# Build TypeScript
RUN npm run build

# ========================================
# Stage 3: Runner
# ========================================
FROM node:18-alpine AS runner

WORKDIR /app

# Install curl for health checks and OpenSSL for Prisma
RUN apk add --no-cache curl openssl

# Copy package files
COPY package*.json ./

# Copy prisma schema for migrations
COPY prisma ./prisma/

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose application port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/api/health || exit 1

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
