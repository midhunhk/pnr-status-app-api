import { describe, it, expect } from 'vitest';
import erailsService from '../../src/services/erails.service.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('ErailsService', () => {
  it('should generate valid request config', () => {
    const config = erailsService.getConfig('1234567890');
    expect(config.method).toBe('get');
    expect(config.url).toContain('Data1=1234567890');
  });

  it('should parse valid Erails JSON response stub', async () => {
    const stubPath = path.resolve(__dirname, '../../src/stubs/erails_response.json');
    const stubContent = await fs.readFile(stubPath, 'utf-8');
    
    const parsed = erailsService.parseResponse(stubContent);
    expect(parsed.status).toBe('SUCCESS');
    expect(parsed.pnrNo).toBe('6327949227');
    expect(parsed.passengersCount).toBe(2);
    expect(parsed.trainDetails).toEqual({
      trainNo: '18117',
      trainName: 'RAJYA RANI EXP',
      trainFrom: 'ROU',
      trainTo: 'BBS',
    });
    expect(parsed.passengerDetails).toHaveLength(2);
    expect(parsed.pasengerDetails).toHaveLength(2);
  });

  it('should parse error Erails JSON response stub gracefully', async () => {
    const stubPath = path.resolve(__dirname, '../../src/stubs/erails_error_response.json');
    const stubContent = await fs.readFile(stubPath, 'utf-8');

    const parsed = erailsService.parseResponse(stubContent);
    expect(parsed.status).toBe('FAILURE');
    expect(parsed.message).toBe('FLUSHED PNR / PNR NOT YET GENERATED');
  });
});
