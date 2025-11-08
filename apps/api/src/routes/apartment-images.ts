import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import {
  CreateApartmentImageSchema,
  UpdateApartmentImageSchema
} from '../types/index';

const prisma = new PrismaClient();

const apartmentImageRoutes = async (fastify: any) => {
  // GET /apartment-images/:apartmentId - Get images for an apartment
  fastify.get('/apartment-images/:apartmentId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string', format: 'uuid' }
        },
        required: ['apartmentId']
      }
    }
  }, async (request, reply) => {
    try {
      const apartmentId = request.params.apartmentId;
      
      // Verify apartment exists
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId }
      });

      if (!apartment) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment not found'
        });
      }

      const images = await prisma.apartmentImage.findMany({
        where: { apartmentId },
        orderBy: { position: 'asc' }
      });

      return reply.send({
        success: true,
        data: images
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // POST /apartment-images - Create new apartment image
  fastify.post('/apartment-images', {
    schema: {
      tags: ['apartment-images'],
      summary: 'Create apartment image',
      description: 'Create a new apartment image',
      body: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string', format: 'uuid' },
          imageUrl: { type: 'string', format: 'uri' },
          position: { type: 'number', minimum: 0 }
        },
        required: ['apartmentId', 'imageUrl']
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
                apartmentId: { type: 'string' },
                imageUrl: { type: 'string' },
                position: { type: 'number' },
                createdAt: { type: 'string' }
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
      const body = CreateApartmentImageSchema.parse(request.body);
      
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
      
      const image = await prisma.apartmentImage.create({
        data: body as any
      });

      return reply.code(201).send({
        success: true,
        data: image
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

  // PUT /apartment-images/:id - Update apartment image
  fastify.put('/apartment-images/:id', {
    schema: {
      tags: ['apartment-images'],
      summary: 'Update apartment image',
      description: 'Update an apartment image',
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
          imageUrl: { type: 'string', format: 'uri' },
          position: { type: 'number', minimum: 0 }
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
                apartmentId: { type: 'string' },
                imageUrl: { type: 'string' },
                position: { type: 'number' },
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
      const body = UpdateApartmentImageSchema.parse(request.body);
      
      // Check if image exists
      const existingImage = await prisma.apartmentImage.findUnique({
        where: { id }
      });

      if (!existingImage) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment image not found'
        });
      }
      
      const image = await prisma.apartmentImage.update({
        where: { id },
        data: body
      });

      return reply.send({
        success: true,
        data: image
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

  // DELETE /apartment-images/:id - Delete apartment image
  fastify.delete('/apartment-images/:id', {
    schema: {
      tags: ['apartment-images'],
      summary: 'Delete apartment image',
      description: 'Delete an apartment image',
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
      
      // Check if image exists
      const existingImage = await prisma.apartmentImage.findUnique({
        where: { id }
      });

      if (!existingImage) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment image not found'
        });
      }
      
      await prisma.apartmentImage.delete({
        where: { id }
      });

      return reply.send({
        success: true,
        message: 'Apartment image deleted successfully'
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

export default fastifyPlugin(apartmentImageRoutes);
