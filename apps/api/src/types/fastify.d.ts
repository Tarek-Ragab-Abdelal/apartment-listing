// Extend Fastify's types to include Swagger tags
declare module 'fastify' {
  interface FastifySchema {
    tags?: string[];
    summary?: string;
    description?: string;
  }

  // Add the FastifyPluginAsync type that seems to be missing
  export interface FastifyPluginAsync<Options = Record<never, never>> {
    (
      instance: FastifyInstance,
      options: Options
    ): Promise<void>;
  }
}