import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { PrismaClient } from '@prisma/client';

const directUrl = 'postgresql://postgres:Rituraj89%2A%2A@db.llzeaufojwfbeeppmdsp.supabase.co:5432/postgres';

async function testIPv4Connection() {
  console.log('Testing Direct URL with ipv4first DNS order...');
  const client = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    await client.$connect();
    console.log('🎉 SUCCESS! Connected to Supabase DB via IPv4!');
    const usersCount = await client.user.count();
    console.log(`User count in DB: ${usersCount}`);
    await client.$disconnect();
  } catch (e: any) {
    console.log('❌ Direct IPv4 Failed:', e);
    await client.$disconnect();
  }
}

testIPv4Connection();
