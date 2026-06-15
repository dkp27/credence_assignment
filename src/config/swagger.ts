import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Credence Transaction Management API',
      version: '1.0.0',
      description:
        'REST API for managing account transactions — Credence Full Stack Assignment',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token from /api/v1/auth/login',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@credence.com' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                userId: { type: 'integer' },
                username: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
        AsyncTransactionResponse: {
          type: 'object',
          properties: {
            jobId: { type: 'string', format: 'uuid' },
            status: { type: 'string', example: 'QUEUED' },
            message: { type: 'string' },
            enqueuedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTransactionRequest: {
          type: 'object',
          required: ['accountId', 'amount', 'transactionType'],
          properties: {
            accountId: { type: 'integer', example: 101 },
            amount: { type: 'number', format: 'decimal', example: 5000 },
            transactionType: {
              type: 'string',
              enum: ['DEBIT', 'CREDIT'],
              example: 'DEBIT',
            },
          },
        },
        CreateTransactionResponse: {
          type: 'object',
          properties: {
            transactionId: { type: 'integer', example: 1001 },
            status: { type: 'string', example: 'SUCCESS' },
            updatedBalance: { type: 'number', example: 10000 },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            transactionId: { type: 'integer' },
            accountId: { type: 'integer' },
            amount: { type: 'number' },
            transactionType: { type: 'string', enum: ['DEBIT', 'CREDIT'] },
            status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TransactionListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Transaction' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalRecords: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        AccountSummary: {
          type: 'object',
          properties: {
            accountId: { type: 'integer', example: 101 },
            currentBalance: { type: 'number', example: 10000 },
            totalCredit: { type: 'number', example: 50000 },
            totalDebit: { type: 'number', example: 40000 },
            transactionCount: { type: 'integer', example: 120 },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/routes/authRoutes.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
