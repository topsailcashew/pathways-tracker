import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shepherd API',
      version: '1.0.0',
      description: 'Backend API for Shepherd - Church Integration Platform for tracking newcomers and new believers through customizable discipleship pathways',
      contact: {
        name: 'API Support',
        email: 'support@shepherd.app',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.shepherd.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      schemas: {
        // Error Response
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid input data' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
              },
            },
          },
        },

        // User
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['VOLUNTEER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'] },
            avatar: { type: 'string', format: 'uri' },
            onboardingComplete: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Member
        Member: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            phone: { type: 'string', nullable: true },
            pathway: { type: 'string', enum: ['NEWCOMER', 'NEW_BELIEVER'] },
            currentStageId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['ACTIVE', 'INTEGRATED', 'INACTIVE'] },
            assignedToId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            currentStage: { $ref: '#/components/schemas/Stage' },
          },
        },

        // Stage
        Stage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            pathway: { type: 'string', enum: ['NEWCOMER', 'NEW_BELIEVER'] },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            order: { type: 'integer' },
            autoAdvanceEnabled: { type: 'boolean' },
          },
        },

        // Task
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            completed: { type: 'boolean' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            assignedToId: { type: 'string', format: 'uuid' },
            createdByRule: { type: 'boolean' },
          },
        },

        // Note
        Note: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            isSystem: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Pagination
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 50 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 2 },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Members',
        description: 'Member management endpoints',
      },
      {
        name: 'Tasks',
        description: 'Task management endpoints',
      },
      {
        name: 'Health',
        description: 'System health check endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
