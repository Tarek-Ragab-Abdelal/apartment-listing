import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reviewRoutes(fastify: any) {
  // GET /reviews - Get reviews with filtering and pagination
  fastify.get('/reviews', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          minRating: { type: 'number', minimum: 1, maximum: 5 },
          maxRating: { type: 'number', minimum: 1, maximum: 5 },
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
        rating?: string;
        minRating?: string;
        maxRating?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
      };
      
      const where: any = {};
      
      if (query.apartmentId) {
        where.apartmentId = query.apartmentId;
      }
      
      if (query.userId) {
        where.userId = query.userId;
      }
      
      if (query.minRating || query.maxRating) {
        where.rating = {};
        if (query.minRating) where.rating.gte = Number.parseInt(query.minRating, 10);
        if (query.maxRating) where.rating.lte = Number.parseInt(query.maxRating, 10);
      }

      // Pagination defaults
      const page = Number.parseInt(query.page || '1', 10);
      const limit = Number.parseInt(query.limit || '10', 10);

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
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
                avatarUrl: true,
                role: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.review.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        success: true,
        data: reviews,
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

  // GET /reviews/:id - Get review by ID
  fastify.get('/reviews/:id', {
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

      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true,
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
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          }
        }
      });

      if (!review) {
        return reply.code(404).send({
          success: false,
          error: 'Review not found'
        });
      }

      return reply.send({
        success: true,
        data: review
      });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /reviews - Create new review
  fastify.post('/reviews', {
    schema: {
      body: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string' }
        },
        required: ['apartmentId', 'userId', 'rating']
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const body = request.body as {
        apartmentId: string;
        userId: string;
        rating: number;
        comment?: string;
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

      // Check if user already reviewed this apartment
      const existingReview = await prisma.review.findFirst({
        where: {
          apartmentId: body.apartmentId,
          userId: body.userId
        }
      });

      if (existingReview) {
        return reply.code(400).send({
          success: false,
          error: 'User has already reviewed this apartment'
        });
      }

      // Check if user is trying to review their own apartment
      if (apartment.listerId === body.userId) {
        return reply.code(400).send({
          success: false,
          error: 'Users cannot review their own apartments'
        });
      }
      
      const review = await prisma.review.create({
        data: body,
        include: {
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          }
        }
      });

      return reply.code(201).send({
        success: true,
        data: review
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

  // PUT /reviews/:id - Update review
  fastify.put('/reviews/:id', {
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
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        rating?: number;
        comment?: string;
      };
      
      // Check if review exists
      const existingReview = await prisma.review.findUnique({
        where: { id }
      });

      if (!existingReview) {
        return reply.code(404).send({
          success: false,
          error: 'Review not found'
        });
      }

      const review = await prisma.review.update({
        where: { id },
        data: body,
        include: {
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: review
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

  // DELETE /reviews/:id - Delete review
  fastify.delete('/reviews/:id', {
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
      
      // Check if review exists
      const existingReview = await prisma.review.findUnique({
        where: { id }
      });

      if (!existingReview) {
        return reply.code(404).send({
          success: false,
          error: 'Review not found'
        });
      }

      await prisma.review.delete({
        where: { id }
      });      return reply.send({
        success: true,
        message: 'Review deleted successfully'
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

export default fastifyPlugin(reviewRoutes);
