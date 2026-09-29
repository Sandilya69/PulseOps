const app = require('./dist/app').default;
const prisma = require('./dist/lib/prisma').default;

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected');
    
    const port = 5000;
    const server = app.listen(port, () => {
      console.log('Server listening on', port);
      console.log('Address:', server.address());
    });
    
    // Keep alive
    setInterval(() => {}, 1000);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();