import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import twilio from 'twilio';

async function verify() {
  console.log('--- PULSEOPS INTEGRATION CHECK ---\n');

  // 1. Resend
  console.log('Checking Resend...');
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    console.log('✅ Resend API Key format looks correct.');
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: 'tripathirituraj13@gmail.com',
        subject: 'PulseOps Test',
        html: '<p>Integration check passed!</p>'
      });
      if (error) {
        console.log('❌ Resend API failed to send:', error.message);
      } else {
        console.log(`✅ Resend successfully sent a test email! (ID: ${data?.id})`);
      }
    } catch (e: any) {
      console.log('❌ Resend verification failed:', e.message);
    }
  } else {
    console.log('❌ Resend API Key is missing or incorrectly formatted.');
  }

  console.log('\n----------------------------------\n');

  // 2. Twilio
  console.log('Checking Twilio...');
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  if (twilioSid && twilioSid.startsWith('SK')) {
    console.log('⚠️ Twilio Account SID starts with "SK", which is an API Key. It usually needs to be your main Account SID (starts with "AC").');
  } else if (twilioSid && twilioSid.startsWith('AC')) {
    console.log('✅ Twilio Account SID format looks correct.');
  } else {
    console.log('❌ Twilio Account SID is invalid or missing.');
  }
  
  if (!process.env.TWILIO_PHONE_NUMBER?.startsWith('+')) {
     console.log('⚠️ Twilio Phone Number should usually start with a "+" (e.g., +15551234567).');
  }

  console.log('\n----------------------------------\n');
  
  // 3. PostgreSQL (Prisma)
  console.log('Checking PostgreSQL...');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Successfully connected to Local PostgreSQL Database!');
    await prisma.$disconnect();
  } catch (e: any) {
    console.log('❌ Failed to connect to PostgreSQL. Is your local DB running? Error:', e.message);
  }

  console.log('\n--- CHECK COMPLETE ---');
}

verify();
