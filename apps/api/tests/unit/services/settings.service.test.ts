import settingsService from '../../../src/services/settings.service';
import { testHelpers } from '../../helpers';

describe('SettingsService', () => {
  let tenantId: string;

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;
  });

  afterEach(async () => {
    if (tenantId) {
      await testHelpers.cleanupTestData(tenantId);
    }
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  describe('getSettings', () => {
    it('should create default settings if none exist', async () => {
      const settings = await settingsService.getSettings(tenantId);
      expect(settings).toBeDefined();
      expect(settings.name).toBe('My Church');
      expect(settings.timezone).toBe('America/New_York');
    });

    it('should return existing settings', async () => {
      // First call creates settings
      await settingsService.getSettings(tenantId);
      // Second call should return the same settings
      const settings = await settingsService.getSettings(tenantId);
      expect(settings).toBeDefined();
    });
  });

  describe('updateSettings', () => {
    it('should update church settings', async () => {
      const updates = {
        name: 'Updated Church Name',
        email: 'updated@church.com',
        phone: '+1234567890',
        website: 'https://updated.church.com',
        address: '123 New Street',
        city: 'New City',
        state: 'NY',
        zip: '10001',
        country: 'United States',
      };

      const settings = await settingsService.updateSettings(tenantId, updates);
      expect(settings.name).toBe('Updated Church Name');
      expect(settings.email).toBe('updated@church.com');
      expect(settings.city).toBe('New City');
    });
  });

  describe('Service Times', () => {
    it('should add a service time', async () => {
      const serviceTime = await settingsService.addServiceTime(tenantId, {
        day: 'SUNDAY',
        time: '10:00 AM',
        name: 'Sunday Service',
      });

      expect(serviceTime.day).toBe('SUNDAY');
      expect(serviceTime.time).toBe('10:00 AM');
      expect(serviceTime.name).toBe('Sunday Service');
    });

    it('should get service times via settings', async () => {
      await settingsService.addServiceTime(tenantId, {
        day: 'SUNDAY',
        time: '10:00 AM',
        name: 'Morning Service',
      });
      await settingsService.addServiceTime(tenantId, {
        day: 'WEDNESDAY',
        time: '7:00 PM',
        name: 'Midweek Service',
      });

      const settings = await settingsService.getSettings(tenantId);
      expect(settings.serviceTimes).toBeDefined();
      expect(settings.serviceTimes.length).toBe(2);
    });

    it('should delete a service time', async () => {
      const serviceTime = await settingsService.addServiceTime(tenantId, {
        day: 'SUNDAY',
        time: '10:00 AM',
        name: 'Test Service',
      });

      const result = await settingsService.deleteServiceTime(serviceTime.id, tenantId);
      expect(result.message).toContain('deleted');

      const settings = await settingsService.getSettings(tenantId);
      expect(settings.serviceTimes.length).toBe(0);
    });
  });
});
