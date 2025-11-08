import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function visitRoutes(fastify: any) {
  // GET /visits - Get visits with filtering and pagination
  fastify.get('/visits', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          confirmed: { type: 'boolean' },
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const query = request.query as {
        apartmentId?: string;
        userId?: string;
        status?: string;
        page?: string;
        limit?: string;
        confirmed?: string;
        dateFrom?: string;
        dateTo?: string;
      };

      // Add pagination logic
      const page = Number.parseInt(query.page || '1', 10);
      const limit = Number.parseInt(query.limit || '10', 10);
      
      const where: any = {};
      
      if (query.apartmentId) {
        where.apartmentId = query.apartmentId;
      }
      
      if (query.userId) {
        where.userId = query.userId;
      }
      
      if (query.confirmed !== undefined) {
        where.confirmed = query.confirmed === 'true';
      }

      if (query.dateFrom || query.dateTo) {
        where.scheduledAt = {};
        if (query.dateFrom) where.scheduledAt.gte = new Date(query.dateFrom);
        if (query.dateTo) where.scheduledAt.lte = new Date(query.dateTo);
      }

      const [visits, total] = await Promise.all([
        prisma.visit.findMany({
          where,
          include: {
            apartment: {
              select: {
                id: true,
                unitName: true,
                unitNumber: true,
                address: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
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
                    phone: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { scheduledAt: 'asc' }
        }),
        prisma.visit.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        success: true,
        data: visits,
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

  // GET /visits/:id - Get visit by ID
  fastify.get('/visits/:id', {
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
      
      const visit = await prisma.visit.findUnique({
        where: { id },
        include: {
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true,
              address: true,
              latitude: true,
              longitude: true,
              project: {
                select: {
                  id: true,
                  name: true,
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
                  avatarUrl: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true
            }
          }
        }
      });

      if (!visit) {
        return reply.code(404).send({
          success: false,
          error: 'Visit not found'
        });
      }

      return reply.send({
        success: true,
        data: visit
      });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /visits - Create new visit
  fastify.post('/visits', {
    schema: {
      body: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          scheduledAt: { type: 'string', format: 'date-time' }
        },
        required: ['apartmentId', 'userId', 'scheduledAt']
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const body = request.body as {
        apartmentId: string;
        userId: string;
        scheduledAt: string;
        notes?: string;
      };
      
      // Verify apartment exists
      const apartment = await prisma.apartment.findUnique({
        where: { id: body.apartmentId }
      });

      if (!apartment) {
        return reply.code(400).send({
          success: false,
          error: 'Apartment not found'
        });
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: body.userId }
      });

      if (!user) {
        return reply.code(400).send({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is trying to visit their own apartment
      if (apartment.listerId === body.userId) {
        return reply.code(400).send({
          success: false,
          error: 'Users cannot schedule visits to their own apartments'
        });
      }

      // Check if scheduled time is in the future
      const scheduledDate = new Date(body.scheduledAt);
      if (scheduledDate <= new Date()) {
        return reply.code(400).send({
          success: false,
          error: 'Visit must be scheduled for a future date and time'
        });
      }

      // Check for conflicting visits (same apartment, same time slot ±2 hours)
      const startTime = new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000);
      const endTime = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000);

      const conflictingVisit = await prisma.visit.findFirst({
        where: {
          apartmentId: body.apartmentId,
          scheduledAt: {
            gte: startTime,
            lte: endTime
          },
          confirmed: true
        }
      });

      if (conflictingVisit) {
        return reply.code(400).send({
          success: false,
          error: 'A visit is already scheduled for this time slot (±2 hours)'
        });
      }
      
      const visit = await prisma.visit.create({
        data: {
          ...body,
          scheduledAt: new Date(body.scheduledAt)
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true,
              project: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return reply.code(201).send({
        success: true,
        data: visit
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

  // PUT /visits/:id - Update visit (mainly for confirming)
  fastify.put('/visits/:id', {
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
          scheduledAt: { type: 'string', format: 'date-time' },
          confirmed: { type: 'boolean' }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        scheduledAt?: string;
        status?: string;
        confirmed?: boolean;
        notes?: string;
      };
      
      // Check if visit exists
      const existingVisit = await prisma.visit.findUnique({
        where: { id }
      });

      if (!existingVisit) {
        return reply.code(404).send({
          success: false,
          error: 'Visit not found'
        });
      }

      // If updating scheduledAt, check if it's in the future
      if (body.scheduledAt) {
        const scheduledDate = new Date(body.scheduledAt);
        if (scheduledDate <= new Date()) {
          return reply.code(400).send({
            success: false,
            error: 'Visit must be scheduled for a future date and time'
          });
        }
      }

      const updateData: any = {};
      if (body.scheduledAt) {
        updateData.scheduledAt = new Date(body.scheduledAt);
      }
      if (body.confirmed !== undefined) {
        updateData.confirmed = body.confirmed;
      }
      
      const visit = await prisma.visit.update({
        where: { id },
        data: updateData,
        include: {
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true,
              project: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: visit
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

  // DELETE /visits/:id - Delete visit
  fastify.delete('/visits/:id', {
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
      
      // Check if visit exists (for DELETE)
      const existingVisit = await prisma.visit.findUnique({
        where: { id }
      });

      if (!existingVisit) {
        return reply.code(404).send({
          success: false,
          error: 'Visit not found'
        });
      }
      
      await prisma.visit.delete({
        where: { id }
      });

      return reply.send({
        success: true,
        message: 'Visit deleted successfully'
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

export default fastifyPlugin(visitRoutes);
