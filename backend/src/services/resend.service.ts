// ============================================
// PulseOps CRM - Resend Email Service
// ============================================

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || '';
const fromEmail = process.env.FROM_EMAIL || 'noreply@pulseops.com';

// Initialize Resend Client if API key is provided and is not placeholder
const isConfigured = apiKey && apiKey !== 're_your_resend_api_key';
const resend = isConfigured ? new Resend(apiKey) : null;

if (!isConfigured) {
  console.warn('⚠️ Resend email client is not configured. Emails will be logged to console in mock mode.');
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[MOCK EMAIL CONTENT]\n${html}\n----------------------------------`);
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return false;
    }

    console.log(`📧 Email sent successfully to ${to} via Resend. ID: ${data?.id}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send email via Resend:', err);
    return false;
  }
}
