import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import {
  CreateCitySchema,
  UpdateCitySchema,
  CityQuerySchema,
  UuidParamsSchema
} from '../types';

const prisma = new PrismaClient();

async function cityRoutes(fastify: any) {
  // GET /cities - Get all cities with filtering and pagination
  fastify.get('/cities', {
    schema: {
      tags: ['cities'],
      summary: 'Get all cities',
      description: 'Get all cities with optional filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          country: { type: 'string' },
          search: { type: 'string', description: 'Search by name or country' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const query = CityQuerySchema.parse(request.query);
      
      const where: any = {};
      
      if (query.country) {
        where.country = { contains: query.country, mode: 'insensitive' };
      }
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { country: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [cities, total] = await Promise.all([
        prisma.city.findMany({
          where,
          include: {
            _count: {
              select: {
                projects: true
              }
            }
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { name: 'asc' }
        }),
        prisma.city.count({ where })
      ]);

      const totalPages = Math.ceil(total / query.limit);

      return reply.send({
        success: true,
        data: cities,
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // GET /cities/:id - Get a city by ID
  fastify.get('/cities/:id', {
    schema: {
      tags: ['cities'],
      summary: 'Get city by ID',
      description: 'Get a specific city by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const params = UuidParamsSchema.parse(request.params);
      
      const city = await prisma.city.findUnique({
        where: { id: params.id },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              createdAt: true,
              _count: {
                select: {
                  apartments: true
                }
              }
            }
          }
        }
      });

      if (!city) {
        return reply.code(404).send({
          success: false,
          error: 'City not found'
        });
      }

      return reply.send({
        success: true,
        data: city
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /cities - Create a new city
  fastify.post('/cities', {
    schema: {
      tags: ['cities'],
      summary: 'Create new city',
      description: 'Create a new city',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          country: { type: 'string', minLength: 1 }
        },
        required: ['name', 'country']
      }
    }
  }, async (request, reply) => {
    try {
      const body = CreateCitySchema.parse(request.body);
      
      const city = await prisma.city.create({
        data: {
          name: body.name,
          country: body.country
        }
      });

      return reply.code(201).send({
        success: true,
        data: city
      });
    } catch (error: any) {
      fastify.log.error(error);
      
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

  // PUT /cities/:id - Update a city
  fastify.put('/cities/:id', {
    schema: {
      tags: ['cities'],
      summary: 'Update city',
      description: 'Update an existing city',
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
          name: { type: 'string', minLength: 1 },
          country: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const params = UuidParamsSchema.parse(request.params);
      const body = UpdateCitySchema.parse(request.body);
      
      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: params.id }
      });

      if (!existingCity) {
        return reply.code(404).send({
          success: false,
          error: 'City not found'
        });
      }
      
      const city = await prisma.city.update({
        where: { id: params.id },
        data: body
      });

      return reply.send({
        success: true,
        data: city
      });
    } catch (error: any) {
      fastify.log.error(error);
      
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

  // DELETE /cities/:id - Delete a city
  fastify.delete('/cities/:id', {
    schema: {
      tags: ['cities'],
      summary: 'Delete city',
      description: 'Delete a city',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const params = UuidParamsSchema.parse(request.params);
      
      // Check if city exists
      const existingCity = await prisma.city.findUnique({
        where: { id: params.id },
        include: {
          _count: {
            select: { projects: true }
          }
        }
      });

      if (!existingCity) {
        return reply.code(404).send({
          success: false,
          error: 'City not found'
        });
      }

      // Check if city has projects
      if (existingCity._count.projects > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot delete city with existing projects'
        });
      }
      
      await prisma.city.delete({
        where: { id: params.id }
      });

      return reply.send({
        success: true,
        message: 'City deleted successfully'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

export default fastifyPlugin(cityRoutes);
