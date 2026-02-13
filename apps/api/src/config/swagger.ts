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
          description: 'Supabase access token passed via Bearer scheme. Example: "Authorization: Bearer {token}"',
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
            phone: { type: 'string', nullable: true },
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
            gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], nullable: true },
            dateOfBirth: { type: 'string', format: 'date', nullable: true },
            address: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            state: { type: 'string', nullable: true },
            zip: { type: 'string', nullable: true },
            maritalStatus: { type: 'string', enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER'], nullable: true },
            nationality: { type: 'string', nullable: true },
            joinedDate: { type: 'string', format: 'date-time' },
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
            autoAdvanceType: { type: 'string', enum: ['TASK_COMPLETED', 'TIME_IN_STAGE'], nullable: true },
            autoAdvanceValue: { type: 'string', nullable: true },
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

        // Form
        Form: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            targetPathway: { type: 'string', enum: ['NEWCOMER', 'NEW_BELIEVER'] },
            targetStageId: { type: 'string', format: 'uuid' },
            fields: {
              type: 'array',
              items: { $ref: '#/components/schemas/FormField' },
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // FormField
        FormField: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['text', 'email', 'phone', 'number', 'date', 'select', 'textarea', 'checkbox'] },
            required: { type: 'boolean' },
            placeholder: { type: 'string', nullable: true },
            options: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
            },
            mapTo: {
              type: 'string',
              enum: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'address', 'city', 'state', 'zip', 'nationality', 'maritalStatus', 'spouseName', 'spouseDob', 'emergencyContact', 'isChurchMember', 'titheNumber'],
              nullable: true,
            },
          },
          required: ['id', 'label', 'type', 'required'],
        },

        // FormSubmission
        FormSubmission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            formId: { type: 'string', format: 'uuid' },
            data: { type: 'object', additionalProperties: true },
            memberId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // AutomationRule
        AutomationRule: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            stageId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            taskDescription: { type: 'string' },
            daysDue: { type: 'integer' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            enabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            stage: { $ref: '#/components/schemas/Stage' },
          },
        },

        // Integration
        Integration: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            sourceName: { type: 'string' },
            sheetUrl: { type: 'string', format: 'uri' },
            targetPathway: { type: 'string', enum: ['NEWCOMER', 'NEW_BELIEVER'] },
            targetStageId: { type: 'string', format: 'uuid' },
            autoCreateTask: { type: 'boolean' },
            taskDescription: { type: 'string', nullable: true },
            autoWelcome: { type: 'boolean' },
            syncFrequency: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'ERROR', 'PAUSED'] },
            lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ChurchSettings
        ChurchSettings: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            website: { type: 'string', format: 'uri', nullable: true },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string', nullable: true },
            denomination: { type: 'string', nullable: true },
            weeklyAttendance: { type: 'integer', nullable: true },
            timezone: { type: 'string', nullable: true },
            memberTerm: { type: 'string', nullable: true },
            autoWelcome: { type: 'boolean' },
            serviceTimes: {
              type: 'array',
              items: { $ref: '#/components/schemas/ServiceTime' },
            },
          },
        },

        // ServiceTime
        ServiceTime: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            day: { type: 'string', enum: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] },
            time: { type: 'string', example: '09:00' },
            name: { type: 'string' },
          },
        },

        // Communication
        Communication: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['EMAIL', 'SMS'] },
            subject: { type: 'string', nullable: true },
            content: { type: 'string' },
            status: { type: 'string', enum: ['SENT', 'FAILED', 'PENDING'] },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
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
        description: 'Supabase Auth sync and session management',
      },
      {
        name: 'Members',
        description: 'Member management — CRUD, bulk import, stage advancement, notes, and tags',
      },
      {
        name: 'Tasks',
        description: 'Task management — CRUD, completion, and statistics',
      },
      {
        name: 'Users',
        description: 'User management — CRUD, role updates, and statistics',
      },
      {
        name: 'Stages',
        description: 'Pathway stage management — CRUD, reordering, and statistics',
      },
      {
        name: 'Forms',
        description: 'Public form builder — CRUD, public access, submissions, and member auto-creation',
      },
      {
        name: 'AI',
        description: 'AI-powered message generation and journey analysis',
      },
      {
        name: 'Automation Rules',
        description: 'Stage-triggered automation rules for automatic task creation',
      },
      {
        name: 'Settings',
        description: 'Tenant-level church settings and service times',
      },
      {
        name: 'Church',
        description: 'Church profile management, statistics, and service times',
      },
      {
        name: 'Analytics',
        description: 'Dashboard analytics — overview, member metrics, task metrics, and data export',
      },
      {
        name: 'Communications',
        description: 'Email and SMS messaging — send, history, and statistics',
      },
      {
        name: 'Integrations',
        description: 'Google Sheets integration — CRUD, sync, test connection, and statistics',
      },
      {
        name: 'Health',
        description: 'System health check',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
