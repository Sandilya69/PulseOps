// ============================================
// PulseOps CRM - Twilio Service
// ============================================

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromPhone = process.env.TWILIO_PHONE_NUMBER || '';
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || '';

// Initialize Twilio client if all required credentials are present
const isConfigured =
  accountSid.startsWith('AC') &&
  authToken.length > 0 &&
  fromPhone.length > 0;

const client = isConfigured ? twilio(accountSid, authToken) : null;

if (!isConfigured) {
  console.warn('⚠️ Twilio client is not configured. Calls and WhatsApp alerts will be logged to console in mock mode.');
}

/**
 * Send WhatsApp notification alert
 */
export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  // WhatsApp format in Twilio: "whatsapp:+1234567890"
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const formattedFrom = fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;

  if (!client) {
    console.log(`[MOCK WHATSAPP] To: ${formattedTo} | From: ${formattedFrom} | Msg: ${message}`);
    return true;
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: formattedFrom,
      to: formattedTo
    });

    console.log(`💬 WhatsApp message sent successfully via Twilio. SID: ${response.sid}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to send WhatsApp via Twilio:', err.message || err);
    return false;
  }
}

/**
 * Trigger voice call alert using Twilio TwiML Voice API
 */
export async function triggerVoiceCall(to: string, message: string): Promise<boolean> {
  if (!client) {
    console.log(`[MOCK VOICE CALL] Calling: ${to} | Speaking: "${message}"`);
    return true;
  }

  try {
    const twimlMarkup = `<Response><Say voice="alice">${message}</Say></Response>`;
    
    const response = await client.calls.create({
      twiml: twimlMarkup,
      to: to,
      from: fromPhone
    });

    console.log(`📞 Voice call triggered successfully via Twilio. SID: ${response.sid}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to trigger Voice Call via Twilio:', err.message || err);
    return false;
  }
}
