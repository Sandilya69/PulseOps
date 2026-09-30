// ============================================
// PulseOps CRM - Express Application Setup
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middleware/errorHandler.middleware';
import { notFoundHandler } from './middleware/errorHandler.middleware';
import { registry } from './lib/swagger';

// Import routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import userRoutes, { orgUserRouter } from './routes/user.routes';
import invitationRoutes from './routes/invitation.routes';
import ticketRoutes from './routes/ticket.routes';
import activityLogRoutes from './routes/activityLog.routes';
import notificationRoutes from './routes/notification.routes';
import contactRoutes from './routes/contact.routes';
import incidentRoutes from './routes/incident.routes';
import monitoredApiRoutes from './routes/monitoredApi.routes';
import alertRuleRoutes from './routes/alertRule.routes';
import webhookRoutes from './routes/webhook.routes';

// Import OpenAPI schemas
import './routes/schemas/auth.openapi';
import './routes/schemas/organization.openapi';
import './routes/schemas/user.openapi';
import './routes/schemas/invitation.openapi';
import './routes/schemas/ticket.openapi';
import './routes/schemas/activityLog.openapi';
import './routes/schemas/notification.openapi';
import './routes/schemas/contact.openapi';
import './routes/schemas/incident.openapi';
import './routes/schemas/monitoredApi.openapi';
import './routes/schemas/alertRule.openapi';
import './routes/schemas/webhook.openapi';

dotenv.config();

const app = express();

// ── Global Middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── API Documentation ──
if (process.env.NODE_ENV !== 'production') {
  const swaggerDocument = {
    openapi: '3.1.0',
    info: {
      title: 'PulseOps CRM API',
      version: '1.0.0',
      description: 'API documentation for PulseOps CRM - Team collaboration platform for infrastructure monitoring',
      contact: {
        name: 'PulseOps Support',
        email: 'support@pulseops.example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development server' },
      { url: 'https://api.pulseops.example.com/api', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: (registry as any).definitions,
    },
    paths: (registry as any).definitions?.paths || {},
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Organizations', description: 'Organization management' },
      { name: 'Users', description: 'User management and roles' },
      { name: 'Invitations', description: 'Team member invitations' },
      { name: 'Tickets', description: 'Support ticket system' },
      { name: 'Activity Logs', description: 'Audit trail and activity tracking' },
      { name: 'Notifications', description: 'User notifications and preferences' },
      { name: 'Contacts', description: 'External stakeholder contacts' },
      { name: 'Incidents', description: 'Incident management and collaboration' },
      { name: 'Monitored APIs', description: 'API monitoring configuration' },
      { name: 'Alert Rules', description: 'Alert rule configuration' },
      { name: 'Webhooks', description: 'Incoming webhook handlers' },
    ],
  };
  
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PulseOps CRM API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));
  
  // JSON endpoint for programmatic access
  app.get('/api/docs.json', (req, res) => {
    res.json(swaggerDocument);
  });
}

// ── API Routes ──
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations/:orgId/users', orgUserRouter);
app.use('/api/organizations', invitationRoutes);
app.use('/api/organizations', ticketRoutes);
app.use('/api/organizations', activityLogRoutes);
app.use('/api/users', notificationRoutes);
app.use('/api/organizations', contactRoutes);
app.use('/api/organizations', incidentRoutes);
app.use('/api/organizations', monitoredApiRoutes);
app.use('/api/organizations', alertRuleRoutes);
app.use('/api', webhookRoutes);

// ── Error Handling ──
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
