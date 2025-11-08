const healthRoutes = async (fastify: any) => {
  // GET /health - Health check endpoint
  fastify.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Health check endpoint',
      description: 'Check API health and database connectivity',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Test database connection
      await fastify.prisma.$queryRaw`SELECT 1`;
      
      return reply.code(200).send({
        status: 'ok',
        message: 'API running successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error(error, 'Health check failed');
      
      return reply.code(503).send({
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  });
};

export default healthRoutes;