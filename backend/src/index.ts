// ============================================
// PulseOps CRM - Server Entry Point
// ============================================

import app from './app';
import prisma from './lib/prisma';

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║        🚀 PulseOps CRM Backend             ║
║──────────────────────────────────────────────║
║  Server:    http://localhost:${PORT}            ║
║  Health:    http://localhost:${PORT}/api/health  ║
║  Mode:      ${process.env.NODE_ENV || 'development'}                   ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
