import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function watchlistRoutes(fastify: any) {
  // GET /watchlists - Get watchlists with filtering and pagination
  fastify.get('/watchlists', {
    schema: {
      tags: ['watchlists'],
      summary: 'Get watchlists',
      description: 'Get all watchlists with filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const query = request.query as {
        userId?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
      };

      // Pagination defaults
      const page = Number.parseInt(query.page || '1', 10);
      const limit = Number.parseInt(query.limit || '10', 10);

      const where: any = {};
      
      if (query.userId) {
        where.userId = query.userId;
      }      const [watchlists, total] = await Promise.all([
        prisma.watchlist.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            },
            apartment: {
              select: {
                id: true,
                unitName: true,
                unitNumber: true,
                bedrooms: true,
                bathrooms: true,
                areaSqm: true,
                priceEgp: true,
                status: true,
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
                images: {
                  select: {
                    id: true,
                    imageUrl: true
                  },
                  orderBy: { position: 'asc' },
                  take: 1
                }
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.watchlist.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        success: true,
        data: watchlists,
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

  // POST /watchlists - Add apartment to watchlist
  fastify.post('/watchlists', {
    schema: {
      tags: ['watchlists'],
      summary: 'Create watchlist entry',
      description: 'Add apartment to user watchlist',
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          apartmentId: { type: 'string', format: 'uuid' }
        },
        required: ['userId', 'apartmentId']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
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
      const { userId, apartmentId } = request.body as {
        userId: string;
        apartmentId: string;
      };
      
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return reply.code(400).send({
          success: false,
          error: 'User not found'
        });
      }

      // Verify apartment exists
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId }
      });

      if (!apartment) {
        return reply.code(400).send({
          success: false,
          error: 'Apartment not found'
        });
      }

      // Check if watchlist entry already exists
      const existingWatchlist = await prisma.watchlist.findUnique({
        where: {
          userId_apartmentId: {
            userId: userId,
            apartmentId: apartmentId
          }
        }
      });

      if (existingWatchlist) {
        return reply.code(400).send({
          success: false,
          error: 'Apartment already in watchlist'
        });
      }
      
      const watchlist = await prisma.watchlist.create({
        data: {
          userId,
          apartmentId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true,
              priceEgp: true,
              project: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      return reply.code(201).send({
        success: true,
        data: watchlist
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

  // DELETE /watchlists/:userId/:apartmentId - Remove apartment from watchlist
  fastify.delete('/watchlists/:userId/:apartmentId', {
    schema: {
      tags: ['watchlists'],
      summary: 'Remove watchlist entry',
      description: 'Remove apartment from user watchlist',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          apartmentId: { type: 'string', format: 'uuid' }
        },
        required: ['userId', 'apartmentId']
      },
      body: false, 
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
      const { userId, apartmentId } = request.params;
      
      // Check if watchlist entry exists
      const existingWatchlist = await prisma.watchlist.findUnique({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId
          }
        }
      });

      if (!existingWatchlist) {
        return reply.code(404).send({
          success: false,
          error: 'Watchlist entry not found'
        });
      }
      
      await prisma.watchlist.delete({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId
          }
        }
      });

      return reply.send({
        success: true,
        message: 'Apartment removed from watchlist successfully'
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

export default fastifyPlugin(watchlistRoutes);
