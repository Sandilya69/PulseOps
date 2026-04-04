// ============================================
// PulseOps CRM - Invitation Service
// ============================================

import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';
import { Resend } from 'resend';

// Configure Resend using API key from env
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@pulseops.com';

/**
 * Invite a user via email
 */
export async function sendInvitation(
  orgId: string,
  email: string,
  role: UserRole,
  message: string | undefined,
  actor: { id: string; name: string }
) {
  // Check if user is already in the org
  const existingUser = await prisma.user.findFirst({
    where: { orgId, email }
  });

  if (existingUser) {
    throw ApiError.badRequest('This user is already a member of the organization.');
  }

  // Check for pending invitation
  const pendingInvite = await prisma.invitation.findFirst({
    where: { orgId, email, status: 'pending' }
  });

  if (pendingInvite) {
    throw ApiError.badRequest('A pending invitation already exists for this email.');
  }

  // Generate securely random token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  // Verify Organization Name
  const org = await prisma.organization.findUnique({ where: { id: orgId } });

  const invitation = await prisma.invitation.create({
    data: {
      orgId,
      email,
      role,
      token,
      message,
      expiresAt,
      invitedBy: actor.id
    }
  });

  // Log activity BEFORE sending email
  await activityLogService.log({
    orgId,
    userId: actor.id,
    action: 'user.invited',
    resourceType: 'invitation',
    resourceId: invitation.id,
    metadata: { email, role }
  });

  // Send Email
  if (process.env.RESEND_API_KEY) {
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You have been invited to join ${org?.name} on PulseOps`,
      html: `
        <h2>You've been invited!</h2>
        <p>${actor.name} has invited you to join <strong>${org?.name}</strong> on PulseOps as a ${role}.</p>
        ${message ? `<p><em>"${message}"</em></p>` : ''}
        <br />
        <a href="${inviteLink}" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <br /><br />
        <p>This link will expire in 7 days.</p>
      `
    });
  } else {
    console.log(`[Email Mock] Simulated sending invite to ${email} (Token: ${token})`);
  }

  return invitation;
}

/**
 * List active invitations
 */
export async function listInvitations(orgId: string) {
  return prisma.invitation.findMany({
    where: { orgId, status: 'pending' },
    include: { inviter: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Revoke an active invitation
 */
export async function revokeInvitation(orgId: string, invitationId: string, actorId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, orgId }
  });

  if (!invitation || invitation.status !== 'pending') {
    throw ApiError.badRequest('Invitation not found or already processed.');
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'revoked' }
  });

  await activityLogService.log({
    orgId,
    userId: actorId,
    action: 'invitation.revoked',
    resourceType: 'invitation',
    resourceId: invitationId,
    metadata: { email: invitation.email }
  });
}

/**
 * Accept an invitation using the magic token
 */
export async function acceptInvitation(token: string, currentUserId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) throw ApiError.notFound('Invitation');
  if (invitation.status !== 'pending') throw ApiError.badRequest(`Invitation is ${invitation.status}`);
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } });
    throw ApiError.badRequest('Invitation has expired');
  }

  // Find user accepting invite
  const user = await prisma.user.findUnique({ where: { id: currentUserId }});
  
  if (!user || user.email !== invitation.email) {
    throw ApiError.forbidden('You can only accept invitations sent to your own email address.');
  }

  // Add the user to the organization (or change their org entirely. If your architecture supports only 1 org per user, we just update orgId)
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { orgId: invitation.orgId, role: invitation.role }
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted', acceptedAt: new Date() }
    });
  });

  await activityLogService.log({
    orgId: invitation.orgId,
    userId: user.id,
    action: 'user.joined',
    resourceType: 'user',
    resourceId: user.id,
    resourceName: user.name,
    metadata: { role: invitation.role }
  });

  return { success: true, orgId: invitation.orgId };
}
