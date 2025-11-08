import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import {
  CreateApartmentSchema,
  UpdateApartmentSchema,
  ApartmentQuerySchema,
  ApartmentSearchSchema
} from '../types/index';
import { authenticateToken } from '../lib/auth';

const prisma = new PrismaClient();

async function apartmentRoutes(fastify: any) {
  //#region GET Routes
  // GET /apartments - Simple GET endpoint for basic queries (backward compatibility)
  fastify.get('/apartments', {
    preHandler: authenticateToken,
    schema: {
      tags: ['apartments'],
      summary: 'Get all apartments (basic)',
      description: 'Get all apartments with basic filtering and pagination (excludes current user listings). For advanced filtering with multiple values, use POST /apartments/search',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          projectId: { type: 'string', format: 'uuid' },
          cityId: { type: 'string', format: 'uuid' },
          listerId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SOLD'] },
          minPrice: { type: 'number', minimum: 0 },
          maxPrice: { type: 'number', minimum: 0 },
          minArea: { type: 'number', minimum: 0 },
          maxArea: { type: 'number', minimum: 0 },
          bedrooms: { type: 'number', minimum: 0 },
          bathrooms: { type: 'number', minimum: 0 },
          search: { type: 'string', description: 'Search by unit name or description' },
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
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number', description: 'Total count of all apartments in database' },
                totalFiltered: { type: 'number', description: 'Total count of apartments matching current filters' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const query = ApartmentQuerySchema.parse(request.query);
      
      // Build where clause
      const where: any = {};
      
      // Exclude apartments listed by the current user
      if (request.user) {
        where.listerId = {
          not: request.user.id
        };
      }
      
      if (query.projectId) {
        where.projectId = query.projectId;
      }
      
      if (query.listerId) {
        // Override the exclusion if a specific lister is requested
        where.listerId = query.listerId;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.cityId) {
        where.project = {
          cityId: query.cityId
        };
      }
      
      if (query.minPrice || query.maxPrice) {
        where.priceEgp = {};
        if (query.minPrice) where.priceEgp.gte = query.minPrice;
        if (query.maxPrice) where.priceEgp.lte = query.maxPrice;
      }

      if (query.minArea || query.maxArea) {
        where.areaSqm = {};
        if (query.minArea) where.areaSqm.gte = query.minArea;
        if (query.maxArea) where.areaSqm.lte = query.maxArea;
      }

      if (query.bedrooms !== undefined) {
        where.bedrooms = query.bedrooms;
      }

      if (query.bathrooms !== undefined) {
        where.bathrooms = query.bathrooms;
      }
      
      if (query.search) {
        where.OR = [
          { unitName: { contains: query.search, mode: 'insensitive' } },
          { unitNumber: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [apartments, totalFiltered, totalAll] = await Promise.all([
        prisma.apartment.findMany({
          where,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                    country: true
                  }
                }
              }
            },
            lister: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true
              }
            },
            images: {
              select: {
                id: true,
                imageUrl: true,
                position: true
              },
              orderBy: { position: 'asc' }
            },
            amenities: {
              select: {
                id: true,
                amenity: true
              }
            },
            _count: {
              select: {
                watchlists: true,
                reviews: true,
                visits: true
              }
            }
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.apartment.count({ where }), 
        prisma.apartment.count() 
      ]);

      const totalPages = Math.ceil(totalFiltered / query.limit);

      return reply.send({
        success: true,
        data: apartments,
        meta: {
          page: query.page,
          limit: query.limit,
          total: totalAll,
          totalFiltered: totalFiltered,
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

  // GET /apartments/:id - Get apartment by ID
  fastify.get('/apartments/:id', {
    schema: {
      tags: ['apartments'],
      summary: 'Get apartment by ID',
      description: 'Get apartment by ID with full details including project, lister, images, amenities, reviews',
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
      const { id } = request.params as { id: string };
      
      const apartment = await prisma.apartment.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              latitude: true,
              longitude: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: true
                }
              }
            }
          },
          lister: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              avatarUrl: true
            }
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              position: true
            },
            orderBy: { position: 'asc' }
          },
          amenities: {
            select: {
              id: true,
              amenity: true
            }
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              watchlists: true,
              reviews: true,
              visits: true
            }
          }
        }
      });

      if (!apartment) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment not found'
        });
      }

      return reply.send({
        success: true,
        data: apartment
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // GET /apartments/:id/related - Get related apartments (limit 3)
  fastify.get('/apartments/:id/related', {
    schema: {
      tags: ['apartments'],
      summary: 'Get related apartments',
      description: 'Get related apartments (limit 3) based on same project, city, size, price range',
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
      const { id } = request.params as { id: string };
      
      // First get the current apartment
      const currentApartment = await prisma.apartment.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              city: true
            }
          }
        }
      });

      if (!currentApartment) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment not found'
        });
      }

      // Find related apartments based on priority:
      // 1. Same project
      // 2. Same city
      // 3. Similar size (±20%)
      // 4. Similar price range (±30%)

      const relatedApartments = await prisma.$queryRaw`
        WITH apartment_data AS (
          SELECT 
            a.*,
            p.name as project_name,
            c.name as city_name,
            c.country,
            CASE 
              WHEN a.project_id = ${currentApartment.projectId}::uuid THEN 4
              WHEN p.city_id = ${currentApartment.project.cityId}::uuid THEN 3
              WHEN a.area_sqm IS NOT NULL AND ${currentApartment.areaSqm} IS NOT NULL 
                AND a.area_sqm BETWEEN ${currentApartment.areaSqm ? Number(currentApartment.areaSqm) * 0.8 : 0} 
                AND ${currentApartment.areaSqm ? Number(currentApartment.areaSqm) * 1.2 : 999999} THEN 2
              WHEN a.price_egp IS NOT NULL AND ${currentApartment.priceEgp} IS NOT NULL 
                AND a.price_egp BETWEEN ${currentApartment.priceEgp ? Number(currentApartment.priceEgp) * 0.7 : 0} 
                AND ${currentApartment.priceEgp ? Number(currentApartment.priceEgp) * 1.3 : 999999999} THEN 1
              ELSE 0
            END as relevance_score
          FROM apartments a
          JOIN projects p ON a.project_id = p.id
          JOIN cities c ON p.city_id = c.id
          WHERE a.id != ${id}::uuid AND a.status = 'ACTIVE'
        )
        SELECT * FROM apartment_data 
        WHERE relevance_score > 0
        ORDER BY relevance_score DESC, created_at DESC
        LIMIT 3
      `;

      // Get full apartment details for the related apartments
      const relatedIds = (relatedApartments as any[]).map(apt => apt.id);
      
      const fullRelatedApartments = await prisma.apartment.findMany({
        where: {
          id: { in: relatedIds }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: true
                }
              }
            }
          },
          lister: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              position: true
            },
            orderBy: { position: 'asc' },
            take: 1 // Only get first image for related apartments
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: fullRelatedApartments
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  //#endregion

  //#region POST Routes
  // POST /apartments/search - Get all apartments with optional filtering and pagination (supports multiple values)
  fastify.post('/apartments/search', {
    preHandler: authenticateToken,
    schema: {
      tags: ['apartments'],
      summary: 'Search all apartments',
      description: 'Get all apartments with comprehensive filtering and pagination (excludes current user listings). Supports multiple values for project, city, lister, and status filters.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          projectIds: { 
            type: 'array', 
            items: { type: 'string', format: 'uuid' },
            description: 'Filter by multiple project IDs'
          },
          cityIds: { 
            type: 'array', 
            items: { type: 'string', format: 'uuid' },
            description: 'Filter by multiple city IDs'
          },
          listerIds: { 
            type: 'array', 
            items: { type: 'string', format: 'uuid' },
            description: 'Filter by multiple lister IDs'
          },
          statuses: { 
            type: 'array', 
            items: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SOLD'] },
            description: 'Filter by multiple statuses'
          },
          minPrice: { type: 'number', minimum: 0 },
          maxPrice: { type: 'number', minimum: 0 },
          minArea: { type: 'number', minimum: 0 },
          maxArea: { type: 'number', minimum: 0 },
          bedrooms: { type: 'number', minimum: 0 },
          bathrooms: { type: 'number', minimum: 0 },
          search: { type: 'string', description: 'Search by unit name or description' },
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
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number', description: 'Total count of all apartments in database' },
                totalFiltered: { type: 'number', description: 'Total count of apartments matching current filters' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const query = ApartmentSearchSchema.parse(request.body);
      
      // Build where clause
      const where: any = {};
      
      // Exclude apartments listed by the current user
      if (request.user) {
        where.listerId = {
          not: request.user.id
        };
      }
      
      if (query.projectIds && query.projectIds.length > 0) {
        where.projectId = {
          in: query.projectIds
        };
      }
      
      if (query.listerIds && query.listerIds.length > 0) {
        // Override the exclusion if specific listers are requested
        where.listerId = {
          in: query.listerIds
        };
      }

      if (query.statuses && query.statuses.length > 0) {
        where.status = {
          in: query.statuses
        };
      }

      if (query.cityIds && query.cityIds.length > 0) {
        where.project = {
          cityId: {
            in: query.cityIds
          }
        };
      }
      
      if (query.minPrice || query.maxPrice) {
        where.priceEgp = {};
        if (query.minPrice) where.priceEgp.gte = query.minPrice;
        if (query.maxPrice) where.priceEgp.lte = query.maxPrice;
      }

      if (query.minArea || query.maxArea) {
        where.areaSqm = {};
        if (query.minArea) where.areaSqm.gte = query.minArea;
        if (query.maxArea) where.areaSqm.lte = query.maxArea;
      }

      if (query.bedrooms !== undefined) {
        where.bedrooms = query.bedrooms;
      }

      if (query.bathrooms !== undefined) {
        where.bathrooms = query.bathrooms;
      }
      
      if (query.search) {
        where.OR = [
          { unitName: { contains: query.search, mode: 'insensitive' } },
          { unitNumber: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [apartments, totalFiltered, totalAll] = await Promise.all([
        prisma.apartment.findMany({
          where,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                    country: true
                  }
                }
              }
            },
            lister: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true
              }
            },
            images: {
              select: {
                id: true,
                imageUrl: true,
                position: true
              },
              orderBy: { position: 'asc' }
            },
            amenities: {
              select: {
                id: true,
                amenity: true
              }
            },
            _count: {
              select: {
                watchlists: true,
                reviews: true,
                visits: true
              }
            }
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.apartment.count({ where }), 
        prisma.apartment.count() 
      ]);

      const totalPages = Math.ceil(totalFiltered / query.limit);

      return reply.send({
        success: true,
        data: apartments,
        meta: {
          page: query.page,
          limit: query.limit,
          total: totalAll,
          totalFiltered: totalFiltered,
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
  
  // POST /apartments - Create new apartment
  fastify.post('/apartments', {
    schema: {
      tags: ['apartments'],
      summary: 'Create new apartment',
      description: 'Create a new apartment',
      body: {
        type: 'object',
        properties: {
          projectId: { type: 'string', format: 'uuid' },
          unitName: { type: 'string', minLength: 1 },
          unitNumber: { type: 'string' },
          bedrooms: { type: 'number', minimum: 0 },
          bathrooms: { type: 'number', minimum: 0 },
          areaSqm: { type: 'number', minimum: 0 },
          priceEgp: { type: 'number', minimum: 0 },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          description: { type: 'string' },
          listerId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SOLD'], default: 'ACTIVE' }
        },
        required: ['projectId', 'unitName', 'listerId']
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
                projectId: { type: 'string' },
                unitName: { type: 'string' },
                unitNumber: { type: 'string' },
                bedrooms: { type: 'number' },
                bathrooms: { type: 'number' },
                areaSqm: { type: 'number' },
                priceEgp: { type: 'number' },
                address: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
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
  }, async (request, reply) => {
    try {
      const body = CreateApartmentSchema.parse(request.body);
      
      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: body.projectId }
      });

      if (!project) {
        return reply.code(400).send({
          success: false,
          error: 'Project not found'
        });
      }

      // Verify lister exists
      const lister = await prisma.user.findUnique({
        where: { id: body.listerId }
      });

      if (!lister) {
        return reply.code(400).send({
          success: false,
          error: 'Lister not found'
        });
      }
      
      const apartment = await prisma.apartment.create({
        data: body as any,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: true
                }
              }
            }
          },
          lister: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return reply.code(201).send({
        success: true,
        data: apartment
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
  //#endregion

  //#region PUT Routes
  // PUT /apartments/:id - Update apartment
  fastify.put('/apartments/:id', {
    schema: {
      tags: ['apartments'],
      summary: 'Update apartment',
      description: 'Update an existing apartment',
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
          projectId: { type: 'string', format: 'uuid' },
          unitName: { type: 'string', minLength: 1 },
          unitNumber: { type: 'string' },
          bedrooms: { type: 'number', minimum: 0 },
          bathrooms: { type: 'number', minimum: 0 },
          areaSqm: { type: 'number', minimum: 0 },
          priceEgp: { type: 'number', minimum: 0 },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          description: { type: 'string' },
          listerId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SOLD'] }
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
                projectId: { type: 'string' },
                unitName: { type: 'string' },
                unitNumber: { type: 'string' },
                bedrooms: { type: 'number' },
                bathrooms: { type: 'number' },
                areaSqm: { type: 'number' },
                priceEgp: { type: 'number' },
                address: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
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
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = UpdateApartmentSchema.parse(request.body);
      
      // Check if apartment exists
      const existingApartment = await prisma.apartment.findUnique({
        where: { id }
      });

      if (!existingApartment) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment not found'
        });
      }

      // Verify project exists if projectId is being updated
      if (body.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: body.projectId }
        });

        if (!project) {
          return reply.code(400).send({
            success: false,
            error: 'Project not found'
          });
        }
      }

      // Verify lister exists if listerId is being updated
      if (body.listerId) {
        const lister = await prisma.user.findUnique({
          where: { id: body.listerId }
        });

        if (!lister) {
          return reply.code(400).send({
            success: false,
            error: 'Lister not found'
          });
        }
      }
      
      const apartment = await prisma.apartment.update({
        where: { id },
        data: {
          ...Object.fromEntries(
            Object.entries(body).filter(([_, value]) => value !== undefined)
          )
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: true
                }
              }
            }
          },
          lister: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: apartment
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
  //#endregion

  //#region DELETE Routes
  // DELETE /apartments/:id - Delete apartment
  fastify.delete('/apartments/:id', {
    schema: {
      tags: ['apartments'],
      summary: 'Delete apartment',
      description: 'Delete an apartment',
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
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Check if apartment exists
      const existingApartment = await prisma.apartment.findUnique({
        where: { id }
      });

      if (!existingApartment) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment not found'
        });
      }
      
      await prisma.apartment.delete({
        where: { id }
      });

      return reply.send({
        success: true,
        message: 'Apartment deleted successfully'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  //#endregion
};

export default fastifyPlugin(apartmentRoutes);