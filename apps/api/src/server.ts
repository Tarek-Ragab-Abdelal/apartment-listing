import { app } from './lib/fastify';
import * as path from 'node:path';
import apartmentRoutes from './routes/apartments';
import apartmentImageRoutes from './routes/apartment-images';
import apartmentAmenityRoutes from './routes/apartment-amenities';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import userRoutes from './routes/users';
import cityRoutes from './routes/cities';
import projectRoutes from './routes/projects';
import messageRoutes from './routes/messages';
import watchlistRoutes from './routes/watchlists';
import reviewRoutes from './routes/reviews';
import visitRoutes from './routes/visits';

async function main() {
  try {
    // Register static file serving
    await app.register(require('@fastify/static'), {
      root: path.join(__dirname, '..', 'public'),
      prefix: '/',
    });

    // Register CORS
    await app.register(require('@fastify/cors'), {
      origin: true, // Allow all origins in development
    });

    // Register Swagger
    await app.register(require('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'Apartment Listing API',
          description: 'Backend API for managing apartment listings',
          version: '1.0.0',
        },
        host: 'localhost:4000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'Enter JWT token in the format: Bearer <token>'
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ],
        tags: [
          // System & Auth
          { name: 'health', description: 'Health check endpoints' },
          { name: 'authentication', description: 'User authentication & authorization' },
          
          // Core Entities
          { name: 'users', description: 'User management - User profiles and account operations' },
          { name: 'cities', description: 'City management - Geographic locations' },
          { name: 'projects', description: 'Project management - Real estate projects' },
          
          // Property Related
          { name: 'apartments', description: 'Apartment listings - Core property management' },
          { name: 'apartment-images', description: 'Apartment images - Property media management' },
          { name: 'apartment-amenities', description: 'Apartment amenities - Property features' },
          
          // User Interactions
          { name: 'messages', description: 'Messaging system - User conversations about properties' },
          { name: 'watchlists', description: 'User watchlists - Saved/favorited properties' },
          { name: 'reviews', description: 'Property reviews - User feedback and ratings' },
          { name: 'visits', description: 'Property visits - Scheduling and management' },
        ],
      },
    });

    // Register Swagger UI
    await app.register(require('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        persistAuthorization: true, // Persist auth between page refreshes
        customfavIcon: '/favicon.ico',
        customSiteTitle: 'Nawy - Apartment Listing API Documentation',
        customCss: `
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info { margin: 20px 0; }
          .swagger-ui .info .title { color: #2c3e50; }
          .swagger-ui .auth-wrapper { margin: 20px 0; }
          .swagger-ui .btn.authorize { 
            background: #4CAF50; 
            border-color: #4CAF50; 
            color: white;
          }
          .swagger-ui .btn.authorize:hover { 
            background: #45a049; 
          }
          .swagger-ui .auth-container .errors {
            color: #f44336;
            font-weight: bold;
          }
        `,
        initOAuth: {
          appName: 'Nawy Apartment Listing API',
          clientId: 'swagger-ui',
          realm: 'swagger-ui-realm',
          scopeSeparator: ' '
        }
      },
      staticCSP: true,
      transformStaticCSP: (header: string) => header,
      transformSpecification: (swaggerObject: any, request: any, reply: any) => {
        // Add custom instructions for using the API
        swaggerObject.info.description = `
          Backend API for managing apartment listings with real estate properties, user management, and messaging system.

          Authentication
          1. Register a new account using 'POST /api/auth/register' or login using 'POST /api/auth/login'
          2. Copy the 'token' from the response
          3. Click the Authorize button above
          4. Enter: 'Bearer <your-token-here>' (include "Bearer " prefix)
          5. Click 'Authorize'

          The token will be automatically included in all subsequent API calls and persisted across page refreshes.
        `;
        return swaggerObject;
      }
    });

    // Register routes with tags for Swagger grouping
    await app.register(healthRoutes, { prefix: '/api' });
    await app.register(authRoutes, { prefix: '/api' });
    await app.register(userRoutes, { prefix: '/api' });
    await app.register(cityRoutes, { prefix: '/api' });
    await app.register(projectRoutes, { prefix: '/api' });
    await app.register(apartmentRoutes, { prefix: '/api' });
    await app.register(apartmentImageRoutes, { prefix: '/api' });
    await app.register(apartmentAmenityRoutes, { prefix: '/api' });
    await app.register(messageRoutes, { prefix: '/api' });
    await app.register(watchlistRoutes, { prefix: '/api' });
    await app.register(reviewRoutes, { prefix: '/api' });
    await app.register(visitRoutes, { prefix: '/api' });

    // Start server
    const port = Number.parseInt(process.env.PORT || '4000');
    const host = process.env.HOST || 'localhost';

    await app.listen({ port, host });
    
    console.log(`Server running on http://${host}:${port}`);
    console.log(`API Documentation available at http://${host}:${port}/docs`);

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
  process.exit(1);
});

main();