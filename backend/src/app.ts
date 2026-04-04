// ============================================
// PulseOps CRM - Express Application Setup
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.middleware';
import { notFoundHandler } from './middleware/errorHandler.middleware';

// Import routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import userRoutes from './routes/user.routes';
import invitationRoutes from './routes/invitation.routes';
import ticketRoutes from './routes/ticket.routes';
import activityLogRoutes from './routes/activityLog.routes';
import notificationRoutes from './routes/notification.routes';
import contactRoutes from './routes/contact.routes';

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

// ── API Routes ──
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', invitationRoutes);
app.use('/api/organizations', ticketRoutes);
app.use('/api/organizations', activityLogRoutes);
app.use('/api/users', notificationRoutes);
app.use('/api/organizations', contactRoutes);

// ── Error Handling ──
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
