// ============================================
// PulseOps CRM - Health Check Route
// ============================================

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/health
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        server: 'running',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        server: 'running',
      },
    });
  }
});

export default router;
