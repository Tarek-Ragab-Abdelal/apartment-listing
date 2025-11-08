import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import {
  CreateApartmentAmenityInput,
  UpdateApartmentAmenityInput,
  UuidParams
} from '../types/index';

const prisma = new PrismaClient();

async function apartmentAmenityRoutes(fastify: any) {
  // GET /apartment-amenities/:apartmentId - Get amenities for an apartment
  fastify.get('/apartment-amenities/:apartmentId', {
    schema: {
      tags: ['apartment-amenities'],
      summary: 'Get apartment amenities',
      description: 'Get all amenities for an apartment',
      params: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string' }
        },
        required: ['apartmentId']
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              apartmentId: { type: 'string' },
              amenity: { type: 'string' }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    const { apartmentId } = request.params as { apartmentId: string };

    try {
      // Check if apartment exists
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId }
      });

      if (!apartment) {
        return reply.status(404).send({ message: 'Apartment not found' });
      }

      const amenities = await prisma.apartmentAmenity.findMany({
        where: { apartmentId }
      });

      return amenities;
    } catch (error) {
      console.error('Error fetching apartment amenities:', error);
      return reply.status(500).send({ message: 'Failed to fetch apartment amenities' });
    }
  });

  // POST /apartment-amenities - Create a new apartment amenity
  fastify.post('/apartment-amenities', {
    schema: {
      tags: ['apartment-amenities'],
      summary: 'Create apartment amenity',
      description: 'Create a new apartment amenity',
      body: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string' },
          amenity: { type: 'string' }
        },
        required: ['apartmentId', 'amenity']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            apartmentId: { type: 'string' },
            amenity: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    const data = request.body as CreateApartmentAmenityInput;

    try {
      // Validate apartment exists
      const apartment = await prisma.apartment.findUnique({
        where: { id: data.apartmentId }
      });

      if (!apartment) {
        return reply.status(404).send({ message: 'Apartment not found' });
      }

      // Check for duplicate amenity name for the same apartment
      const existingAmenity = await prisma.apartmentAmenity.findFirst({
        where: {
          apartmentId: data.apartmentId,
          amenity: data.amenity
        }
      });

      if (existingAmenity) {
        return reply.status(400).send({ message: 'Amenity with this name already exists for this apartment' });
      }

      const amenity = await prisma.apartmentAmenity.create({
        data: {
          apartmentId: data.apartmentId,
          amenity: data.amenity
        }
      });

      return reply.status(201).send(amenity);
    } catch (error) {
      console.error('Error creating apartment amenity:', error);
      return reply.status(500).send({ message: 'Failed to create apartment amenity' });
    }
  });

  // PUT /apartment-amenities/:id - Update an apartment amenity
  fastify.put('/apartment-amenities/:id', {
    schema: {
      tags: ['apartment-amenities'],
      summary: 'Update apartment amenity',
      description: 'Update an apartment amenity',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          amenity: { type: 'string' }
        },
        required: ['amenity']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            apartmentId: { type: 'string' },
            amenity: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    const { id } = request.params as UuidParams;
    const data = request.body as UpdateApartmentAmenityInput;

    try {
      // Check if amenity exists
      const existingAmenity = await prisma.apartmentAmenity.findUnique({
        where: { id }
      });

      if (!existingAmenity) {
        return reply.status(404).send({ message: 'Apartment amenity not found' });
      }

      // Check for duplicate name (excluding current amenity)
      const duplicateAmenity = await prisma.apartmentAmenity.findFirst({
        where: {
          apartmentId: existingAmenity.apartmentId,
          amenity: data.amenity,
          id: { not: id }
        }
      });

      if (duplicateAmenity) {
        return reply.status(400).send({ message: 'Amenity with this name already exists for this apartment' });
      }

      const amenity = await prisma.apartmentAmenity.update({
        where: { id },
        data
      });

      return amenity;
    } catch (error) {
      console.error('Error updating apartment amenity:', error);
      return reply.status(500).send({ message: 'Failed to update apartment amenity' });
    }
  });

  // DELETE /apartment-amenities/:id - Delete an apartment amenity
  fastify.delete('/apartment-amenities/:id', {
    schema: {
      tags: ['apartment-amenities'],
      summary: 'Delete apartment amenity',
      description: 'Delete an apartment amenity',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        204: {
          type: 'null',
          description: 'Successfully deleted'
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    const { id } = request.params as UuidParams;

    try {
      // Check if amenity exists
      const existingAmenity = await prisma.apartmentAmenity.findUnique({
        where: { id }
      });

      if (!existingAmenity) {
        return reply.status(404).send({ message: 'Apartment amenity not found' });
      }

      await prisma.apartmentAmenity.delete({
        where: { id }
      });

      return reply.status(204).send();
    } catch (error) {
      console.error('Error deleting apartment amenity:', error);
      return reply.status(500).send({ message: 'Failed to delete apartment amenity' });
    }
  });
}

export default fastifyPlugin(apartmentAmenityRoutes);