// Common Swagger schemas for API documentation

export const securitySchema = {
  security: [{ bearerAuth: [] }]
};

export const authHeaderSchema = {
  type: 'object',
  properties: {
    authorization: { 
      type: 'string', 
      description: 'Bearer token (e.g., "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")'
    }
  },
  required: ['authorization']
};

export const errorResponses = {
  400: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string' }
    }
  },
  401: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Authorization token required' }
    }
  },
  403: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Insufficient permissions' }
    }
  },
  404: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Resource not found' }
    }
  },
  500: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Internal server error' }
    }
  }
};

export const paginationSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 10, description: 'Items per page' }
  }
};

export const uuidParamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Resource UUID' }
  },
  required: ['id']
};

// Common response schemas
export const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'object' }
  }
};

export const paginatedResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'array' },
    meta: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        total: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  }
};

// User schemas
export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['ADMIN', 'USER', 'AGENT'] },
    phone: { type: 'string' },
    avatarUrl: { type: 'string' },
    isVerified: { type: 'boolean' },
    lastLogin: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

// Apartment schemas
export const apartmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    projectId: { type: 'string', format: 'uuid' },
    listerId: { type: 'string', format: 'uuid' },
    unitName: { type: 'string' },
    unitNumber: { type: 'string' },
    bedrooms: { type: 'number' },
    bathrooms: { type: 'number' },
    areaSqm: { type: 'number' },
    priceEgp: { type: 'number' },
    address: { type: 'string' },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    description: { type: 'string' },
    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SOLD'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

// City schema
export const citySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    country: { type: 'string' }
  }
};

// Project schema
export const projectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string' },
    cityId: { type: 'string', format: 'uuid' },
    address: { type: 'string' },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

// Message schemas
export const messageSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    senderId: { type: 'string', format: 'uuid' },
    conversationId: { type: 'string', format: 'uuid' },
    content: { type: 'string' },
    messageType: { type: 'string', enum: ['TEXT', 'IMAGE', 'SYSTEM'] },
    isRead: { type: 'boolean' },
    readAt: { type: 'string', format: 'date-time' },
    editedAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

export const conversationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    apartmentId: { type: 'string', format: 'uuid' },
    user1Id: { type: 'string', format: 'uuid' },
    user2Id: { type: 'string', format: 'uuid' },
    lastMessageAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};