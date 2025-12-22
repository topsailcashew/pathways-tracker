import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { swaggerSpec } from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/members.routes';
import taskRoutes from './routes/tasks.routes';

const app: Application = express();

// ========================================
// MIDDLEWARE STACK
// ========================================

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })
);

// 3. Request ID
app.use((req: Request, _res: Response, next) => {
    req.requestId = uuidv4();
    next();
});

// 4. Request logging
app.use((req: Request, res: Response, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path}`, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.requestId,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    });

    next();
});

// 5. Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// 6. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// API DOCUMENTATION
// ========================================

/**
 * @swagger
 * /api/docs:
 *   get:
 *     tags: [Documentation]
 *     summary: API Documentation
 *     description: Interactive Swagger UI documentation for the Pathways Tracker API
 *     responses:
 *       200:
 *         description: Swagger UI page
 */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Pathways Tracker API Documentation',
}));

// Serve raw OpenAPI spec
app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ========================================
// HEALTH CHECK
// ========================================

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 */
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});

// ========================================
// API ROUTES
// ========================================

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/tasks', taskRoutes);
// TODO: Add more routes as they are created
// app.use('/api/users', userRoutes);
// app.use('/api/stages', stageRoutes);
// app.use('/api/automation-rules', automationRoutes);
// app.use('/api/communications', communicationRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/integrations', integrationRoutes);
// app.use('/api/analytics', analyticsRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
