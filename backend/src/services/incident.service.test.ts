import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import { 
  createIncident, 
  getIncidents, 
  getIncidentById, 
  acknowledgeIncident, 
  resolveIncident,
  addTimelineEvent,
  getIncidentTimeline,
  getIncidentStats
} from './incident.service';
import { activityLogService } from './activityLog.service';

const mockPrisma = prisma as any;

describe('Incident Service', () => {
  const mockUser = {
    id: 'user-1',
    orgId: 'org-1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'member',
    isActive: true,
  };

  const mockApi = {
    id: 'api-1',
    orgId: 'org-1',
    name: 'Payment API',
    endpointUrl: 'https://api.example.com/payment',
  };

  const mockIncident = {
    id: 'incident-1',
    orgId: 'org-1',
    apiId: 'api-1',
    title: 'Payment API Down',
    description: 'Payment API returning 500 errors',
    severity: 'critical',
    status: 'triggered',
    triggeredAt: new Date(),
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    rootCause: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    api: mockApi,
    acknowledger: null,
    resolver: null,
    timeline: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createIncident', () => {
    it('should create incident successfully', async () => {
      mockPrisma.incident.create.mockResolvedValue(mockIncident);
      mockPrisma.incidentTimelineEvent.create.mockResolvedValue({
        id: 'timeline-1',
        incidentId: 'incident-1',
        actorId: null,
        eventType: 'incident_triggered',
        content: 'Incident triggered: Payment API Down',
        isPublic: true,
        createdAt: new Date(),
      });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await createIncident({
        orgId: 'org-1',
        apiId: 'api-1',
        title: 'Payment API Down',
        description: 'Payment API returning 500 errors',
        severity: 'critical',
      });

      expect(result).toEqual(mockIncident);
      expect(mockPrisma.incident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: 'org-1',
            apiId: 'api-1',
            title: 'Payment API Down',
            severity: 'critical',
            status: 'triggered',
          }),
        })
      );
    });

    it('should create incident without apiId', async () => {
      const incidentNoApi = { ...mockIncident, apiId: null, api: null };
      mockPrisma.incident.create.mockResolvedValue(incidentNoApi);
      mockPrisma.incidentTimelineEvent.create.mockResolvedValue({});
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await createIncident({
        orgId: 'org-1',
        title: 'Manual Incident',
        description: 'Manually created',
        severity: 'high',
      });

      expect(result.apiId).toBeNull();
    });
  });

  describe('getIncidents', () => {
    it('should return paginated incidents', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([mockIncident]);
      mockPrisma.incident.count.mockResolvedValue(1);

      const result = await getIncidents('org-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('should filter by status', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([mockIncident]);
      mockPrisma.incident.count.mockResolvedValue(1);

      await getIncidents('org-1', { page: 1, limit: 20, status: 'triggered' });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', status: 'triggered' }),
        })
      );
    });

    it('should filter by severity', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([mockIncident]);
      mockPrisma.incident.count.mockResolvedValue(1);

      await getIncidents('org-1', { page: 1, limit: 20, severity: 'critical' });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', severity: 'critical' }),
        })
      );
    });
  });

  describe('getIncidentById', () => {
    it('should return incident with relations', async () => {
      const incidentWithRelations = { ...mockIncident, timeline: [], integrationLogs: [] };
      mockPrisma.incident.findUnique.mockResolvedValue(incidentWithRelations);

      const result = await getIncidentById('incident-1', 'org-1');

      expect(result).toEqual(incidentWithRelations);
    });
  });

  describe('acknowledgeIncident', () => {
    it('should acknowledge incident', async () => {
      const acknowledgedIncident = { 
        ...mockIncident, 
        status: 'acknowledged', 
        acknowledgedAt: new Date(), 
        acknowledgedBy: 'user-1',
        acknowledger: mockUser,
      };
      mockPrisma.incident.findUnique.mockResolvedValue(mockIncident);
      mockPrisma.incident.update.mockResolvedValue(acknowledgedIncident);
      mockPrisma.incidentTimelineEvent.create.mockResolvedValue({});
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await acknowledgeIncident('incident-1', 'org-1', 'user-1');

      expect(result.status).toBe('acknowledged');
      expect(result.acknowledgedBy).toBe('user-1');
      expect(result.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('should throw if already acknowledged', async () => {
      mockPrisma.incident.findUnique.mockResolvedValue({ 
        ...mockIncident, 
        status: 'acknowledged', 
        acknowledgedAt: new Date() 
      });

      await expect(acknowledgeIncident('incident-1', 'org-1', 'user-1'))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });
  });

  describe('resolveIncident', () => {
    it('should resolve incident with root cause', async () => {
      const resolvedIncident = { 
        ...mockIncident, 
        status: 'resolved', 
        resolvedAt: new Date(), 
        resolvedBy: 'user-1',
        rootCause: 'Database connection pool exhausted',
        resolver: mockUser,
      };
      mockPrisma.incident.findUnique.mockResolvedValue({ ...mockIncident, status: 'acknowledged' });
      mockPrisma.incident.update.mockResolvedValue(resolvedIncident);
      mockPrisma.incidentTimelineEvent.create.mockResolvedValue({});
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await resolveIncident('incident-1', 'org-1', 'user-1', 'Database connection pool exhausted');

      expect(result.status).toBe('resolved');
      expect(result.resolvedBy).toBe('user-1');
      expect(result.rootCause).toBe('Database connection pool exhausted');
    });
  });

  describe('addTimelineEvent', () => {
    it('should add public timeline event', async () => {
      mockPrisma.incident.findUnique.mockResolvedValue(mockIncident);
      mockPrisma.incidentTimelineEvent.create.mockResolvedValue({
        id: 'timeline-1',
        incidentId: 'incident-1',
        actorId: 'user-1',
        eventType: 'note_added',
        content: 'Investigating database connections',
        isPublic: true,
        createdAt: new Date(),
      });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await addTimelineEvent('incident-1', 'org-1', 'user-1', 'note_added', 'Investigating database connections', true);

      expect(result.isPublic).toBe(true);
      expect(result.content).toBe('Investigating database connections');
    });

    it('should add internal timeline event', async () => {
      mockPrisma.incident.findUnique.mockResolvedValue(mockIncident);
      mockPrisma.incidentTimelineEvent.create.mockResolvedValue({
        id: 'timeline-1',
        incidentId: 'incident-1',
        actorId: 'user-1',
        eventType: 'internal_note',
        content: 'Internal: checking logs',
        isPublic: false,
        createdAt: new Date(),
      });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await addTimelineEvent('incident-1', 'org-1', 'user-1', 'internal_note', 'Internal: checking logs', false);

      expect(result.isPublic).toBe(false);
    });
  });

  describe('getIncidentTimeline', () => {
    it('should return timeline events', async () => {
      const timelineEvents = [
        { id: 't1', incidentId: 'incident-1', eventType: 'incident_triggered', content: 'Triggered', isPublic: true, createdAt: new Date() },
        { id: 't2', incidentId: 'incident-1', eventType: 'acknowledged', content: 'Acknowledged', isPublic: true, createdAt: new Date() },
      ];
      mockPrisma.incidentTimelineEvent.findMany.mockResolvedValue(timelineEvents);

      const result = await getIncidentTimeline('incident-1', 'org-1');

      expect(result).toEqual(timelineEvents);
    });
  });

  describe('getIncidentStats', () => {
    it('should return incident statistics', async () => {
      mockPrisma.incident.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(2)   // triggered
        .mockResolvedValueOnce(3)   // acknowledged
        .mockResolvedValueOnce(1)   // investigating
        .mockResolvedValueOnce(4);  // resolved

      const result = await getIncidentStats('org-1');

      expect(result).toEqual({
        total: 10,
        triggered: 2,
        acknowledged: 3,
        investigating: 1,
        resolved: 4,
      });
    });
  });
});