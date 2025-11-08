import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function projectRoutes(fastify: any) {
  // GET /projects - Get all projects with filtering and pagination
  fastify.get('/projects', {
    schema: {
      tags: ['projects'],
      summary: 'Get projects',
      description: 'Get all projects with filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          cityId: { type: 'string', format: 'uuid' },
          search: { type: 'string', description: 'Search by name or description' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            pagination: { type: 'object' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const query = request.query as {
        cityId?: string;
        search?: string;
        page?: string;
        limit?: string;
      };
      
      const where: any = {};
      
      if (query.cityId) {
        where.cityId = query.cityId;
      }
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      // Pagination defaults
      const page = Number.parseInt(query.page || '1', 10);
      const limit = Number.parseInt(query.limit || '10', 10);

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            city: {
              select: {
                id: true,
                name: true,
                country: true
              }
            },
            _count: {
              select: {
                apartments: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.project.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        success: true,
        data: projects,
        meta: {
          page,
          limit,
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

  // GET /projects/:id - Get single project by ID
  fastify.get('/projects/:id', {
    schema: {
      tags: ['projects'],
      summary: 'Get project by ID',
      description: 'Get a single project by its ID',
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
            data: { type: 'object' }
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

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          city: {
            select: {
              id: true,
              name: true,
              country: true
            }
          },
          apartments: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true,
              bedrooms: true,
              bathrooms: true,
              areaSqm: true,
              priceEgp: true,
              status: true,
              createdAt: true
            },
            where: {
              status: 'ACTIVE'
            },
            orderBy: { unitName: 'asc' }
          }
        }
      });

      if (!project) {
        return reply.code(404).send({
          success: false,
          error: 'Project not found'
        });
      }

      return reply.send({
        success: true,
        data: project
      });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /projects - Create new project
  fastify.post('/projects', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          cityId: { type: 'string', format: 'uuid' },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' }
        },
        required: ['name', 'cityId']
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const body = request.body as {
        name: string;
        description?: string;
        cityId: string;
        address?: string;
        latitude?: number;
        longitude?: number;
      };
      
      // Verify city exists
      const city = await prisma.city.findUnique({
        where: { id: body.cityId }
      });

      if (!city) {
        return reply.code(400).send({
          success: false,
          error: 'City not found'
        });
      }
      
      const project = await prisma.project.create({
        data: body,
        include: {
          city: {
            select: {
              id: true,
              name: true,
              country: true
            }
          }
        }
      });

      return reply.code(201).send({
        success: true,
        data: project
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

  // PUT /projects/:id - Update project
  fastify.put('/projects/:id', {
    schema: {
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
          description: { type: 'string' },
          cityId: { type: 'string', format: 'uuid' },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        description?: string;
        cityId?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
      };
      
      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id }
      });

      if (!existingProject) {
        return reply.code(404).send({
          success: false,
          error: 'Project not found'
        });
      }

      // Verify city exists if cityId is being updated
      if (body.cityId) {
        const city = await prisma.city.findUnique({
          where: { id: body.cityId }
        });

        if (!city) {
          return reply.code(400).send({
            success: false,
            error: 'City not found'
          });
        }
      }
      
      const project = await prisma.project.update({
        where: { id },
        data: body,
        include: {
          city: {
            select: {
              id: true,
              name: true,
              country: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: project
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

  // DELETE /projects/:id - Delete project
  fastify.delete('/projects/:id', {
    schema: {
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
      const { id } = request.params as { id: string };
      
      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          _count: {
            select: { apartments: true }
          }
        }
      });

      if (!existingProject) {
        return reply.code(404).send({
          success: false,
          error: 'Project not found'
        });
      }

      // Check if project has apartments
      if (existingProject._count.apartments > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot delete project with existing apartments'
        });
      }
      
      await prisma.project.delete({
        where: { id }
      });

      return reply.send({
        success: true,
        message: 'Project deleted successfully'
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

export default fastifyPlugin(projectRoutes);
