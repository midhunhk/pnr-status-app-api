import { describe, it, expect, beforeEach } from 'vitest';
import serviceManager from '../../src/services/service.manager.js';

describe('ServiceManager', () => {
  beforeEach(() => {
    serviceManager.clearCache();
  });

  it('should load service configuration successfully', async () => {
    const config = await serviceManager.loadConfig();
    expect(config.services).toBeDefined();
    expect(config.services.length).toBeGreaterThan(0);
  });

  it('should execute stubbed service (id: 2 - railyatri)', async () => {
    const result = await serviceManager.execute('2', '6327949227');
    expect(result.status).toBe('READY');
    expect(result.service).toBe('rail-yatri');
    expect(result.pnrNo).toBe('6327949227');
    expect(result.trainDetails).toBeDefined();
  });

  it('should reject disabled service (id: 1)', async () => {
    await expect(serviceManager.execute('1', '6327949227')).rejects.toThrow(
      'Service id 1 is disabled.'
    );
  });

  it('should reject invalid service (id: 999)', async () => {
    await expect(serviceManager.execute('999', '6327949227')).rejects.toThrow(
      'Service id 999 is invalid.'
    );
  });
});
