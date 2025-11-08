import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  LoginSchema,
  RegisterSchema
} from '../types/index';

const prisma = new PrismaClient();

// JWT secret - in production this should come from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'Placeholder-Secret';

async function authRoutes(fastify: any) {
  // POST /auth/register - Register new user
  fastify.post('/auth/register', {
    schema: {
      tags: ['authentication'],
      summary: 'Register new user',
      description: 'Create a new user account',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 1 },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'AGENT'], default: 'USER' }
        },
        required: ['email', 'password', 'name']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    phone: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    createdAt: { type: 'string' }
                  }
                },
                token: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const body = RegisterSchema.parse(request.body);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email }
      });

      if (existingUser) {
        return reply.code(400).send({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(body.password, 12);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          role: body.role || 'USER',
          phone: body.phone
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isVerified: true,
          createdAt: true
        }
      });

      // Generate JWT token
      const payload = { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return reply.code(201).send({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error: any) {
      console.error(error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: error.issues.map((issue: any) => issue.message).join(', ')
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /auth/login - Login user
  fastify.post('/auth/login', {
    schema: {
      tags: ['authentication'],
      summary: 'Login user',
      description: 'Authenticate user and return JWT token',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        },
        required: ['email', 'password']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    phone: { type: 'string' },
                    avatarUrl: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    lastLogin: { type: 'string' }
                  }
                },
                token: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const body = LoginSchema.parse(request.body);
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: body.email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isVerified: true,
          lastLogin: true
        }
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);
      
      if (!isPasswordValid) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const payload2 = { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      };
      const token = jwt.sign(payload2, JWT_SECRET, { expiresIn: '7d' });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;

      return reply.send({
        success: true,
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error: any) {
      console.error(error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: error.issues.map((issue: any) => issue.message).join(', ')
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // GET /auth/me - Get current user info (requires authentication)
  fastify.get('/auth/me', {
    schema: {
      tags: ['authentication'],
      summary: 'Get current user',
      description: 'Get current authenticated user information',
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'Bearer token' }
        },
        required: ['authorization']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                phone: { type: 'string' },
                avatarUrl: { type: 'string' },
                isVerified: { type: 'boolean' },
                lastLogin: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      // Extract token from Authorization header
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
          name: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'User not found'
        });
      }

      return reply.send({
        success: true,
        data: user
      });
    } catch (error: any) {
      console.error(error);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return reply.code(401).send({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /auth/logout - Logout user (placeholder for token blacklisting)
  fastify.post('/auth/logout', {
    schema: {
      tags: ['authentication'],
      summary: 'Logout user',
      description: 'Logout current user (placeholder for token invalidation)',
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'Bearer token' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    // In a production app, you would want to:
    // 1. Add the token to a blacklist
    // 2. Store blacklisted tokens in Redis or database
    // 3. Check blacklist in authentication middleware
    
    return reply.send({
      success: true,
      message: 'Logged out successfully'
    });
  });
}

export default fastifyPlugin(authRoutes);