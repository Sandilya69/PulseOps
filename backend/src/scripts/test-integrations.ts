// ============================================
// PulseOps CRM - Integration Verification Script
// ============================================

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { sendEmail } from '../services/resend.service';
import { sendWhatsApp, triggerVoiceCall } from '../services/twilio.service';

async function runVerification() {
  console.log('🧪 Starting PulseOps Integration Verification Tests...\n');

  // Test Email (Resend)
  console.log('📬 1. Testing Resend Email Service...');
  const emailSuccess = await sendEmail(
    'test-engineer@pulseops.com',
    '🧪 PulseOps Integration test email',
    '<h3>Integration Service Active</h3><p>Your Resend email integration is working perfectly!</p>'
  );
  console.log(`Result: ${emailSuccess ? '✅ SUCCESS' : '❌ FAILED'}\n`);

  // Test Twilio WhatsApp
  console.log('💬 2. Testing Twilio WhatsApp Notification Service...');
  const whatsappSuccess = await sendWhatsApp(
    '+1234567890',
    '🚨 PulseOps Test WhatsApp Alert: Primary server latency is > 800ms!'
  );
  console.log(`Result: ${whatsappSuccess ? '✅ SUCCESS' : '❌ FAILED'}\n`);

  // Test Twilio Voice Call
  console.log('📞 3. Testing Twilio Voice Call Alert Service...');
  const voiceSuccess = await triggerVoiceCall(
    '+1234567890',
    'Alert. This is a voice call testing alert from PulseOps API monitoring.'
  );
  console.log(`Result: ${voiceSuccess ? '✅ SUCCESS' : '❌ FAILED'}\n`);

  console.log('🏁 Integration Verification Complete.');
}

runVerification().catch((err) => {
  console.error('❌ Integration Verification crashed:', err);
});
