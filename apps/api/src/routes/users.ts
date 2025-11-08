import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema
} from '../types/index';

const prisma = new PrismaClient();

async function userRoutes(fastify: any) {
  // GET /users - Get all users with filtering and pagination
  fastify.get('/users', {
    schema: {
      tags: ['users'],
      summary: 'Get all users',
      description: 'Get all users with optional filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['ADMIN', 'USER', 'AGENT'] },
          isVerified: { type: 'boolean' },
          search: { type: 'string', description: 'Search by name or email' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const query = UserQuerySchema.parse(request.query);
      
      const where: any = {};
      
      if (query.role) {
        where.role = query.role;
      }
      
      if (query.isVerified !== undefined) {
        where.isVerified = query.isVerified;
      }
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
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
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / query.limit);

      return reply.send({
        success: true,
        data: users,
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // GET /users/:id - Get user by ID
  fastify.get('/users/:id', {
    schema: {
      tags: ['users'],
      summary: 'Get user by ID',
      description: 'Get a specific user by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
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
        404: {
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
      const { id } = request.params as { id: string };
      
      const user = await prisma.user.findUnique({
        where: { id },
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
          updatedAt: true,
          _count: {
            select: {
              apartments: true,
              sentMessages: true,
              watchlists: true,
              reviews: true,
              visits: true
            }
          }
        }
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        });
      }

      return reply.send({
        success: true,
        data: user
      });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /users - Create new user
  fastify.post('/users', {
    schema: {
      tags: ['users'],
      summary: 'Create new user',
      description: 'Create a new user',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 1 },
          role: { type: 'string', enum: ['ADMIN', 'USER', 'AGENT'], default: 'USER' },
          phone: { type: 'string' },
          avatarUrl: { type: 'string', format: 'uri' }
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
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                phone: { type: 'string' },
                avatarUrl: { type: 'string' },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
      const body = CreateUserSchema.parse(request.body);
      
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
      const passwordHash = await bcrypt.hash(body.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          role: body.role,
          phone: body.phone,
          avatarUrl: body.avatarUrl
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return reply.code(201).send({
        success: true,
        data: user
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

  // PUT /users/:id - Update user
  fastify.put('/users/:id', {
    schema: {
      tags: ['users'],
      summary: 'Update user',
      description: 'Update an existing user',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1 },
          role: { type: 'string', enum: ['ADMIN', 'USER', 'AGENT'] },
          phone: { type: 'string' },
          avatarUrl: { type: 'string', format: 'uri' },
          isVerified: { type: 'boolean' }
        }
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
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        404: {
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
      const { id } = request.params as { id: string };
      const body = UpdateUserSchema.parse(request.body);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Check if email is being changed and already exists
      if (body.email && body.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: body.email }
        });

        if (emailExists) {
          return reply.code(400).send({
            success: false,
            error: 'User with this email already exists'
          });
        }
      }
      
      const user = await prisma.user.update({
        where: { id },
        data: body,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return reply.send({
        success: true,
        data: user
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

  // DELETE /users/:id - Delete user
  fastify.delete('/users/:id', {
    schema: {
      tags: ['users'],
      summary: 'Delete user',
      description: 'Delete a user',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
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
      const { id } = request.params as { id: string };
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        });
      }
      
      await prisma.user.delete({
        where: { id }
      });

      return reply.send({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
};

export default fastifyPlugin(userRoutes);
