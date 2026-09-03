import { describe, it, expect } from 'vitest';
import railyatriService from '../../src/services/railyatri.service.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('RailYatriService', () => {
  it('should generate valid request config', () => {
    const config = railyatriService.getConfig('6327949227');
    expect(config.method).toBe('get');
    expect(config.url).toBe('https://www.railyatri.in/pnr-status/6327949227');
  });

  it('should parse RailYatri HTML response stub', async () => {
    const stubPath = path.resolve(__dirname, '../../src/stubs/railyatri_response.html');
    const stubContent = await fs.readFile(stubPath, 'utf-8');

    const parsed = railyatriService.parseResponse(stubContent);
    expect(parsed.trainDetails.trainNo).toBe('18117');
    expect(parsed.trainDetails.trainFrom).toBe('ROURKELA | ROU');
    expect(parsed.trainDetails.trainTo).toBe('BHUBANESWAR | BBS');
    expect(parsed.travelDetails.bookingStatus).toBe('CNF');
    expect(parsed.travelDetails.currentStatus).toBe('CNF');
    expect(parsed.passengerDetails).toBeDefined();
    expect(parsed.pasengerDetails).toBeDefined();
  });
});
