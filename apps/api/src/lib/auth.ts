import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export type UserRole = 'ADMIN' | 'USER' | 'AGENT';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export async function authenticateToken(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        avatarUrl: true
      }
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user to request object
    request.user = user;
    request.token = token; 
    
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    return reply.code(500).send({
      success: false,
      error: 'Authentication error'
    });
  }
}

export function requireRole(requiredRole: UserRole) {
  return async function(request: any, reply: any) {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication required'
      });
    }

    if (request.user.role !== requiredRole && request.user.role !== 'ADMIN') {
      return reply.code(403).send({
        success: false,
        error: 'Insufficient permissions'
      });
    }
  };
}

export function requireRoles(requiredRoles: UserRole[]) {
  return async function(request: any, reply: any) {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!requiredRoles.includes(request.user.role) && request.user.role !== 'ADMIN') {
      return reply.code(403).send({
        success: false,
        error: 'Insufficient permissions'
      });
    }
  };
}