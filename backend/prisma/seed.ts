import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus, ApiStatus, IncidentSeverity, IncidentStatus, TicketCategory, TicketPriority, TicketStatus, IntegrationType, InvitationStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';
import { generateUniqueSlug } from '../src/utils/slug';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.incidentTimelineEvent.deleteMany();
    await prisma.integrationLog.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.statusSubscriber.deleteMany();
    await prisma.statusPageItem.deleteMany();
    await prisma.statusPage.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.alertRule.deleteMany();
    await prisma.apiCheck.deleteMany();
    await prisma.monitoredApi.deleteMany();
    await prisma.ticketMessage.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  }

  // Create demo organization
  console.log('🏢 Creating demo organization...');
  const org = await prisma.organization.create({
    data: {
      name: 'PulseOps Demo',
      slug: 'pulseops-demo',
      ownerId: '', // Will update after user creation
      website: 'https://pulseops.example.com',
      industry: 'technology',
      companySize: '11-50',
      subscriptionTier: SubscriptionTier.team,
      subscriptionStatus: SubscriptionStatus.active,
      settings: {
        timezone: 'UTC',
        defaultAlertChannels: ['email', 'slack'],
        dataRetentionDays: 90,
      },
    },
  });

  // Create demo users
  console.log('👥 Creating demo users...');
  const passwordHash = await hashPassword('DemoPass123!');

  const owner = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'owner@pulseops.demo',
      name: 'Alice Owner',
      passwordHash,
      role: UserRole.owner,
      phoneNumber: '+15551234567',
      timezone: 'America/New_York',
      isActive: true,
      onboardingCompleted: true,
      notificationSettings: { email: true, push: true },
    },
  });

  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'admin@pulseops.demo',
      name: 'Bob Admin',
      passwordHash,
      role: UserRole.admin,
      phoneNumber: '+15551234568',
      timezone: 'Europe/London',
      isActive: true,
      onboardingCompleted: true,
    },
  });

  const member = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'member@pulseops.demo',
      name: 'Charlie Member',
      passwordHash,
      role: UserRole.member,
      timezone: 'Asia/Tokyo',
      isActive: true,
      onboardingCompleted: true,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'viewer@pulseops.demo',
      name: 'Diana Viewer',
      passwordHash,
      role: UserRole.viewer,
      timezone: 'Australia/Sydney',
      isActive: true,
    },
  });

  const onCall = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'oncall@pulseops.demo',
      name: 'Eve OnCall',
      passwordHash,
      role: UserRole.on_call_engineer,
      phoneNumber: '+15551234569',
      timezone: 'America/Los_Angeles',
      isActive: true,
      onboardingCompleted: true,
    },
  });

  // Update organization owner
  await prisma.organization.update({
    where: { id: org.id },
    data: { ownerId: owner.id },
  });

  // Create notification preferences for users
  console.log('🔔 Creating notification preferences...');
  for (const user of [owner, admin, member, viewer, onCall]) {
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        emailEnabled: true,
        smsEnabled: user.role === UserRole.on_call_engineer,
        pushEnabled: true,
        severityFilter: ['critical', 'high', 'medium', 'low'],
        quietHoursEnabled: user.role !== UserRole.on_call_engineer,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        quietHoursTimezone: user.timezone,
        dailyDigestEnabled: user.role === UserRole.owner || user.role === UserRole.admin,
        weeklyDigestEnabled: true,
        incidentUpdates: true,
        mentionNotify: true,
        teamChangesNotify: true,
      },
    });
  }

  // Create sample monitored APIs
  console.log('🔍 Creating monitored APIs...');
  const apis = await Promise.all([
    prisma.monitoredApi.create({
      data: {
        orgId: org.id,
        name: 'Payment API',
        endpointUrl: 'https://api.stripe.com/v1/payment_intents',
        method: 'GET',
        expectedStatusCodes: [200],
        timeoutSeconds: 10,
        checkIntervalSeconds: 60,
        status: ApiStatus.operational,
        isActive: true,
        headers: { 'Authorization': 'Bearer sk_test_...' },
      },
    }),
    prisma.monitoredApi.create({
      data: {
        orgId: org.id,
        name: 'Auth Service',
        endpointUrl: 'https://auth.pulseops.example.com/health',
        method: 'GET',
        expectedStatusCodes: [200],
        timeoutSeconds: 5,
        checkIntervalSeconds: 30,
        status: ApiStatus.operational,
        isActive: true,
      },
    }),
    prisma.monitoredApi.create({
      data: {
        orgId: org.id,
        name: 'User Dashboard',
        endpointUrl: 'https://app.pulseops.example.com/api/health',
        method: 'GET',
        expectedStatusCodes: [200, 201],
        timeoutSeconds: 15,
        checkIntervalSeconds: 120,
        status: ApiStatus.degraded,
        isActive: true,
      },
    }),
    prisma.monitoredApi.create({
      data: {
        orgId: org.id,
        name: 'Webhook Receiver',
        endpointUrl: 'https://hooks.pulseops.example.com/webhook',
        method: 'POST',
        expectedStatusCodes: [200, 202],
        timeoutSeconds: 30,
        checkIntervalSeconds: 60,
        status: ApiStatus.operational,
        isActive: true,
        body: { test: true },
      },
    }),
  ]);

  // Create alert rules
  console.log('🚨 Creating alert rules...');
  await Promise.all([
    prisma.alertRule.create({
      data: {
        apiId: apis[0].id,
        triggerType: 'downtime',
        condition: { threshold: 1, durationMinutes: 1 },
        isActive: true,
      },
    }),
    prisma.alertRule.create({
      data: {
        apiId: apis[0].id,
        triggerType: 'latency',
        condition: { threshold: 2000, durationMinutes: 5 },
        isActive: true,
      },
    }),
    prisma.alertRule.create({
      data: {
        apiId: apis[1].id,
        triggerType: 'error_rate',
        condition: { threshold: 5, durationMinutes: 10 },
        isActive: true,
      },
    }),
    prisma.alertRule.create({
      data: {
        apiId: apis[2].id,
        triggerType: 'downtime',
        condition: { threshold: 1, durationMinutes: 2 },
        isActive: true,
      },
    }),
  ]);

  // Create sample incidents
  console.log('🚨 Creating sample incidents...');
  const now = new Date();
  const incidents = await Promise.all([
    prisma.incident.create({
      data: {
        orgId: org.id,
        apiId: apis[0].id,
        title: 'Payment API returning 500 errors',
        description: 'Payment API started returning 500 Internal Server Error for all requests. Stripe integration failing.',
        severity: IncidentSeverity.critical,
        status: IncidentStatus.resolved,
        triggeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        acknowledgedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000),
        acknowledgedBy: onCall.id,
        resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
        resolvedBy: admin.id,
        rootCause: 'Stripe API version mismatch in payment client library',
      },
    }),
    prisma.incident.create({
      data: {
        orgId: org.id,
        apiId: apis[1].id,
        title: 'Auth Service high latency',
        description: 'Auth service response time exceeded 2s threshold. Users experiencing slow login.',
        severity: IncidentSeverity.high,
        status: IncidentStatus.acknowledged,
        triggeredAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        acknowledgedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000 + 2 * 60 * 1000),
        acknowledgedBy: onCall.id,
      },
    }),
    prisma.incident.create({
      data: {
        orgId: org.id,
        apiId: apis[2].id,
        title: 'Dashboard intermittent failures',
        description: 'Dashboard API returning 503 intermittently. Database connection pool exhausted.',
        severity: IncidentSeverity.medium,
        status: IncidentStatus.triggered,
        triggeredAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    }),
  ]);

  // Create incident timeline events
  console.log('📝 Creating incident timeline events...');
  for (const incident of incidents) {
    await prisma.incidentTimelineEvent.create({
      data: {
        incidentId: incident.id,
        actorId: null,
        eventType: 'incident_triggered',
        content: `Incident triggered: ${incident.title}`,
        isPublic: true,
        createdAt: incident.triggeredAt,
      },
    });

    if (incident.acknowledgedAt && incident.acknowledgedBy) {
      const ackUser = await prisma.user.findUnique({ where: { id: incident.acknowledgedBy } });
      await prisma.incidentTimelineEvent.create({
        data: {
          incidentId: incident.id,
          actorId: incident.acknowledgedBy,
          eventType: 'acknowledged',
          content: `${ackUser?.name || 'Someone'} acknowledged the incident`,
          isPublic: true,
          createdAt: incident.acknowledgedAt,
        },
      });
    }

    if (incident.resolvedAt && incident.resolvedBy) {
      const resUser = await prisma.user.findUnique({ where: { id: incident.resolvedBy } });
      await prisma.incidentTimelineEvent.create({
        data: {
          incidentId: incident.id,
          actorId: incident.resolvedBy,
          eventType: 'resolved',
          content: `${resUser?.name || 'Someone'} resolved the incident: ${incident.rootCause || 'Root cause identified'}`,
          isPublic: true,
          createdAt: incident.resolvedAt,
        },
      });
    }

    // Add some notes
    await prisma.incidentTimelineEvent.create({
      data: {
        incidentId: incident.id,
        actorId: admin.id,
        eventType: 'note_added',
        content: 'Investigating upstream dependencies',
        isPublic: true,
        createdAt: new Date(incident.triggeredAt.getTime() + 5 * 60 * 1000),
      },
    });

    await prisma.incidentTimelineEvent.create({
      data: {
        incidentId: incident.id,
        actorId: onCall.id,
        eventType: 'note_added',
        content: 'Found issue in payment client v2.1.0 - downgrading to v2.0.5',
        isPublic: false,
        createdAt: new Date(incident.triggeredAt.getTime() + 10 * 60 * 1000),
      },
    });
  }

  // Create sample support tickets
  console.log('🎫 Creating support tickets...');
  const tickets = await Promise.all([
    prisma.supportTicket.create({
      data: {
        orgId: org.id,
        userId: member.id,
        ticketNumber: 'TICKET-0001',
        title: 'Email alerts not working for Payment Gateway',
        description: 'I\'ve configured email alerts for the Payment Gateway API but I\'m not receiving any emails when incidents are triggered. Checked spam folder - nothing there.',
        category: TicketCategory.technical_support,
        priority: TicketPriority.high,
        status: TicketStatus.resolved,
        assignedTo: admin.id,
        tags: ['email', 'alerts', 'payment-gateway'],
        resolvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.supportTicket.create({
      data: {
        orgId: org.id,
        userId: viewer.id,
        ticketNumber: 'TICKET-0002',
        title: 'Feature Request: Dark mode for dashboard',
        description: 'Would love to have a dark mode option for the dashboard. Working late nights and the bright theme is harsh on eyes.',
        category: TicketCategory.feature_request,
        priority: TicketPriority.low,
        status: TicketStatus.open,
        tags: ['ui', 'dark-mode', 'dashboard'],
      },
    }),
    prisma.supportTicket.create({
      data: {
        orgId: org.id,
        userId: member.id,
        ticketNumber: 'TICKET-0003',
        title: 'Billing question about team plan',
        description: 'Our team is growing and we\'re looking at the Team plan. Can you clarify what happens if we exceed the API limit?',
        category: TicketCategory.billing,
        priority: TicketPriority.medium,
        status: TicketStatus.in_progress,
        assignedTo: admin.id,
        tags: ['billing', 'team-plan', 'limits'],
      },
    }),
  ]);

  // Create ticket messages
  console.log('💬 Creating ticket messages...');
  await Promise.all([
    prisma.ticketMessage.create({
      data: {
        ticketId: tickets[0].id,
        userId: member.id,
        message: 'I\'ve configured email alerts for the Payment Gateway API but I\'m not receiving any emails when incidents are triggered. Checked spam folder - nothing there.',
        isInternal: false,
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: tickets[0].id,
        userId: admin.id,
        message: 'Hi! Thanks for reporting this. Let me check the email configuration for your organization.',
        isInternal: false,
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: tickets[0].id,
        userId: admin.id,
        message: 'Found the issue! The email integration was using an outdated SendGrid API key. Updated it now.',
        isInternal: false,
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: tickets[0].id,
        userId: member.id,
        message: 'Working now! Thanks for the quick fix. Test alert came through immediately.',
        isInternal: false,
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: tickets[1].id,
        userId: viewer.id,
        message: 'Would love to have a dark mode option for the dashboard. Working late nights and the bright theme is harsh on eyes.',
        isInternal: false,
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: tickets[2].id,
        userId: member.id,
        message: 'Our team is growing and we\'re looking at the Team plan. Can you clarify what happens if we exceed the API limit?',
        isInternal: false,
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: tickets[2].id,
        userId: admin.id,
        message: 'Great question! On the Team plan, if you exceed the API limit, we\'ll notify you at 80% and 95% usage. No hard cutoff - you can continue monitoring but we\'ll discuss upgrading.',
        isInternal: false,
      },
    }),
  ]);

  // Create sample contacts
  console.log('📇 Creating contacts...');
  await Promise.all([
    prisma.contact.create({
      data: {
        orgId: org.id,
        name: 'Stripe Support',
        email: 'support@stripe.com',
        phoneNumber: '+1-888-926-2287',
        role: 'Payment Processor Support',
        company: 'Stripe',
        notes: 'Primary contact for payment API issues. Available 24/7 for critical issues.',
        isActive: true,
        createdBy: admin.id,
      },
    }),
    prisma.contact.create({
      data: {
        orgId: org.id,
        name: 'AWS Enterprise Support',
        email: 'aws-support@amazon.com',
        phoneNumber: '+1-800-555-0199',
        role: 'Cloud Infrastructure Support',
        company: 'Amazon Web Services',
        notes: 'Enterprise support for EC2, RDS, and Lambda issues. Case ID: 123456789',
        isActive: true,
        createdBy: owner.id,
      },
    }),
    prisma.contact.create({
      data: {
        orgId: org.id,
        name: 'PagerDuty On-Call',
        email: 'oncall@pagerduty.com',
        phoneNumber: '+1-844-700-3889',
        role: 'Incident Management',
        company: 'PagerDuty',
        notes: 'Escalation contact for critical incidents. Integrated with our alerting.',
        isActive: true,
        createdBy: onCall.id,
      },
    }),
  ]);

  // Create integrations
  console.log('🔗 Creating integrations...');
  await Promise.all([
    prisma.integration.create({
      data: {
        orgId: org.id,
        type: IntegrationType.discord,
        name: 'DevOps Alerts',
        config: {
          webhookUrl: 'https://discord.com/api/webhooks/...',
          channel: '#devops-alerts',
          username: 'PulseOps Bot',
          avatarUrl: 'https://pulseops.example.com/bot.png',
        },
        isActive: true,
        lastSuccessAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        failureCount: 0,
      },
    }),
    prisma.integration.create({
      data: {
        orgId: org.id,
        type: IntegrationType.webhook,
        name: 'Slack Notifications',
        config: {
          webhookUrl: 'https://hooks.slack.com/services/...',
          channel: '#alerts',
          username: 'PulseOps',
          iconEmoji: ':pulseops:',
        },
        isActive: true,
        lastSuccessAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        failureCount: 0,
      },
    }),
    prisma.integration.create({
      data: {
        orgId: org.id,
        type: IntegrationType.email,
        name: 'Team Email Digest',
        config: {
          recipients: ['team@pulseops.example.com', 'manager@pulseops.example.com'],
          template: 'daily-digest',
          schedule: '0 9 * * *',
        },
        isActive: true,
        lastSuccessAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        failureCount: 0,
      },
    }),
  ]);

  // Create status page
  console.log('📄 Creating status page...');
  const statusPage = await prisma.statusPage.create({
    data: {
      orgId: org.id,
      subdomain: 'pulseops-demo',
      customDomain: 'status.pulseops.example.com',
      headerText: 'PulseOps Status - Real-time service status',
      supportEmail: 'support@pulseops.example.com',
      isPublic: true,
    },
  });

  await Promise.all([
    prisma.statusPageItem.create({
      data: {
        statusPageId: statusPage.id,
        apiId: apis[0].id,
        displayName: 'Payment Processing',
        displayOrder: 1,
        isVisible: true,
      },
    }),
    prisma.statusPageItem.create({
      data: {
        statusPageId: statusPage.id,
        apiId: apis[1].id,
        displayName: 'Authentication Service',
        displayOrder: 2,
        isVisible: true,
      },
    }),
    prisma.statusPageItem.create({
      data: {
        statusPageId: statusPage.id,
        apiId: apis[2].id,
        displayName: 'User Dashboard',
        displayOrder: 3,
        isVisible: true,
      },
    }),
    prisma.statusPageItem.create({
      data: {
        statusPageId: statusPage.id,
        apiId: apis[3].id,
        displayName: 'Webhook Receiver',
        displayOrder: 4,
        isVisible: false,
      },
    }),
  ]);

  await prisma.statusSubscriber.create({
    data: {
      statusPageId: statusPage.id,
      email: 'customer1@example.com',
      token: 'sub-token-1',
      isActive: true,
    },
  });

  // Create activity logs
  console.log('📋 Creating activity logs...');
  const actions = [
    { action: 'user.login', userId: owner.id, resourceType: 'user', resourceId: owner.id, metadata: { ip: '192.168.1.1' } },
    { action: 'api.create', userId: owner.id, resourceType: 'api', resourceId: apis[0].id, resourceName: apis[0].name },
    { action: 'api.create', userId: admin.id, resourceType: 'api', resourceId: apis[1].id, resourceName: apis[1].name },
    { action: 'incident.triggered', userId: null, resourceType: 'incident', resourceId: incidents[0].id, resourceName: incidents[0].title, metadata: { severity: 'critical' } },
    { action: 'incident.acknowledged', userId: onCall.id, resourceType: 'incident', resourceId: incidents[0].id, resourceName: incidents[0].title },
    { action: 'incident.resolved', userId: admin.id, resourceType: 'incident', resourceId: incidents[0].id, resourceName: incidents[0].title, metadata: { rootCause: 'Stripe API version mismatch' } },
    { action: 'ticket.created', userId: member.id, resourceType: 'ticket', resourceId: tickets[0].id, resourceName: tickets[0].title },
    { action: 'ticket.resolved', userId: admin.id, resourceType: 'ticket', resourceId: tickets[0].id, resourceName: tickets[0].title },
    { action: 'user.invite', userId: admin.id, resourceType: 'invitation', resourceId: 'inv-1', resourceName: 'newmember@example.com' },
    { action: 'organization.updated', userId: owner.id, resourceType: 'organization', resourceId: org.id, resourceName: org.name, changes: { subscriptionTier: ['free', 'team'] } },
  ];

  for (const a of actions) {
    await prisma.activityLog.create({
      data: {
        orgId: org.id,
        userId: a.userId,
        action: a.action,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        resourceName: a.resourceName,
        changes: a.changes || null,
        metadata: a.metadata || null,
        ipAddress: a.metadata?.ip || '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Create invitations
  console.log('📨 Creating invitations...');
  await prisma.invitation.create({
    data: {
      orgId: org.id,
      email: 'newdev@pulseops.demo',
      role: UserRole.member,
      invitedBy: admin.id,
      token: 'invite-token-abc123',
      message: 'Welcome to the team! Please join us on PulseOps.',
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: InvitationStatus.pending,
    },
  });

  await prisma.invitation.create({
    data: {
      orgId: org.id,
      email: 'contractor@pulseops.demo',
      role: UserRole.viewer,
      invitedBy: owner.id,
      token: 'invite-token-xyz789',
      message: 'Contractor access for Q4 project',
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: InvitationStatus.pending,
    },
  });

  // Create API checks (sample health check history)
  console.log('✅ Creating API check history...');
  for (const api of apis) {
    const checks = [];
    for (let i = 0; i < 100; i++) {
      const checkedAt = new Date(now.getTime() - i * api.checkIntervalSeconds * 1000);
      const isSuccess = api.status === ApiStatus.operational ? Math.random() > 0.02 : Math.random() > 0.15;
      checks.push({
        apiId: api.id,
        statusCode: isSuccess ? 200 : (Math.random() > 0.5 ? 500 : 503),
        responseTimeMs: isSuccess ? Math.floor(Math.random() * 300) + 50 : Math.floor(Math.random() * 5000) + 3000,
        errorMessage: isSuccess ? null : 'Connection timeout',
        isSuccess,
        checkedAt,
      });
    }
    await prisma.apiCheck.createMany({ data: checks });
  }

  console.log('✅ Database seed completed successfully!');
  console.log(`
📊 Seed Summary:
  - Organization: ${org.name} (${org.slug})
  - Users: ${5} (Owner, Admin, Member, Viewer, On-Call)
  - Monitored APIs: ${apis.length}
  - Incidents: ${incidents.length}
  - Support Tickets: ${tickets.length}
  - Contacts: 3
  - Integrations: 3
  - Status Page: 1 (${statusPage.subdomain}.pulseops.example.com)
  - Activity Logs: ${actions.length}
  - Invitations: 2

🔑 Demo Credentials:
  Owner:    owner@pulseops.demo    / DemoPass123!
  Admin:    admin@pulseops.demo    / DemoPass123!
  Member:   member@pulseops.demo   / DemoPass123!
  Viewer:   viewer@pulseops.demo   / DemoPass123!
  On-Call:  oncall@pulseops.demo   / DemoPass123!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });