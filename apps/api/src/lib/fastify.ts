const fastify = require('fastify');
import { PrismaClient } from '@prisma/client';

// Create Fastify instance
export const app = fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  // Add custom JSON serializer to handle BigInt and Decimal values
  serializerOpts: {
    bigint: {
      // Convert BigInt to string
      serialize: (value: bigint) => value.toString()
    }
  }
});

// Add custom JSON replacer for handling special types
app.addHook('preSerialization', async (request, reply, payload) => {
  return JSON.parse(JSON.stringify(payload, (key, value) => {
    // Convert BigInt to number if it's within safe integer range
    if (typeof value === 'bigint') {
      return Number(value);
    }
    // Handle Decimal/Numeric types from Prisma
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
      return parseFloat(value.toString());
    }
    return value;
  }));
});

// Create Prisma instance
export const prisma = new PrismaClient();

// Declare module augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Register Prisma as decorator
app.decorate('prisma', prisma);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);